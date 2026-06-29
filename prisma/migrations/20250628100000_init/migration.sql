-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('EN_ATTENTE', 'PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CINETPAY', 'PAIEMENT_LIVRAISON');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('EN_ATTENTE', 'REUSSIE', 'ECHOUEE', 'REMBOURSEE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_START', 'ORDER_PLACED');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('STATUT', 'NOTIFICATION', 'TRANSPORTEUR', 'SATISFACTION');

-- CreateEnum
CREATE TYPE "OrderSatisfaction" AS ENUM ('SATISFAIT', 'NON_SATISFAIT');

-- CreateEnum
CREATE TYPE "MessageSenderRole" AS ENUM ('CLIENT', 'VENDEUR');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'VOICE');

-- CreateEnum
CREATE TYPE "ChatParticipantRole" AS ENUM ('CLIENT', 'VENDEUR');

-- CreateEnum
CREATE TYPE "CallSignalType" AS ENUM ('OFFER', 'ANSWER', 'ICE', 'END', 'REJECT');

-- CreateEnum
CREATE TYPE "ContactSubject" AS ENUM ('GENERAL', 'COMMANDE', 'PRODUIT', 'PARTENARIAT', 'AUTRE');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NOUVEAU', 'LU', 'TRAITE');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('POURCENT', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REFUSE');

