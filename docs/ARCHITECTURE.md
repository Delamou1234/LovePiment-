# Love Piment& — Architecture du projet

Boutique e-commerce (Conakry) : catalogue, paiement CinetPay, compte client, admin, livreurs, livraisons groupées.

## Principes

| Couche | Rôle | Règle |
|--------|------|--------|
| `src/app/` | Routes Next.js (pages, layouts, API) | Fins : délèguent au module métier |
| `src/modules/` | Logique métier par domaine | Pas d'import depuis `app/` |
| `src/shared/` | Transversal (auth, email, UI boutique) | Réutilisable par tous les modules |
| `src/components/ui/` | Design system (shadcn) | Composants génériques sans métier |
| `prisma/` | Schéma, seed, scripts DB | Source de vérité données |

**Flux typique :** `app/api/.../route.ts` → `modules/*/services` → `modules/*/repository` → Prisma

## Arborescence `src/`

```
src/
├── app/                    # App Router Next.js 16
│   ├── (boutique)/         # Vitrine publique
│   ├── (compte)/           # Espace client connecté
│   ├── admin/              # Back-office
│   ├── livreur/            # Espace livreur
│   ├── livraison/[token]/  # Navigation publique (lien partagé)
│   ├── connexion/          # Auth client
│   └── api/                # Routes API REST
│       ├── admin/          # Protégé admin
│       ├── livreur/        # Protégé livreur
│       ├── compte/         # Protégé client
│       └── …
├── modules/                # Domaines métier (voir ci-dessous)
├── shared/                 # Libs & composants transverses
├── components/ui/          # shadcn / Base UI
├── store/                  # Zustand (panier)
└── types/                  # Types globaux
```

## Modules métier (`src/modules/`)

| Module | Responsabilité | Couches |
|--------|----------------|---------|
| **produits** | Catalogue, catégories, stocks, facettes | repository, services, components |
| **commandes** | Création commande, statuts, items | repository, services, types |
| **paiement** | CinetPay, paiement à la livraison | providers, services |
| **livraison** | Livreurs, tournées, suivi, géo | repository, services, components, email |
| **compte** | Profil, adresses, wishlist, commandes client | services, components, hooks |
| **auth** | Login client/admin, reset password, OAuth | repository, services, components |
| **admin** | UI back-office, stats, BI, paramètres | services, components, lib |
| **marketing** | Coupons, flash, parrainage, points | repository, services, components |
| **messagerie** | Chat client / admin, appels | repository, services, components |
| **avis** | Avis produits post-livraison | repository, services, components |
| **contact** | Formulaire contact | repository, services, email |
| **notifications** | WhatsApp / e-mail commandes | providers, services |
| **ia** | Recommandations Gemini, assistant | services, components |
| **recherche** | Recherche image / suggestions | services |
| **agent** | API agent externe | services |

### Sous-domaine livraison (évolution)

```
modules/livraison/
├── courier/          # Comptes livreur, auth, dashboard
├── delivery/         # Tournées, regroupement GPS, navigation
├── tracking/         # Statuts, événements, suivi client
└── notifications/    # Alertes admin nouvelle commande
```

*(Réorganisation physique progressive — voir `modules/livraison/README.md`.)*

### Admin UI (évolution)

```
modules/admin/components/
├── layout/           # Shell, sidebar, topbar, cloche
├── commandes/        # Commandes, tournées, géo, livreurs assignés
├── livreurs/         # CRUD livreurs
├── catalogue/        # Éditeur produits
└── admin-ui.ts       # Tokens CSS partagés admin
```

## Authentification & sessions

Trois rôles, trois cookies séparés (`shared/lib/auth/`) :

- `lovepiment_customer_session` — boutique / compte
- `lovepiment_admin_session` — `/admin`
- `lovepiment_courier_session` — `/livreur`

Middleware : `src/middleware.ts` + `shared/lib/auth/session-edge.ts`

## API — conventions

- **Admin** : `requireAdmin()` depuis `modules/admin/lib/require-admin`
- **Livreur** : `getCourierSession()` depuis `shared/lib/auth/session`
- **Client** : `getCustomerSession()` idem
- Validation entrées : **Zod** dans chaque `route.ts`
- Réponses erreur : `{ message: string }` + code HTTP adapté

## Base de données

- **Prisma 7** + PostgreSQL (`DATABASE_URL`)
- Scripts : `npm run db:setup` (push + seed)
- Seed : admin, client démo, livreur démo, catalogue parfums

## Ce qu'il ne faut pas faire

- Mettre de la logique métier lourde dans `app/**/page.tsx` → extraire vers `modules/`
- Importer `app/` depuis `modules/`
- Dupliquer auth / Prisma hors de `shared/lib`
- Mélanger français / anglais dans les noms de fichiers (garder l'existant, nouveaux fichiers en anglais technique)

## Prochaines étapes structurelles

1. Finir l'extraction des grosses pages admin vers `modules/admin/components/`
2. Découper `modules/livraison/services/` en sous-dossiers courier / delivery / tracking
3. Unifier `avis` + `commandes/review` si duplication confirmée
4. Barrel exports (`index.ts`) par module pour imports stables
5. Tests ciblés sur `order.service`, `delivery-run.service`, clustering GPS
