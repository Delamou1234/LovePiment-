import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell, LEGAL_NAV } from '@/shared/components/legal/LegalPageShell';
import { getShopPhoneDisplay, SHOP_EMAIL } from '@/shared/lib/shop-contact';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site Love Piment& — boutique intime à Conakry, Guinée.',
};

export default function MentionsLegalesPage() {
  const email = SHOP_EMAIL;
  const phone = getShopPhoneDisplay();
  const nav = LEGAL_NAV.map((item) => ({ ...item, active: item.href === '/mentions-legales' }));

  return (
    <LegalPageShell
      title="Mentions légales"
      description="Informations légales relatives à l'édition et à l'hébergement du site Love Piment&."
      nav={nav}
    >
      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">Éditeur du site</h2>
        <p>
          <strong>Love Piment&</strong> — boutique en ligne spécialisée dans le bien-être intime féminin.
          <br />
          Siège : Conakry, République de Guinée.
          <br />
          E-mail :{' '}
          <a href={`mailto:${email}`} className="text-[#9B1B2E] hover:underline">
            {email}
          </a>
          <br />
          Téléphone : {phone}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">Directeur de la publication</h2>
        <p>Le représentant légal de Love Piment&.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">Hébergement</h2>
        <p>
          Le site est hébergé par un prestataire cloud conforme aux standards de sécurité en vigueur.
          Les coordonnées détaillées de l&apos;hébergeur peuvent être communiquées sur demande à{' '}
          <a href={`mailto:${email}`} className="text-[#9B1B2E] hover:underline">
            {email}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments du site (textes, visuels, logo, structure) est protégé par le droit
          d&apos;auteur. Toute reproduction non autorisée est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">Public visé</h2>
        <p>
          Ce site est strictement réservé aux personnes majeures (18 ans et plus). En accédant au site,
          vous déclarez avoir l&apos;âge légal requis en République de Guinée.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">Liens utiles</h2>
        <p>
          Consultez également nos{' '}
          <Link href="/cgv" className="text-[#9B1B2E] hover:underline">
            conditions générales de vente
          </Link>{' '}
          et notre{' '}
          <Link href="/confidentialite" className="text-[#9B1B2E] hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