-- CreateEnum
CREATE TYPE "DeliveryRunStatus" AS ENUM ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "CourierVehicleType" AS ENUM ('MOTO', 'VOITURE', 'VELO', 'AUTRE');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "marque" TEXT,
    "description" TEXT,
    "prix" DECIMAL(10,0) NOT NULL,
    "prix_promo" DECIMAL(10,0),
    "promo_debut" TIMESTAMP(3),
    "promo_fin" TIMESTAMP(3),
    "images" TEXT[],
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "categorie_id" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "taille" TEXT,
    "couleur" TEXT,
    "capacite" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "code_barre" TEXT,
    "prix" DECIMAL(10,0),
    "product_id" TEXT NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "delai_min_heures" INTEGER NOT NULL DEFAULT 24,
    "delai_max_heures" INTEGER NOT NULL DEFAULT 48,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "client_nom" TEXT NOT NULL,
    "client_telephone" TEXT NOT NULL,
    "client_adresse" TEXT NOT NULL,
    "client_ville" TEXT NOT NULL,
    "client_latitude" DECIMAL(10,7),
    "client_longitude" DECIMAL(10,7),
    "statut" "OrderStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "mode_paiement" "PaymentMethod" NOT NULL,
    "statut_paiement" "PaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "sous_total" DECIMAL(10,0),
    "frais_livraison" DECIMAL(10,0),
    "remise_coupon" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "remise_points" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "remise_parrainage" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "points_utilises" INTEGER NOT NULL DEFAULT 0,
    "points_gagnes" INTEGER NOT NULL DEFAULT 0,
    "points_credites" BOOLEAN NOT NULL DEFAULT false,
    "montant_total" DECIMAL(10,0) NOT NULL,
    "coupon_id" TEXT,
    "code_parrainage_utilise" TEXT,
    "suivi_token" TEXT NOT NULL,
    "livraison_nav_token" TEXT NOT NULL,
    "numero_suivi" TEXT,
    "livraison_estimee" TIMESTAMP(3),
    "livree_le" TIMESTAMP(3),
    "carrier_id" TEXT,
    "courier_id" TEXT,
    "delivery_run_id" TEXT,
    "ordre_livraison" INTEGER,
    "assigned_at" TIMESTAMP(3),
    "livreur_paiement_recu" BOOLEAN,
    "livreur_paiement_declare_at" TIMESTAMP(3),
    "penalite_livreur_gn" DECIMAL(10,0),
    "cinetpay_tx_id" TEXT,
    "notes" TEXT,
    "satisfaction_statut" "OrderSatisfaction",
    "satisfaction_commentaire" TEXT,
    "satisfaction_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_runs" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "courier_id" TEXT,
    "statut" "DeliveryRunStatus" NOT NULL DEFAULT 'PLANIFIEE',
    "assigned_at" TIMESTAMP(3),
    "montant_total_gn" DECIMAL(12,0),
    "montant_especes_gn" DECIMAL(12,0),
    "notes_admin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "type_engin" "CourierVehicleType" NOT NULL DEFAULT 'MOTO',
    "immatriculation" TEXT,
    "numero_cni" TEXT,
    "quartier_base" TEXT,
    "commune" TEXT,
    "contact_urgence_nom" TEXT,
    "contact_urgence_tel" TEXT,
    "permis_conduire" TEXT,
    "photo_url" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "notes_admin" TEXT,
    "penalites_cumulees_gn" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tracking_events" (
    "id" TEXT NOT NULL,
    "type" "TrackingEventType" NOT NULL DEFAULT 'STATUT',
    "statut" "OrderStatus",
    "message" TEXT NOT NULL,
    "notifier_client" BOOLEAN NOT NULL DEFAULT false,
    "order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(10,0) NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "nom_boutique" TEXT NOT NULL DEFAULT 'Love Piment&',
    "logo_url" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT DEFAULT 'Conakry',
    "pays" TEXT DEFAULT 'Guinée',
    "whatsapp_number" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "email" TEXT,
    "meta_description" TEXT,
    "parrainage_actif" BOOLEAN NOT NULL DEFAULT true,
    "appels_actifs" BOOLEAN NOT NULL DEFAULT true,
    "newsletter_actif" BOOLEAN NOT NULL DEFAULT true,
    "newsletter_titre" TEXT NOT NULL DEFAULT 'Offre de bienvenue !',
    "newsletter_description" TEXT,
    "newsletter_image_url" TEXT,
    "newsletter_remise_pct" INTEGER NOT NULL DEFAULT 10,
    "newsletter_coupon_code" TEXT DEFAULT 'BIENVENUE10',
    "livraison_tarif_conakry" INTEGER NOT NULL DEFAULT 15000,
    "livraison_tarif_hors_conakry" INTEGER NOT NULL DEFAULT 25000,
    "livraison_seuil_gratuit" INTEGER NOT NULL DEFAULT 500000,
    "livraison_ville_par_defaut" TEXT NOT NULL DEFAULT 'Conakry',
    "livraison_gratuite_active" BOOLEAN NOT NULL DEFAULT true,
    "livraison_delai_label" TEXT DEFAULT '24–48 h',
    "apropos_hero_kicker" TEXT,
    "apropos_hero_titre" TEXT,
    "apropos_hero_accent" TEXT,
    "apropos_hero_texte" TEXT,
    "apropos_hero_image_url" TEXT,
    "apropos_mission_titre" TEXT,
    "apropos_mission_texte" TEXT,
    "apropos_histoire_titre" TEXT,
    "apropos_histoire_texte" TEXT,
    "apropos_chiffres" JSONB,
    "apropos_valeurs" JSONB,
    "apropos_cta_titre" TEXT,
    "apropos_cta_texte" TEXT,
    "apropos_meta_description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Administrateur',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "path" TEXT,
    "session_id" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_id" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "facebook_id" TEXT,
    "apple_id" TEXT,
    "avatar_url" TEXT,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse_preferee" TEXT,
    "ville_preferee" TEXT,
    "avatar_couleur" TEXT DEFAULT 'olive',
    "beauty_profile" JSONB,
    "points_fidelite" INTEGER NOT NULL DEFAULT 0,
    "code_parrainage" TEXT,
    "parrain_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL DEFAULT 'Conakry',
    "telephone" TEXT,
    "par_defaut" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "valeur" DECIMAL(10,0) NOT NULL,
    "min_commande" DECIMAL(10,0),
    "max_utilisations" INTEGER,
    "utilisations" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "debut" TIMESTAMP(3),
    "fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'homepage',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sales" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "product_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achat_verifie" BOOLEAN NOT NULL DEFAULT true,
    "statut" "ReviewStatus" NOT NULL DEFAULT 'APPROUVE',
    "modere_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "client_session_id" TEXT NOT NULL,
    "client_user_id" TEXT,
    "client_nom" TEXT NOT NULL,
    "client_telephone" TEXT,
    "sujet" TEXT,
    "order_id" TEXT,
    "dernier_message" TEXT,
    "dernier_message_at" TIMESTAMP(3),
    "non_lu_vendeur" INTEGER NOT NULL DEFAULT 0,
    "non_lu_client" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_role" "MessageSenderRole" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "contenu" TEXT,
    "fichier_url" TEXT,
    "fichier_nom" TEXT,
    "fichier_taille" INTEGER,
    "duree_ms" INTEGER,
    "lu_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_presences" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "ChatParticipantRole" NOT NULL,
    "participant_id" TEXT NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_typing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_call_signals" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "from_role" "MessageSenderRole" NOT NULL,
    "type" "CallSignalType" NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_call_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "sujet" "ContactSubject" NOT NULL,
    "message" TEXT NOT NULL,
    "statut" "ContactMessageStatus" NOT NULL DEFAULT 'NOUVEAU',
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_le" TIMESTAMP(3),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_nom_idx" ON "products"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_code_barre_key" ON "product_variants"("code_barre");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_slug_key" ON "carriers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "orders_suivi_token_key" ON "orders"("suivi_token");

