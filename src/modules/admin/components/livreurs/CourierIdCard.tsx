import {
  COURIER_ENGIN_LABELS,
  courierCardRef,
  courierInitials,
  type CourierCardData,
} from './courier-card.utils';
import { CourierCardQr } from './CourierCardQr';

type Props = {
  livreur: CourierCardData;
};

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="courier-id-card__detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function CourierIdCard({ livreur }: Props) {
  const ref = courierCardRef(livreur.id);
  const year = new Date().getFullYear();
  const zone = [livreur.commune, livreur.quartierBase].filter(Boolean).join(' · ') || null;
  const vehicule = [
    COURIER_ENGIN_LABELS[livreur.typeEngin] ?? livreur.typeEngin,
    livreur.immatriculation,
  ]
    .filter(Boolean)
    .join(' - ');

  return (
    <article className="courier-id-card" aria-label={`Carte livreur ${livreur.nom}`}>
      <header className="courier-id-card__head">
        <p className="courier-id-card__brand">Love Piment&</p>
        <p className="courier-id-card__title">Carte livreur officielle</p>
      </header>

      <div className="courier-id-card__body">
        <div className="courier-id-card__photo-wrap">
          {livreur.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={livreur.photoUrl} alt={livreur.nom} className="courier-id-card__photo" />
          ) : (
            <div className="courier-id-card__photo-fallback" aria-hidden>
              {courierInitials(livreur.nom)}
            </div>
          )}
        </div>

        <div className="courier-id-card__identity">
          <h2 className="courier-id-card__name">{livreur.nom}</h2>
          <p className="courier-id-card__role">Livreur partenaire</p>
          <p className="courier-id-card__contact">{livreur.telephone}</p>
        </div>

        <dl className="courier-id-card__details courier-id-card__details--left">
          <DetailItem label="Véhicule" value={vehicule} />
          <DetailItem label="CNI" value={livreur.numeroCni} />
        </dl>

        <dl className="courier-id-card__details courier-id-card__details--right">
          <DetailItem label="Zone" value={zone} />
          <DetailItem label="Permis" value={livreur.permisConduire} />
        </dl>
      </div>

      <footer className="courier-id-card__foot">
        <div className="courier-id-card__ref-block">
          <p className="courier-id-card__ref-label">Référence</p>
          <p className="courier-id-card__ref">{ref}</p>
        </div>

        <div className="courier-id-card__foot-end">
          <CourierCardQr livreurId={livreur.id} />
          <div className="courier-id-card__foot-meta">
            {livreur.verifie ? (
              <span className="courier-id-card__stamp is-verified">Vérifié</span>
            ) : (
              <span className="courier-id-card__stamp">En attente</span>
            )}
            <p className="courier-id-card__year">{year}</p>
          </div>
        </div>
      </footer>
    </article>
  );
}
