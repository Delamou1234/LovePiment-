-- Compte client lié au livreur (achats sur la boutique)
ALTER TABLE "couriers" ADD COLUMN "customer_id" TEXT;
CREATE UNIQUE INDEX "couriers_customer_id_key" ON "couriers"("customer_id");
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
