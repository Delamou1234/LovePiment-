import type { ChatMessage, Conversation, MessageSenderRole, MessageType } from '@prisma/client';

export type ConversationResume = Pick<
  Conversation,
  | 'id'
  | 'clientNom'
  | 'clientTelephone'
  | 'sujet'
  | 'dernierMessage'
  | 'dernierMessageAt'
  | 'nonLuVendeur'
  | 'nonLuClient'
  | 'createdAt'
  | 'updatedAt'
>;

export type MessageDto = Pick<
  ChatMessage,
  | 'id'
  | 'conversationId'
  | 'senderRole'
  | 'type'
  | 'contenu'
  | 'fichierUrl'
  | 'fichierNom'
  | 'fichierTaille'
  | 'dureeMs'
  | 'luLe'
  | 'createdAt'
>;

export type PresenceDto = {
  role: 'CLIENT' | 'VENDEUR';
  participantId: string;
  lastSeenAt: string;
  isTyping: boolean;
  enLigne: boolean;
};

export type ConversationDetailDto = ConversationResume & {
  messages: MessageDto[];
  presence: PresenceDto[];
  updatedAt: string;
};

export type CreerConversationDto = {
  clientSessionId: string;
  clientUserId?: string;
  clientNom: string;
  clientTelephone?: string;
  sujet?: string;
  orderId?: string;
  messageInitial?: string;
};

export type EnvoyerMessageDto = {
  senderRole: MessageSenderRole;
  type?: MessageType;
  contenu?: string;
  fichierUrl?: string;
  fichierNom?: string;
  fichierTaille?: number;
  dureeMs?: number;
};
