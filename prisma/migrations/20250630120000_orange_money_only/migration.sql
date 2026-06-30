-- Paiement unique : Orange Money marchand
UPDATE "orders" SET "mode_paiement" = 'ORANGE_MONEY' WHERE "mode_paiement"::text = 'PAIEMENT_LIVRAISON';

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('ORANGE_MONEY');
ALTER TABLE "orders"
  ALTER COLUMN "mode_paiement" TYPE "PaymentMethod"
  USING "mode_paiement"::text::"PaymentMethod";
DROP TYPE "PaymentMethod_old";
