# Module livraison

Regroupe livreurs, tournées, suivi commande et géolocalisation.

## Fichiers actuels → responsabilité

| Fichier | Rôle |
|---------|------|
| `repository/courier.repository.ts` | CRUD livreurs, auth mot de passe |
| `repository/tracking.repository.ts` | Événements suivi, statuts commande |
| `services/courier-order.service.ts` | Commandes assignées au livreur, marquer livrée |
| `services/delivery-run.service.ts` | Tournées multi-commandes |
| `services/order-geo-clustering.service.ts` | Regroupement GPS admin |
| `services/delivery-navigation.service.ts` | Géocodage, lien navigation |
| `services/tracking.service.ts` | Suivi client (DTO timeline) |
| `services/courier-penalty.service.ts` | Pénalités espèces non déclarées |
| `services/courier-welcome.service.ts` | E-mail bienvenue livreur |
| `services/admin-order-alert.service.ts` | E-mail admin nouvelle commande |
| `components/CourierDashboard.tsx` | UI livreur |
| `components/CourierOrderCard.tsx` | Carte une livraison |
| `components/DeliveryNavigationView.tsx` | Page publique `/livraison/[token]` |

## APIs liées

- `POST /api/admin/livraisons` — créer tournée
- `GET /api/admin/commandes/regroupement-geo` — suggestions zones
- `POST /api/admin/commandes/[id]/assigner-livreur`
- `GET /api/livreur/commandes`
- `POST /api/livreur/commandes/[id]` — livrer + déclaration espèces

## Cible (refactor progressif)

```
livraison/
├── courier/
├── delivery/
├── tracking/
└── notifications/
```
