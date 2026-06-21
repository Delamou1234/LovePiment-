import type { ChatParticipantRole, MessageSenderRole, MessageType } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import type { CreerConversationDto, EnvoyerMessageDto } from '../types';

const PRESENCE_ONLINE_MS = 60_000;

function resumeMessage(msg: EnvoyerMessageDto): string {
  if (msg.contenu?.trim()) return msg.contenu.trim().slice(0, 120);
  switch (msg.type) {
    case 'IMAGE':
      return '📷 Photo';
    case 'DOCUMENT':
      return '📎 Document';
    case 'VOICE':
      return '🎤 Message vocal';
    default:
      return 'Message';
  }
}

export class ConversationRepository {
  async creer(dto: CreerConversationDto) {
    const conversation = await prisma.conversation.create({
      data: {
        clientSessionId: dto.clientSessionId,
        clientUserId: dto.clientUserId,
        clientNom: dto.clientNom,
        clientTelephone: dto.clientTelephone,
        sujet: dto.sujet,
        orderId: dto.orderId,
      },
    });

    if (dto.messageInitial?.trim()) {
      await this.envoyerMessage(conversation.id, {
        senderRole: 'CLIENT',
        type: 'TEXT',
        contenu: dto.messageInitial.trim(),
      });
      return this.trouverParId(conversation.id);
    }

    return conversation;
  }

  async trouverParId(id: string) {
    return prisma.conversation.findUnique({ where: { id } });
  }

  async obtenirIndicateurMaj(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      select: { updatedAt: true, dernierMessageAt: true },
    });
  }

  async listerParSession(clientSessionId: string, clientUserId?: string | null) {
    if (clientUserId) {
      return prisma.conversation.findMany({
        where: { clientUserId },
        orderBy: { dernierMessageAt: 'desc' },
      });
    }
    return prisma.conversation.findMany({
      where: { clientSessionId },
      orderBy: { dernierMessageAt: 'desc' },
    });
  }

  async trouverSupport(clientSessionId: string, clientUserId?: string | null) {
    if (clientUserId) {
      return prisma.conversation.findFirst({
        where: { clientUserId },
        orderBy: { createdAt: 'asc' },
      });
    }
    return prisma.conversation.findFirst({
      where: { clientSessionId, sujet: 'Support KabiShop' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async lierSessionAuUser(clientSessionId: string, clientUserId: string) {
    await prisma.conversation.updateMany({
      where: { clientSessionId, clientUserId: null },
      data: { clientUserId },
    });
  }

  async listerToutes(limit = 50) {
    return prisma.conversation.findMany({
      orderBy: { dernierMessageAt: 'desc' },
      take: limit,
    });
  }

  async listerMessages(conversationId: string, limit = 100) {
    return prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async envoyerMessage(conversationId: string, dto: EnvoyerMessageDto) {
    const type: MessageType = dto.type ?? 'TEXT';
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderRole: dto.senderRole,
        type,
        contenu: dto.contenu,
        fichierUrl: dto.fichierUrl,
        fichierNom: dto.fichierNom,
        fichierTaille: dto.fichierTaille,
        dureeMs: dto.dureeMs,
      },
    });

    const preview = resumeMessage({ ...dto, type });
    const nonLuUpdate =
      dto.senderRole === 'CLIENT'
        ? { nonLuVendeur: { increment: 1 } }
        : { nonLuClient: { increment: 1 } };

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        dernierMessage: preview,
        dernierMessageAt: message.createdAt,
        ...nonLuUpdate,
      },
    });

    return message;
  }

  async marquerCommeLu(conversationId: string, readerRole: MessageSenderRole) {
    const senderToMark = readerRole === 'CLIENT' ? 'VENDEUR' : 'CLIENT';

    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderRole: senderToMark,
        luLe: null,
      },
      data: { luLe: new Date() },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(readerRole === 'CLIENT' ? { nonLuClient: 0 } : { nonLuVendeur: 0 }),
        updatedAt: new Date(),
      },
    });
  }

  async mettreAJourPresence(
    conversationId: string,
    role: ChatParticipantRole,
    participantId: string,
    data?: { isTyping?: boolean },
  ) {
    return prisma.chatPresence.upsert({
      where: {
        conversationId_role_participantId: {
          conversationId,
          role,
          participantId,
        },
      },
      create: {
        conversationId,
        role,
        participantId,
        isTyping: data?.isTyping ?? false,
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
        ...(data?.isTyping !== undefined ? { isTyping: data.isTyping } : {}),
      },
    });
  }

  async obtenirPresences(conversationId: string) {
    const presences = await prisma.chatPresence.findMany({
      where: { conversationId },
    });
    const now = Date.now();
    return presences.map((p) => ({
      role: p.role,
      participantId: p.participantId,
      lastSeenAt: p.lastSeenAt.toISOString(),
      isTyping: p.isTyping,
      enLigne: now - p.lastSeenAt.getTime() < PRESENCE_ONLINE_MS,
    }));
  }

  async snapshotUpdatedAt(conversationId: string): Promise<string> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { updatedAt: true },
    });
    return conv?.updatedAt.toISOString() ?? '';
  }
}

export const conversationRepository = new ConversationRepository();
