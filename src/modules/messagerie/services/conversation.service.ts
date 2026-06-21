import type { MessageSenderRole } from '@prisma/client';
import { conversationRepository } from '../repository/conversation.repository';
import type {
  ConversationDetailDto,
  ConversationResume,
  CreerConversationDto,
  EnvoyerMessageDto,
  MessageDto,
} from '../types';

function toMessageDto(msg: {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  type: MessageDto['type'];
  contenu: string | null;
  fichierUrl: string | null;
  fichierNom: string | null;
  fichierTaille: number | null;
  dureeMs: number | null;
  luLe: Date | null;
  createdAt: Date;
}): MessageDto {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderRole: msg.senderRole,
    type: msg.type,
    contenu: msg.contenu,
    fichierUrl: msg.fichierUrl,
    fichierNom: msg.fichierNom,
    fichierTaille: msg.fichierTaille,
    dureeMs: msg.dureeMs,
    luLe: msg.luLe,
    createdAt: msg.createdAt,
  };
}

function toResume(conv: {
  id: string;
  clientNom: string;
  clientTelephone: string | null;
  sujet: string | null;
  dernierMessage: string | null;
  dernierMessageAt: Date | null;
  nonLuVendeur: number;
  nonLuClient: number;
  createdAt: Date;
  updatedAt: Date;
}): ConversationResume {
  return {
    id: conv.id,
    clientNom: conv.clientNom,
    clientTelephone: conv.clientTelephone,
    sujet: conv.sujet,
    dernierMessage: conv.dernierMessage,
    dernierMessageAt: conv.dernierMessageAt,
    nonLuVendeur: conv.nonLuVendeur,
    nonLuClient: conv.nonLuClient,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  };
}

export class ConversationService {
  private readonly repo = conversationRepository;

  async creerConversation(dto: CreerConversationDto) {
    const conv = await this.repo.creer(dto);
    return toResume(conv!);
  }

  async listerPourClient(clientSessionId: string): Promise<ConversationResume[]> {
    const list = await this.repo.listerParSession(clientSessionId);
    return list.map(toResume);
  }

  async listerPourAdmin(): Promise<ConversationResume[]> {
    const list = await this.repo.listerToutes();
    return list.map(toResume);
  }

  async obtenirDetail(
    conversationId: string,
    readerRole: MessageSenderRole,
    options?: { marquerLu?: boolean },
  ): Promise<ConversationDetailDto | null> {
    const conv = await this.repo.trouverParId(conversationId);
    if (!conv) return null;

    if (options?.marquerLu !== false) {
      await this.repo.marquerCommeLu(conversationId, readerRole);
    }

    const [messages, presence] = await Promise.all([
      this.repo.listerMessages(conversationId),
      this.repo.obtenirPresences(conversationId),
    ]);

    return {
      ...toResume(conv),
      messages: messages.map(toMessageDto),
      presence,
      updatedAt: conv.updatedAt.toISOString(),
    };
  }

  async envoyerMessage(conversationId: string, dto: EnvoyerMessageDto) {
    const msg = await this.repo.envoyerMessage(conversationId, dto);
    return toMessageDto(msg);
  }

  async heartbeat(
    conversationId: string,
    role: 'CLIENT' | 'VENDEUR',
    participantId: string,
    isTyping?: boolean,
  ) {
    await this.repo.mettreAJourPresence(conversationId, role, participantId, { isTyping });
    return this.repo.obtenirPresences(conversationId);
  }

  async obtenirSnapshot(conversationId: string) {
    return this.obtenirDetail(conversationId, 'CLIENT', { marquerLu: false });
  }

  async peutAccederClient(conversationId: string, clientSessionId: string): Promise<boolean> {
    const conv = await this.repo.trouverParId(conversationId);
    return conv?.clientSessionId === clientSessionId;
  }
}

export const conversationService = new ConversationService();
