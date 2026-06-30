-- Remplacer CinetPay par Orange Money direct
ALTER TYPE "PaymentMethod" RENAME VALUE 'CINETPAY' TO 'ORANGE_MONEY';

ALTER TABLE "orders" RENAME COLUMN "cinetpay_tx_id" TO "payment_order_id";
ALTER INDEX "orders_cinetpay_tx_id_key" RENAME TO "orders_payment_order_id_key";

ALTER TABLE "orders" ADD COLUMN "payment_pay_token" TEXT;
ALTER TABLE "orders" ADD COLUMN "payment_notif_token" TEXT;
