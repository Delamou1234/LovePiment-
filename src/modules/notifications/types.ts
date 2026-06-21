import type { OrderStatus, PaymentMethod } from '@prisma/client';

export type NotificationChannel = 'whatsapp' | 'sms' | 'log';

export type SendResult = {
  success: boolean;
  channel?: NotificationChannel;
  error?: string;
};

export type OrderNotificationContext = {
  orderId: string;
  suiviToken: string;
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  montantTotal: number;
  statut: OrderStatus;
  modePaiement: PaymentMethod;
  numeroSuivi?: string | null;
  carrierNom?: string | null;
  statutMessage?: string;
};
