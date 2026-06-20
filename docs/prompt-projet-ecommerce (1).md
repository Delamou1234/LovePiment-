# Prompt Projet — Site E-commerce Boutique de Vêtements

## CONTEXTE

Je développe un site e-commerce complet pour une boutique de vente de vêtements. La cliente vend actuellement via une page Facebook et communique avec ses clientes via WhatsApp. Le site doit professionnaliser sa vente en ligne tout en restant connecté à ses canaux existants (Facebook, WhatsApp). Le marché cible est l'Afrique de l'Ouest francophone (Guinée), donc le paiement Mobile Money est essentiel, au même titre que la carte bancaire.

C'est un projet destiné à durer sur le long terme (pas un simple MVP jetable) : le code doit être propre, typé, testé, et facilement maintenable/évolutif.

---

## STACK TECHNIQUE IMPOSÉE

- **Framework** : Next.js 14+ (App Router), TypeScript strict
- **Style** : Tailwind CSS
- **Composants UI** : shadcn/ui (basé sur Radix UI)
- **State management** : Zustand (panier, état global léger)
- **Formulaires & validation** : React Hook Form + Zod
- **Base de données** : PostgreSQL (hébergée sur Supabase)
- **ORM** : Prisma
- **Auth** : Supabase Auth (réservé à l'admin pour l'instant)
- **Stockage images** : Supabase Storage
- **Paiement** : CinetPay (API officielle, Mobile Money + Visa/Mastercard)
- **Déploiement cible** : Vercel
- **Tests** : Vitest + React Testing Library (unitaires), Playwright (end-to-end)
- **Monitoring erreurs** : Sentry
- **Analytics** : Google Analytics + Meta Pixel

Merci de respecter cette stack strictement, ne pas proposer d'alternative sans me le signaler explicitement.

---

## ARCHITECTURE & PRINCIPES DE CODE (SOLID)

Le code doit suivre une **architecture modulaire par domaine métier** (et non un simple découpage technique en `components/`, `lib/`, etc.). Chaque domaine (produits, commandes, paiement, messagerie, trafic) doit être autonome, avec sa propre logique encapsulée. Objectif : si un bug apparaît sur le paiement par exemple, on doit pouvoir localiser et corriger le problème dans le module `paiement/` sans avoir à comprendre ou toucher au reste du code.

Les routes Next.js (`app/api/.../route.ts`) doivent rester de simples **contrôleurs fins** : elles valident l'entrée (Zod), appellent le service métier correspondant, et renvoient la réponse — aucune logique métier directement dans les routes.

### Application concrète des principes SOLID

- **S — Single Responsibility** : chaque service a une seule responsabilité (`ProductService` ne gère que les produits, `OrderService` que les commandes). Les composants React restent légers, sans logique métier complexe — celle-ci vit dans les services/hooks.

- **O — Open/Closed** : les intégrations externes (paiement, messagerie) passent par une interface, pas une implémentation directe. Exemple : une interface `PaymentProvider` (`initierPaiement()`, `verifierStatut()`) implémentée par `CinetPayProvider`. Si on ajoute Stripe plus tard pour l'international, on crée une nouvelle classe sans toucher au code du checkout existant.

- **L — Liskov Substitution** : toute implémentation de `PaymentProvider` ou `MessagingProvider` doit être interchangeable avec une autre sans casser le code appelant.

- **I — Interface Segregation** : préférer plusieurs interfaces ciblées (`Notifiable`, `Trackable`) plutôt qu'une seule interface géante qui regroupe des responsabilités différentes.

- **D — Dependency Inversion** : les services métier dépendent d'**abstractions** (ex: interface `ProductRepository`), jamais directement de Prisma. Ça permet de mocker facilement les dépendances dans les tests unitaires, et de changer d'implémentation (ORM, source de données) sans réécrire la logique métier.

**Bénéfice concret pour toi** : en cas de bug signalé par la cliente, tu sauras immédiatement dans quel module chercher, les tests unitaires pourront cibler un service précis sans dépendances lourdes, et toute évolution future (nouveau moyen de paiement, nouvelle source de notification) s'ajoute sans risquer de casser l'existant.

