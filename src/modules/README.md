# Modules métier

Chaque dossier = un **domaine** avec la même structure cible :

```
mon-module/
├── components/     # UI React (client components si interactif)
├── services/       # Logique métier, orchestration
├── repository/     # Accès Prisma (queries)
├── types/          # Types TS du domaine
├── lib/            # Helpers purs (sans I/O)
├── hooks/          # Hooks React spécifiques
├── email/          # Templates e-mail (optionnel)
└── README.md       # Notes du domaine (optionnel)
```

## Imports

```ts
// Depuis l'app ou un autre module
import { orderService } from '@/modules/commandes/services/order.service';
import { AdminShell } from '@/modules/admin/components/layout/AdminShell';
```

## Créer un nouveau module

1. Ajouter le dossier sous `src/modules/`
2. Exposer l'API via `services/` (pas directement `repository/` depuis `app/api`)
3. Ajouter les routes dans `src/app/api/...`
4. Documenter dans `docs/ARCHITECTURE.md`
