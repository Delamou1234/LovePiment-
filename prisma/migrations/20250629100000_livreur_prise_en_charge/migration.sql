-- Prise en charge colis par le livreur (responsabilité)
ALTER TABLE "orders" ADD COLUMN "livreur_prise_en_charge_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "livreur_prise_en_charge_ack" BOOLEAN;
