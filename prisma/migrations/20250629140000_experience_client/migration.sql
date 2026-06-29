-- Livraison enrichie, première commande, notes admin
ALTER TABLE "orders" ADD COLUMN "client_commune" TEXT;
ALTER TABLE "orders" ADD COLUMN "client_quartier" TEXT;
ALTER TABLE "orders" ADD COLUMN "client_repere" TEXT;
ALTER TABLE "orders" ADD COLUMN "creneau_livraison" TEXT;
ALTER TABLE "orders" ADD COLUMN "est_premiere_commande" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "notes_admin" TEXT;

ALTER TABLE "customers" ADD COLUMN "notes_admin" TEXT;

ALTER TABLE "coupons" ADD COLUMN "premiere_commande_only" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "store_settings" ADD COLUMN "livraison_tarifs_communes" JSONB;
ALTER TABLE "store_settings" ADD COLUMN "alerte_commande_minutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "store_settings" ADD COLUMN "stats_commandes_livrees" INTEGER NOT NULL DEFAULT 0;

UPDATE coupons SET premiere_commande_only = true WHERE code = 'BIENVENUE10';
