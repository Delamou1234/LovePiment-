import type { CallSignalType, MessageSenderRole } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

export class CallSignalRepository {
  async creer(
    conversationId: string,
    fromRole: MessageSenderRole,
    type: CallSignalType,
    payload: unknown,
  ) {
    return prisma.chatCallSignal.create({
      data: {
        conversationId,
        fromRole,
        type,
        payload: JSON.stringify(payload ?? {}),
      },
    });
  }

  async listerDepuis(conversationId: string, since: Date) {
    return prisma.chatCallSignal.findMany({
      where: { conversationId, createdAt: { gt: since } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async supprimerPourConversation(conversationId: string) {
    await prisma.chatCallSignal.deleteMany({ where: { conversationId } });
  }
}

export const callSignalRepository = new CallSignalRepository();
