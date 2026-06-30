-- Numéro Orange Money distinct + journal des tentatives de paiement
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_telephone" TEXT;

CREATE TABLE IF NOT EXISTS "payment_traces" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "telephone_contact" TEXT,
    "telephone_paiement" TEXT NOT NULL,
    "payment_order_id" TEXT,
    "statut" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_traces_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payment_traces_order_id_idx" ON "payment_traces"("order_id");
CREATE INDEX IF NOT EXISTS "payment_traces_created_at_idx" ON "payment_traces"("created_at");

DO $$ BEGIN
  ALTER TABLE "payment_traces" ADD CONSTRAINT "payment_traces_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
