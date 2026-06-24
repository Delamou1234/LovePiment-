# Love Piment&

Plateforme e-commerce complète pour **Love Piment&**, boutique de parfums et huiles à **Conakry (Guinée)**.  
Elle couvre la vente en ligne, le paiement, la livraison, le suivi client et tout le back-office nécessaire pour faire tourner la boutique au quotidien.

---

## Ce que fait l’application

### Boutique en ligne (clients)

- **Catalogue** : produits, catégories, promotions, page promos, recherche et filtres
- **Panier & commande** : tunnel de commande avec adresse, coupon promo, points fidélité et parrainage
- **Paiement** : **CinetPay** (Mobile Money, carte) ou **paiement à la livraison** en espèces
- **Compte client** : inscription, connexion (e-mail, Google), profil beauté, adresses, wishlist, historique de commandes
- **Suivi de commande** : page de suivi en temps réel via un code reçu par e-mail
- **Avis produits** : notation et commentaires après livraison
- **Messagerie** : chat avec l’équipe boutique
- **Contact** : formulaire de contact public

### Espace admin (`/admin`)

- **Tableau de bord** : ventes, alertes stock, activité récente
- **Catalogue** : produits, catégories, stocks, page promotions (produits promo, codes, ventes flash)
- **Commandes** : gestion complète, filtres, assignation livreur, tournées de livraison, regroupement GPS
- **Livreurs** : création de comptes, vérification, **cartes livreur** imprimables avec photo et QR code
- **Clients** : liste, détail, accès aux commandes
- **Marketing** : modération des avis clients
- **Communication** : messagerie, messages du formulaire contact
- **Analytique** : trafic, BI, paramètres boutique

### Espace livreur (`/livreur`)

- Connexion dédiée
- **Commandes du jour** : livraisons assignées, navigation, encaissement espèces
- **Historique** des livraisons effectuées
- Déclaration de paiement reçu sur place

### Livraison & logistique

- Comptes livreurs avec vérification des documents
- **Tournées** : plusieurs commandes regroupées pour un même livreur
- **Suivi GPS** et lien de navigation partagé
- Notifications e-mail / WhatsApp sur les commandes
- **Vérification carte livreur** : scan du QR code sur la carte imprimée

### Fonctionnalités transverses

- Stocks et alertes rupture
- Coupons promo, ventes flash, programme de fidélité et parrainage
- E-mails transactionnels (commande, bienvenue livreur, etc.)
- Assistant / recommandations IA (Gemini)
- Tests automatisés et CI GitHub Actions

---

## Stack technique

| Couche | Technologies |
|--------|----------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | API Routes Next.js, Prisma 7 |
| Base de données | PostgreSQL |
| Paiement | CinetPay |
| Tests | Vitest |
| Qualité | ESLint, TypeScript, GitHub Actions |

---

## Démarrage rapide

```bash
npm install
npm run db:setup    # schéma + données de démo
npm run dev
```

| URL | Rôle |
|-----|------|
| http://localhost:3000 | Boutique |
| `/admin` | Back-office (identifiants dans le seed) |
| `/livreur` | Espace livreur |
| `/connexion` | Connexion client / admin / livreur |

Variables d’environnement : copier `.env.example` vers `.env` et renseigner au minimum la base PostgreSQL et `NEXT_PUBLIC_APP_URL`.

---

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** — structure du projet, modules, conventions
- **[Qualité & tests](docs/QUALITY.md)** — CI, couverture, bonnes pratiques
- **[Modules métier](src/modules/README.md)** — organisation du code
- **[Module livraison](src/modules/livraison/README.md)** — livreurs, tournées, suivi

---

## Commandes utiles

```bash
npm run dev          # Développement
npm run build        # Build production
npm run test         # Tests unitaires
npm run typecheck    # Vérification TypeScript
npm run lint         # ESLint
npm run db:push      # Synchroniser le schéma Prisma
npm run db:seed      # Données de démo
npm run db:health    # Tester la connexion DB
```
