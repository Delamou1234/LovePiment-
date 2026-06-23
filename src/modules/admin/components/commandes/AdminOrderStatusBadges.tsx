import {
  classeBadgeLivraison,
  classeBadgePaiement,
  classeBadgeStatutCommande,
  libelleLivraison,
  libelleModePaiement,
  libelleStatutCommande,
  libelleStatutPaiement,
} from '@/modules/admin/lib/order-status-labels';

type Props = {
  statut: string;
  statutPaiement: string;
  modePaiement: string;
  livreeLe?: string | null;
  courierNom?: string | null;
  livreurPaiementRecu?: boolean | null;
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

export function AdminOrderStatusBadges({
  statut,
  statutPaiement,
  modePaiement,
  livreeLe,
  courierNom,
  livreurPaiementRecu,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge label={libelleStatutCommande(statut)} className={classeBadgeStatutCommande(statut)} />
      <Badge
        label={`Paiement : ${libelleStatutPaiement(statutPaiement)}`}
        className={classeBadgePaiement(statutPaiement)}
      />
      <Badge
        label={libelleLivraison(statut, livreeLe)}
        className={classeBadgeLivraison(statut)}
      />
      <Badge
        label={libelleModePaiement(modePaiement)}
        className="bg-zinc-50 text-zinc-700 ring-zinc-200/60"
      />
      {courierNom ? (
        <Badge
          label={`Livreur : ${courierNom}`}
          className="bg-olive/10 text-olive ring-olive/20"
        />
      ) : (
        <Badge label="Livreur : non assigné" className="bg-zinc-100 text-zinc-500 ring-zinc-200/60" />
      )}
      {modePaiement === 'PAIEMENT_LIVRAISON' && livreurPaiementRecu != null && (
        <Badge
          label={
            livreurPaiementRecu
              ? 'Espèces : reçues (livreur)'
              : 'Espèces : non reçues (livreur)'
          }
          className={
            livreurPaiementRecu
              ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/60'
              : 'bg-red-50 text-red-800 ring-red-200/60'
          }
        />
      )}
    </div>
  );
}