---

## FONCTIONNALITÉS — PARTIE PUBLIQUE (boutique)

### 1. Page d'accueil
- Bannière/hero avec mise en avant (promotions, nouvelle collection)
- Sections : produits vedettes, nouveautés, par catégorie
- Navigation claire vers les catégories principales
- Footer avec liens (à propos, contact, réseaux sociaux, conditions)

### 2. Catalogue produits
- Liste des produits avec pagination ou scroll infini
- Filtres : catégorie, taille, couleur, fourchette de prix
- Tri : prix croissant/décroissant, nouveautés, popularité
- Recherche texte (nom produit, recherche full-text PostgreSQL)
- Vue grille responsive (adaptée mobile en priorité)

### 3. Page produit
- Galerie d'images (plusieurs photos, zoom au clic/tap)
- Nom, description, prix, disponibilité
- Sélection de variantes : taille, couleur (avec gestion du stock par variante)
- Bouton "Ajouter au panier"
- Bouton "Commander directement via WhatsApp" (génère un lien `wa.me` avec message pré-rempli : nom produit, taille, couleur, prix)
- Balises Open Graph dynamiques (titre, image, prix) pour un aperçu correct quand le lien est partagé sur WhatsApp/Facebook
- Produits similaires/suggestions en bas de page

### 4. Panier
- Affichage sous forme de drawer/sidebar (pas de rechargement de page)
- Modification quantité, suppression d'article
- Calcul automatique du total
- Persistance du panier (localStorage ou store Zustand persistant) pour ne pas le perdre si la cliente ferme l'onglet

### 5. Tunnel de commande (checkout)
- Formulaire : nom, téléphone, adresse de livraison, ville
- Choix du mode de paiement :
  - Paiement en ligne via CinetPay (Mobile Money / carte)
  - Paiement à la livraison (option de secours)
- Récapitulatif de commande avant validation
- Page de confirmation après paiement réussi
- Email ou notification de confirmation (si possible, sinon SMS/WhatsApp)

### 6. Intégration WhatsApp
- Bouton flottant "Contacter sur WhatsApp" visible sur tout le site
- Lien `wa.me` dynamique avec message pré-rempli selon le contexte (question générale, commande produit spécifique, suivi de commande)

### 7. Intégration Facebook
- Balises Open Graph complètes sur toutes les pages produit (essentiel pour un bon aperçu de partage)
- Meta Pixel installé (pour future pub ciblée)
- Lien visible vers la page Facebook de la boutique
- (Optionnel, à valider avec la cliente) Génération d'un flux produit CSV/XML compatible Meta Commerce Manager pour synchroniser le catalogue avec la boutique Facebook/Instagram

### 8. SEO & performance
- Meta titles/descriptions dynamiques par page
- Sitemap.xml et robots.txt générés automatiquement
- Images optimisées via next/image
- Score Lighthouse cible : 90+ en performance mobile

---

## FONCTIONNALITÉS — PARTIE ADMIN (back-office)

Accessible via `/admin`, protégé par authentification (Supabase Auth), réservé à la cliente (et toi).

### 1. Dashboard
- Vue d'ensemble : nombre de commandes du jour/semaine/mois, chiffre d'affaires, produits en rupture de stock
- Aperçu rapide du trafic du jour (visites, top produit du moment) avec lien vers la page Statistiques détaillée

### 2. Gestion des produits
- Liste des produits avec recherche/filtre
- Ajout/modification/suppression de produit
- Upload de plusieurs images par produit
- Gestion des variantes (taille, couleur) et du stock par variante
- Gestion des catégories (créer, modifier, supprimer)
- Activer/désactiver un produit (sans le supprimer)

### 3. Gestion des commandes
- Liste des commandes avec statut (en attente, payée, en préparation, expédiée, livrée, annulée)
- Détail d'une commande (produits, client, montant, mode de paiement)
- Changement de statut manuel
- Filtre par statut et par date

### 4. Paramètres
- Informations boutique (nom, logo, coordonnées, lien Facebook, numéro WhatsApp)
- Gestion simple des promotions/codes promo (si jugé utile, à discuter)