-- CreateIndex
CREATE UNIQUE INDEX "orders_livraison_nav_token_key" ON "orders"("livraison_nav_token");

-- CreateIndex
CREATE UNIQUE INDEX "orders_cinetpay_tx_id_key" ON "orders"("cinetpay_tx_id");

-- CreateIndex
CREATE INDEX "orders_statut_idx" ON "orders"("statut");

-- CreateIndex
CREATE INDEX "orders_suivi_token_idx" ON "orders"("suivi_token");

-- CreateIndex
CREATE INDEX "orders_livraison_nav_token_idx" ON "orders"("livraison_nav_token");

-- CreateIndex
CREATE INDEX "orders_satisfaction_statut_idx" ON "orders"("satisfaction_statut");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_courier_id_idx" ON "orders"("courier_id");

-- CreateIndex
CREATE INDEX "orders_delivery_run_id_idx" ON "orders"("delivery_run_id");

-- CreateIndex
CREATE INDEX "orders_client_nom_idx" ON "orders"("client_nom");

-- CreateIndex
CREATE INDEX "orders_client_telephone_idx" ON "orders"("client_telephone");

-- CreateIndex
CREATE INDEX "delivery_runs_courier_id_idx" ON "delivery_runs"("courier_id");

-- CreateIndex
CREATE INDEX "delivery_runs_statut_idx" ON "delivery_runs"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email");

-- CreateIndex
CREATE INDEX "couriers_actif_idx" ON "couriers"("actif");

-- CreateIndex
CREATE INDEX "order_tracking_events_order_id_created_at_idx" ON "order_tracking_events"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "analytics_events_type_idx" ON "analytics_events"("type");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_product_id_idx" ON "analytics_events"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_google_id_key" ON "customers"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_facebook_id_key" ON "customers"("facebook_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_apple_id_key" ON "customers"("apple_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_parrainage_key" ON "customers"("code_parrainage");

-- CreateIndex
CREATE INDEX "customers_nom_idx" ON "customers"("nom");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_code_hash_key" ON "password_reset_tokens"("code_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_customer_id_idx" ON "password_reset_tokens"("customer_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "wishlist_items_customer_id_idx" ON "wishlist_items"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_customer_id_product_id_key" ON "wishlist_items"("customer_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sales_slug_key" ON "flash_sales"("slug");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_statut_idx" ON "product_reviews"("product_id", "statut");

-- CreateIndex
CREATE INDEX "product_reviews_customer_id_idx" ON "product_reviews"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_order_id_product_id_key" ON "product_reviews"("order_id", "product_id");

-- CreateIndex
CREATE INDEX "conversations_client_session_id_idx" ON "conversations"("client_session_id");

-- CreateIndex
CREATE INDEX "conversations_dernier_message_at_idx" ON "conversations"("dernier_message_at");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_created_at_idx" ON "chat_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_presences_conversation_id_idx" ON "chat_presences"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_presences_conversation_id_role_participant_id_key" ON "chat_presences"("conversation_id", "role", "participant_id");

-- CreateIndex
CREATE INDEX "chat_call_signals_conversation_id_created_at_idx" ON "chat_call_signals"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "contact_messages_statut_idx" ON "contact_messages"("statut");

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_run_id_fkey" FOREIGN KEY ("delivery_run_id") REFERENCES "delivery_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_runs" ADD CONSTRAINT "delivery_runs_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tracking_events" ADD CONSTRAINT "order_tracking_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_parrain_id_fkey" FOREIGN KEY ("parrain_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_call_signals" ADD CONSTRAINT "chat_call_signals_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
