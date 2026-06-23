# KabiShop

Boutique e-commerce (parfums & huiles) — Conakry, Guinée.

## Stack

- **Next.js 16** (App Router) · **React 19** · **Prisma 7** · **PostgreSQL**
- Paiement **CinetPay** · Livraison avec **livreurs** et **tournées GPS**

## Démarrage

```bash
npm install
npm run db:setup    # schéma + seed
npm run dev
```

- Boutique : http://localhost:3000  
- Admin : `/admin` (voir seed pour identifiants)  
- Livreur : `/livreur/connexion`

## Documentation

- **[Architecture du projet](docs/ARCHITECTURE.md)** — structure, modules, conventions
- **[Modules métier](src/modules/README.md)** — organisation du code
- **[Module livraison](src/modules/livraison/README.md)** — livreurs, tournées, suivi

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run db:push` | Synchroniser le schéma Prisma |
| `npm run db:seed` | Données de démo |
| `npm run db:health` | Vérifier la connexion DB |