### 5. Statistiques & Trafic

Page `/admin/trafic`, combinant deux sources complémentaires :

**A. Stats internes (calculées depuis notre propre base de données, temps réel)**
- Évolution des visites (jour/semaine/mois) sous forme de graphique
- Produits les plus vus
- Produits les plus vendus (par quantité et par chiffre d'affaires)
- Taux de conversion (commandes / visites)
- Répartition des commandes par statut et par mode de paiement
- Ces stats sont calculées à partir d'une table d'événements légère (voir modèle de données) alimentée par un tracking simple côté front, donc disponibles instantanément sans dépendance externe

**B. Intégration Google Analytics 4 (données détaillées, via l'API officielle)**
- Connexion à la Google Analytics Data API (compte de service Google) pour afficher dans l'admin :
  - Sources de trafic (Facebook, WhatsApp, recherche Google, direct...)
  - Pages les plus visitées
  - Données démographiques de base (pays, device : mobile/desktop)
  - Évolution du trafic sur une période choisie
- Le tag GA4 (`gtag.js`) doit être installé sur toutes les pages publiques pour alimenter cette source
- Les requêtes vers l'API Google Analytics Data se font côté serveur uniquement (route API dédiée), jamais exposées au client

**Pourquoi les deux ensemble** : les stats internes sont immédiates et liées directement aux ventes (donc fiables pour le pilotage business au jour le jour), Google Analytics apporte une vision plus large du comportement des visiteurs (sources, device, comportement de navigation) pour optimiser le marketing à moyen terme.

---

## MODÈLE DE DONNÉES (schéma Prisma à adapter)

Entités principales attendues :
- `Category` (id, nom, slug, image)
- `Product` (id, nom, slug, description, prix, catégorie, images[], actif, créé/modifié le)
- `ProductVariant` (id, productId, taille, couleur, stock, sku)
- `Order` (id, client (nom, téléphone, adresse, ville), statut, modePaiement, montantTotal, créé le)
- `OrderItem` (id, orderId, variantId, quantité, prixUnitaire)
- `AdminUser` (géré via Supabase Auth, lié à un profil simple)
- `AnalyticsEvent` (id, type [PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART, ORDER_PLACED], productId nullable, path, créé le) — table légère alimentée à chaque visite/action côté front, qui sert de base aux stats internes du dashboard admin (pas besoin de service externe pour ces métriques de base)

Merci de proposer un schéma Prisma complet basé sur cette liste, avec les relations correctement définies et les types adaptés (enums pour les statuts de commande, etc.).

---

## EXIGENCES NON-FONCTIONNELLES

- **Mobile-first** : la majorité des visiteurs seront sur téléphone, avec parfois une connexion lente — prioriser absolument l'expérience mobile
- **Architecture & maintenabilité** : respecter strictement l'architecture modulaire et les principes SOLID décrits plus haut — c'est une exigence prioritaire, pas une option
- **TypeScript strict** activé, pas de `any` sauf cas justifié
- **Sécurité** : validation des données côté serveur (pas seulement côté client) avec Zod, protection des routes admin, variables sensibles en `.env` jamais commitées
- **Gestion d'erreurs** : pages d'erreur propres (404, 500), messages clairs en cas d'échec de paiement
- **Tests** : couverture des fonctions critiques (calcul panier, validation commande, webhook paiement)
- **Accessibilité** : navigation au clavier possible, contrastes suffisants, attributs alt sur les images

---

## DESIGN

- Style moderne, épuré, professionnel — doit inspirer confiance pour le paiement en ligne
- Palette de couleurs et typographie à définir avec la cliente (placeholder pour l'instant : neutre + une couleur d'accent forte)
- Composants shadcn/ui comme base, personnalisés pour ne pas avoir un look "template par défaut"
- Animations légères et utiles (transitions panier, hover produits) via Tailwind/Framer Motion, sans surcharger

---

## STRUCTURE DE DOSSIERS ATTENDUE (architecture modulaire)

```
src/
├── app/                              # Routing Next.js UNIQUEMENT — reste fin, délègue aux modules
│   ├── (boutique)/
│   │   ├── page.tsx
│   │   ├── produits/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── categories/[slug]/page.tsx
│   │   ├── panier/page.tsx
│   │   └── commande/
│   │       ├── page.tsx
│   │       └── confirmation/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── produits/
│   │   ├── commandes/
│   │   ├── trafic/page.tsx
│   │   └── parametres/
│   └── api/
│       ├── paiement/route.ts             (contrôleur fin → délègue à modules/paiement)
│       ├── webhook-cinetpay/route.ts
│       ├── produits/route.ts             (contrôleur fin → délègue à modules/produits)
│       ├── track/route.ts
│       └── analytics/route.ts
│
├── modules/                          # Cœur métier, organisé par domaine (logique réutilisable, testable)
│   ├── produits/
│   │   ├── components/               (UI spécifique aux produits)
│   │   ├── services/                 (ProductService — logique métier)
│   │   ├── repository/               (ProductRepository — accès aux données via Prisma)
│   │   └── types/
│   ├── commandes/
│   │   ├── components/
│   │   ├── services/                 (OrderService)
│   │   ├── repository/               (OrderRepository)
│   │   └── types/
│   ├── paiement/
│   │   ├── providers/
│   │   │   ├── payment-provider.interface.ts
│   │   │   └── cinetpay.provider.ts
│   │   └── services/                 (PaymentService — orchestration, indépendant du prestataire)
│   ├── messagerie/
│   │   ├── providers/
│   │   │   ├── messaging-provider.interface.ts
│   │   │   └── whatsapp.provider.ts
│   │   └── services/
│   ├── trafic/
│   │   ├── services/                 (AnalyticsService — stats internes + appel Google Analytics Data API)
│   │   └── repository/
│   └── parametres/
│       ├── services/
│       └── repository/
│
├── shared/                           # Transverse, utilisé par plusieurs modules
│   ├── ui/                           (composants shadcn/ui génériques)
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── supabase.ts
│   └── hooks/
│
├── store/
│   └── panier.ts                     (Zustand)
│
├── types/
└── prisma/
    └── schema.prisma
```

**Règle clé** : les pages dans `app/` importent et orchestrent les services des `modules/`, mais ne contiennent jamais de logique métier directement. Les `services/` ne dépendent jamais directement de Next.js (pas de `NextRequest`/`NextResponse` à l'intérieur), ce qui les rend testables isolément et réutilisables (ex: même `OrderService` utilisable depuis une route API et depuis un futur script CLI ou cron).

---

## VARIABLES D'ENVIRONNEMENT NÉCESSAIRES (à prévoir dans `.env`)

```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_FACEBOOK_PAGE_URL=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GA_ID=
GA4_PROPERTY_ID=
GOOGLE_ANALYTICS_CLIENT_EMAIL=
GOOGLE_ANALYTICS_PRIVATE_KEY=
```

---

## ORDRE DE DÉVELOPPEMENT SOUHAITÉ

1. Setup du projet (Next.js, TypeScript, Tailwind, shadcn/ui) + connexion Prisma/Supabase + mise en place de l'architecture modulaire (`app/`, `modules/`, `shared/`) et des interfaces clés (`PaymentProvider`, `MessagingProvider`)
2. Modèle de données + migrations Prisma
3. Pages publiques statiques (accueil, catalogue, page produit) avec données de test
4. Panier (Zustand) + tunnel de commande (sans paiement réel d'abord)
5. Intégration CinetPay + webhook de confirmation
6. Intégration WhatsApp (boutons + liens dynamiques)
7. Open Graph + Meta Pixel + SEO de base
8. Back-office admin : auth, gestion produits, gestion commandes
9. Tracking interne (table AnalyticsEvent) + intégration Google Analytics Data API + page Statistiques & Trafic dans l'admin
10. Tests (unitaires sur les services via repositories mockés, e2e sur parcours d'achat complet)
11. Optimisation performance (images, Lighthouse) + déploiement Vercel

Merci de procéder étape par étape dans cet ordre, en me proposant le code progressivement plutôt que de tout générer d'un coup, afin que je puisse valider chaque brique avant de passer à la suivante.
