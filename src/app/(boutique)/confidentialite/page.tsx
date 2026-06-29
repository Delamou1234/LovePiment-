import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell, LEGAL_NAV } from '@/shared/components/legal/LegalPageShell';
import { SHOP_EMAIL } from '@/shared/lib/shop-contact';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment Love Piment& collecte, utilise et protège vos données personnelles.',
};

export default function ConfidentialitePage() {
  const email = SHOP_EMAIL;
  const nav = LEGAL_NAV.map((item) => ({ ...item, active: item.href === '/confidentialite' }));

  return (
    <LegalPageShell
      title="Politique de confidentialité"
      description="Transparence sur vos données lors de l'utilisation de Love Piment&."
      nav={nav}
    >
      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">1. Responsable du traitement</h2>
        <p>
          Love Piment& — Conakry, Guinée. Contact données personnelles :{' '}
          <a href={`mailto:${email}`} className="text-[#9B1B2E] hover:underline">
            {email}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">2. Données collectées</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identité et coordonnées : nom, e-mail, téléphone, adresse de livraison</li>
          <li>Données de commande : articles, montants, historique</li>
          <li>Données de compte : mot de passe chiffré, favoris, profil beauté (optionnel)</li>
          <li>Données techniques : cookies de session, événements de navigation anonymisés</li>
          <li>Messages : contenu des échanges avec le support (chat, contact)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">3. Finalités</h2>
        <p>
          Traitement des commandes, livraison, service client, sécurisation du compte, amélioration du
          site, envoi de newsletters (avec consentement), et obligations légales le cas échéant.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">4. Base légale</h2>
        <p>
          Exécution du contrat (commande), intérêt légitime (sécurité, statistiques), et consentement
          pour les communications marketing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">5. Durée de conservation</h2>
        <p>
          Les données de compte sont conservées tant que le compte est actif. Les données de commande
          sont conservées pour la durée légale applicable (comptabilité, litiges). Les cookies de
          session expirent selon leur paramétrage technique.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">6. Partage des données</h2>
        <p>
          Vos données peuvent être transmises à nos prestataires strictement nécessaires : hébergement,
          paiement sécurisé, livraison, envoi d&apos;e-mails. Nous ne vendons pas vos données à des tiers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">7. Vos droits</h2>
        <p>
          Vous pouvez accéder, rectifier ou demander la suppression de vos données via votre{' '}
          <Link href="/compte" className="text-[#9B1B2E] hover:underline">
            espace compte
          </Link>{' '}
          ou en écrivant à{' '}
          <a href={`mailto:${email}`} className="text-[#9B1B2E] hover:underline">
            {email}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">8. Newsletter</h2>
        <p>
          L&apos;inscription à la newsletter est facultative. Vous pouvez vous désinscrire à tout moment
          via le lien prévu dans chaque e-mail ou en nous contactant.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">9. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles adaptées (chiffrement des
          mots de passe, connexions sécurisées HTTPS en production, accès restreint aux données).
        </p>
      </section>
    </LegalPageShell>
  );
}
