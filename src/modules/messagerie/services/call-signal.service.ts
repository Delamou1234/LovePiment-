import type { CallSignalType, MessageSenderRole } from '@prisma/client';
import { callSignalRepository } from '../repository/call-signal.repository';

export type CallSignalDto = {
  id: string;
  fromRole: MessageSenderRole;
  type: CallSignalType;
  payload: unknown;
  createdAt: string;
};

function toDto(signal: {
  id: string;
  fromRole: MessageSenderRole;
  type: CallSignalType;
  payload: string;
  createdAt: Date;
}): CallSignalDto {
  let payload: unknown = {};
  try {
    payload = JSON.parse(signal.payload);
  } catch {
    payload = {};
  }
  return {
    id: signal.id,
    fromRole: signal.fromRole,
    type: signal.type,
    payload,
    createdAt: signal.createdAt.toISOString(),
  };
}

export class CallSignalService {
  private readonly repo = callSignalRepository;

  async envoyer(
    conversationId: string,
    fromRole: MessageSenderRole,
    type: CallSignalType,
    payload?: unknown,
  ) {
    const signal = await this.repo.creer(conversationId, fromRole, type, payload);
    return toDto(signal);
  }

  async listerDepuis(conversationId: string, sinceIso: string) {
    const since = new Date(sinceIso);
    const list = Number.isNaN(since.getTime())
      ? await this.repo.listerDepuis(conversationId, new Date(0))
      : await this.repo.listerDepuis(conversationId, since);
    return list.map(toDto);
  }

  async terminer(conversationId: string) {
    await this.repo.supprimerPourConversation(conversationId);
  }
}

export const callSignalService = new CallSignalService();
