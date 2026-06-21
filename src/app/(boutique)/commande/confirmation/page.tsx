import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare, 
  ShoppingBag, 
  Phone, 
  MapPin, 
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { orderService } from '@/modules/commandes/services/order.service';

// ─── CONFIRMATION PAGE (SERVER COMPONENT) ────────────────────────────────────

type SearchParams = Promise<{
  id?: string;
}>;

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.id;

  if (!orderId) {
    notFound();
  }

  let order = null;
  try {
    order = await orderService.obtenirCommande(orderId);
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div className="container-kabishop py-16 text-center space-y-6">
        <div className="rounded-full bg-red-100 p-4 text-red-600 inline-block">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-black text-zinc-950">Commande introuvable</h1>
        <p className="text-zinc-500 max-w-sm mx-auto text-sm">
          Nous n'avons pas pu trouver de commande correspondant à cette référence. Veuillez vérifier votre lien ou contacter le support.
        </p>
        <Link href="/produits">
          <Button className="btn-primary rounded-full px-6">Retourner au catalogue</Button>
        </Link>
      </div>
    );
  }

  const formattedTotal = Number(order.montantTotal).toLocaleString('fr-FR') + ' GN';
  const shippingCost = 15000;
  const subtotal = Number(order.montantTotal) - shippingCost;
  const formattedSubtotal = subtotal.toLocaleString('fr-FR') + ' GN';
  const formattedShipping = shippingCost.toLocaleString('fr-FR') + ' GN';

  // Génération du texte de reçu WhatsApp
  const articlesListText = order.items
    .map(
      (item) =>
        `- ${item.quantite}x ${item.variante.produit.nom}` +
        (item.variante.taille || item.variante.couleur
          ? ` (${[item.variante.taille, item.variante.couleur].filter(Boolean).join(', ')})`
          : '') +
        ` : ${Number(item.prixUnitaire).toLocaleString('fr-FR')} GN`
    )
    .join('\n');

  const waMessage = `Bonjour KabiShop ! Je viens de passer une commande sur votre site internet.\n\n` +
    `*Référence de commande* : #${order.id}\n` +
    `*Client* : ${order.clientNom}\n` +
    `*Téléphone* : ${order.clientTelephone}\n` +
    `*Adresse de livraison* : ${order.clientAdresse}, ${order.clientVille}\n` +
    `*Mode de paiement* : ${order.modePaiement === 'CINETPAY' ? 'Paiement en ligne (CinetPay)' : 'Paiement à la livraison'}\n` +
    `*Statut du paiement* : ${order.statutPaiement === 'REUSSIE' ? '✅ PAYÉ' : '⏳ EN ATTENTE'}\n` +
    `*Montant Total* : ${formattedTotal}\n\n` +
    `*Articles commandés* :\n${articlesListText}\n\n` +
    `Pouvez-vous me confirmer la bonne réception et planifier la livraison ? Merci !`;

  const waLink = `https://wa.me/224620000000?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="container-kabishop py-8 space-y-8 max-w-3xl animate-fadeIn">
      {/* ─── BREADCRUMB ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/" className="hover:text-primary transition font-medium">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Confirmation de commande</span>
      </div>

      {/* ─── BLOC SUCCÈS ───────────────────────────────────────────────── */}
      <div className="border border-zinc-100 rounded-3xl p-8 bg-white shadow-sm text-center space-y-4">
        <div className="rounded-full bg-green-100 p-4 text-green-600 inline-block animate-scaleIn">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-zinc-950 md:text-3xl">Merci pour votre commande !</h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
            Votre commande a été enregistrée avec succès sous la référence <span className="font-extrabold text-zinc-900">#{order.id}</span>.
          </p>
        </div>

        {/* Bouton WhatsApp indispensable */}
        <div className="pt-4 max-w-md mx-auto">
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 text-white hover:bg-green-500 border-none font-bold rounded-full w-full py-6 text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/10">
              <MessageSquare className="h-5 w-5" /> Partager mon reçu sur WhatsApp
            </Button>
          </a>
          <p className="text-[10px] text-zinc-400 font-semibold mt-2.5">
            💡 Recommandé : partagez ce reçu sur WhatsApp pour accélérer la confirmation et la livraison !
          </p>
          {order.suiviToken && (
            <Link
              href={`/suivi/${order.suiviToken}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[#ebe4d8] bg-[#faf7f2] py-3 text-sm font-semibold text-zinc-800 hover:bg-[#f5f0e8] transition"
            >
              Suivre ma commande en temps réel
            </Link>
          )}
        </div>
      </div>

      {/* ─── DÉTAILS RÉCAPITULATIFS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Infos de Livraison */}
        <div className="border border-zinc-100 rounded-2xl p-6 bg-zinc-50 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-zinc-950 text-sm border-b border-zinc-200 pb-2.5 flex items-center gap-2">
            <MapPin className="h-4.5 w-4.5 text-primary" /> Détails de Livraison
          </h3>
          <ul className="text-xs space-y-2 text-zinc-600 font-medium">
            <li><span className="text-zinc-400">Destinataire :</span> {order.clientNom}</li>
            <li><span className="text-zinc-400">Téléphone :</span> {order.clientTelephone}</li>
            <li><span className="text-zinc-400">Adresse de livraison :</span> {order.clientAdresse}</li>
            <li><span className="text-zinc-400">Ville :</span> {order.clientVille}</li>
            <li className="pt-2 border-t border-zinc-200/60 leading-relaxed text-[11px] text-zinc-500">
              {order.modePaiement === 'PAIEMENT_LIVRAISON' 
                ? '🚚 Notre livreur vous contactera par téléphone sur le numéro indiqué avant son passage.'
                : '💳 Paiement sécurisé validé. Votre colis est en cours de préparation.'}
            </li>
          </ul>
        </div>

        {/* Facturation & Paiement */}
        <div className="border border-zinc-100 rounded-2xl p-6 bg-zinc-50 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-zinc-950 text-sm border-b border-zinc-200 pb-2.5 flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-primary" /> Facturation & Paiement
          </h3>
          <ul className="text-xs space-y-2 text-zinc-600 font-medium">
            <li>
              <span className="text-zinc-400">Moyen de paiement :</span>{' '}
              <span className="font-bold text-zinc-800">
                {order.modePaiement === 'CINETPAY' ? 'Mobile Money (CinetPay)' : 'Paiement à la livraison'}
              </span>
            </li>
            <li>
              <span className="text-zinc-400">Statut du paiement :</span>{' '}
              {order.statutPaiement === 'REUSSIE' ? (
                <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-success border border-green-200">
                  Réussi
                </span>
              ) : (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  En attente / À la livraison
                </span>
              )}
            </li>
            <li className="pt-2 border-t border-zinc-200/60 space-y-1.5 text-zinc-500">
              <div className="flex justify-between">
                <span>Sous-total articles :</span>
                <span className="font-bold text-zinc-800">{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison :</span>
                <span className="font-bold text-zinc-800">{formattedShipping}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200/40 pt-2 text-zinc-900 font-black">
                <span>Montant total :</span>
                <span className="text-primary text-sm">{formattedTotal}</span>
              </div>
            </li>
          </ul>
        </div>

      </div>

      {/* ─── DÉTAIL DES ARTICLES ────────────────────────────────────────── */}
      <div className="border border-zinc-100 rounded-2xl p-6 bg-white shadow-sm space-y-4">
        <h3 className="font-extrabold text-zinc-950 text-sm border-b border-zinc-100 pb-2.5 flex items-center gap-2">
          <ShoppingBag className="h-4.5 w-4.5 text-primary" /> Articles commandés
        </h3>
        
        <div className="divide-y divide-zinc-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 flex gap-4 items-center">
              <div className="relative h-16 w-12 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 shrink-0">
                <Image
                  src={item.variante.produit.images[0]}
                  alt={item.variante.produit.nom}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-extrabold text-zinc-950 text-sm sm:text-base leading-snug line-clamp-1">
                  {item.variante.produit.nom}
                </h4>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-500 pt-1">
                  {item.variante.taille && (
                    <span className="bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5">
                      Taille: {item.variante.taille}
                    </span>
                  )}
                  {item.variante.couleur && (
                    <span className="bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5">
                      Couleur: {item.variante.couleur}
                    </span>
                  )}
                  <span className="text-zinc-400">|</span>
                  <span className="text-zinc-400">Qté: {item.quantite}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-black text-zinc-900 text-sm sm:text-base">
                  {(Number(item.prixUnitaire) * item.quantite).toLocaleString('fr-FR')} GN
                </span>
                <p className="text-[10px] text-zinc-400 font-semibold">
                  {Number(item.prixUnitaire).toLocaleString('fr-FR')} GN / u
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOUTONS PIED DE PAGE ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/produits">
          <Button variant="outline" className="w-full sm:w-auto rounded-full border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 font-bold px-8 py-5 text-sm">
            Continuer mes achats
          </Button>
        </Link>
        <Link href="/">
          <Button className="btn-primary w-full sm:w-auto rounded-full font-bold px-8 py-5 text-sm shadow-md">
            Retourner à l'accueil
          </Button>
        </Link>
      </div>

    </div>
  );
}
