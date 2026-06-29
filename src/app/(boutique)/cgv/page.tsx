import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell, LEGAL_NAV } from '@/shared/components/legal/LegalPageShell';
import { SHOP_EMAIL } from '@/shared/lib/shop-contact';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'CGV Love Piment& — commandes, livraison, paiement et retours à Conakry.',
};

export default function CgvPage() {
  const email = SHOP_EMAIL;
  const nav = LEGAL_NAV.map((item) => ({ ...item, active: item.href === '/cgv' }));

  return (
    <LegalPageShell
      title="Conditions générales de vente (CGV)"
      description="Modalités applicables aux commandes passées sur lovepiment.gn."
      nav={nav}
    >
      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">1. Objet</h2>
        <p>
          Les présentes CGV régissent les ventes de produits effectuées par Love Piment& auprès de
          clientes majeures via le site internet. Toute commande implique l&apos;acceptation sans réserve
          des présentes conditions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">2. Produits</h2>
        <p>
          Les produits proposés sont décrits avec la plus grande exactitude possible. Les photographies
          sont non contractuelles. Love Piment& se réserve le droit de modifier l&apos;assortiment et les
          prix à tout moment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">3. Commande</h2>
        <p>
          La commande est validée après confirmation du panier, saisie des coordonnées de livraison et
          choix du mode de paiement. Un e-mail ou message de confirmation peut être envoyé avec le numéro
          de suivi.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">4. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en francs guinéens (GNF), toutes taxes comprises le cas échéant. Les
          frais de livraison sont calculés au moment du checkout selon la ville de livraison. Modes de
          paiement acceptés : Mobile Money (via passerelle sécurisée lorsque disponible) et paiement à
          la livraison selon les options affichées au moment de la commande.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">5. Livraison</h2>
        <p>
          Livraison à Conakry et environs, en emballage discret sans indication du contenu. Les délais
          indicatifs sont communiqués sur le site et peuvent varier selon la zone et la disponibilité
          des produits. Le client doit fournir une adresse et un numéro de téléphone valides.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">6. Droit de rétractation et retours</h2>
        <p>
          Pour des raisons d&apos;hygiène, les produits intimes descellés ou utilisés ne peuvent être
          repris ni échangés, sauf défaut avéré ou erreur de notre part. En cas de produit défectueux à
          réception, contactez-nous sous 48 h à{' '}
          <a href={`mailto:${email}`} className="text-[#9B1B2E] hover:underline">
            {email}
          </a>{' '}
          ou via{' '}
          <Link href="/contact" className="text-[#9B1B2E] hover:underline">
            le formulaire contact
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">7. Service client</h2>
        <p>
          Notre équipe est joignable via{' '}
          <Link href="/messages" className="text-[#9B1B2E] hover:underline">
            la messagerie
          </Link>
          , WhatsApp ou{' '}
          <Link href="/contact" className="text-[#9B1B2E] hover:underline">
            contact
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
