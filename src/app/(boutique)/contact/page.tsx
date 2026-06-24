import type { Metadata } from 'next';
import { ContactForm, ContactInfoPanel } from '@/modules/contact/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact — Love Piment&',
  description:
    'Contactez Love Piment& à Conakry : questions commandes, produits, livraison. Réponse sous 24 h.',
};

export default function ContactPage() {
  return (
    <div className="container-shop py-10 md:py-16 animate-fadeIn">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 md:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9B1B2E] mb-2">
            Service client
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-zinc-900">
            Contactez-nous
          </h1>
          <p className="mt-3 text-zinc-600 max-w-xl">
            Remplissez le formulaire ci-dessous. Nous vous répondrons par e-mail ou WhatsApp.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
          <div className="lg:col-span-2">
            <ContactInfoPanel />
          </div>
          <div className="lg:col-span-3 rounded-2xl border border-[#F2D4DC] bg-white p-6 md:p-8 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
