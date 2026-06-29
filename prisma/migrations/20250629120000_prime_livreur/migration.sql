-- Prime livreur par commande (saisie admin)
ALTER TABLE "orders" ADD COLUMN "prime_livreur_gn" DECIMAL(10,0);
