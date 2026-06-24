# Qualité logicielle — Love Piment&

Objectif : maintenir un niveau **9+/10** sur la robustesse du code, pas seulement les fonctionnalités.

## Garde-fous automatiques

| Étape | Commande | CI |
|-------|----------|-----|
| Lint | `npm run lint` | ✅ |
| Types | `npm run typecheck` | ✅ |
| Tests | `npm run test` | ✅ |
| Build | `npm run build` | ✅ (avec PostgreSQL) |

La pipeline GitHub Actions (`.github/workflows/ci.yml`) exécute tout cela à chaque push / PR.

## Tests

```bash
npm run test          # une fois
npm run test:watch    # mode interactif
npm run test:coverage # rapport de couverture (libs métier)
```

### Périmètre couvert aujourd’hui

- **Promos** : dates, remises, prix effectif (`promo.ts`)
- **Stock** : décrément atomique, restauration (`order-stock.ts`)
- **Livraison** : tarifs Conakry / hors ville, seuil gratuit (`shipping.ts`)
- **Coupons** : validation, calcul remise (`coupon-math.ts`, `MarketingService`)
- **Parrainage** : génération / normalisation des codes
- **Config** : santé des variables d’environnement (`env-health.ts`)

### Ajouter un test

Placer le fichier à côté du module testé :

```
src/modules/mon-module/lib/ma-fonction.test.ts
```

Privilégier la logique **pure** (sans I/O) dans `lib/` — plus simple à tester et à réutiliser.

## Santé runtime

- `GET /api/health` — DB + variables obligatoires
- `npm run db:health` — script local

## Avant merge / release

1. `npm run test && npm run lint && npm run typecheck`
2. Vérifier `/api/health` en local si la DB tourne
3. Tester manuellement : commande, annulation stock, promo checkout

## Prochaines étapes (optionnel)

- Tests E2E Playwright (parcours checkout)
- Couverture sur `services/` avec mocks Prisma
- Monitoring Sentry en production (DSN déjà prévu dans `.env.example`)
