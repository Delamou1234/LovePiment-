import type { PrismaClient } from '@prisma/client';

const AVIS_DEMO = [
  {
    email: 'sophie.avis@lovepiment.gn',
    nom: 'Sophie Camara',
    ville: 'Conakry',
    note: 5,
    commentaire:
      'Livraison ultra discrète, emballage neutre. Les produits sont de très bonne qualité, je recommande !',
    productSlug: 'vibrateur-silencieux-rose',
  },
  {
    email: 'aminata.avis@lovepiment.gn',
    nom: 'Aminata Diallo',
    ville: 'Conakry',
    note: 5,
    commentaire:
      'Service client au top, réponses rapides sur WhatsApp. Ma commande est arrivée en 24h à Conakry.',
    productSlug: 'lubrifiant-secret-love',
  },
  {
    email: 'fatou.avis@lovepiment.gn',
    nom: 'Fatou Bah',
    ville: 'Ratoma',
    note: 5,
    commentaire:
      'Large choix de produits, prix corrects. Le site est discret et facile à utiliser. Très satisfaite !',
    productSlug: 'nuisette-dentelle-noire',
  },
  {
    email: 'mariama.avis@lovepiment.gn',
    nom: 'Mariama Sylla',
    ville: 'Dixinn',
    note: 5,
    commentaire:
      'Emballage totalement neutre, livreur très professionnel. Je commanderai à nouveau sans hésiter.',
    productSlug: 'bullet-vibrant-discret',
  },
  {
    email: 'kadiatou.avis@lovepiment.gn',
    nom: 'Kadiatou Barry',
    ville: 'Conakry',
    note: 4,
    commentaire:
      'Belle qualité pour le prix. Le paiement à la livraison est pratique et rassurant.',
    productSlug: 'huile-massage-sensuelle',
  },
  {
    email: 'awa.avis@lovepiment.gn',
    nom: 'Awa Condé',
    ville: 'Matam',
    note: 5,
    commentaire:
      'Première commande sur Love Piment& : simple, rapide et confidentiel. Merci à l\'équipe !',
    productSlug: 'gel-stimulant-intense',
  },
] as const;

/** Avis clients vérifiés pour la page d'accueil (idempotent). */
export async function ensureDemoReviews(prisma: PrismaClient) {
  let created = 0;

  for (const avis of AVIS_DEMO) {
    const product = await prisma.product.findFirst({
      where: { slug: avis.productSlug, actif: true },
      include: { variantes: { take: 1 } },
    });
    const variant = product?.variantes[0];
    if (!product || !variant) continue;

    const customer = await prisma.customer.upsert({
      where: { email: avis.email },
      update: { nom: avis.nom, villePreferee: avis.ville },
      create: {
        email: avis.email,
        nom: avis.nom,
        villePreferee: avis.ville,
        telephone: '+224620000000',
      },
    });

    let order = await prisma.order.findFirst({
      where: {
        customerId: customer.id,
        items: { some: { variantId: variant.id } },
      },
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          customerId: customer.id,
          clientNom: avis.nom,
          clientTelephone: '+224620000000',
          clientAdresse: 'Quartier résidentiel',
          clientVille: avis.ville,
          statut: 'LIVREE',
          modePaiement: 'PAIEMENT_LIVRAISON',
          statutPaiement: 'REUSSIE',
          montantTotal: Number(product.prix),
          livreeLe: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          items: {
            create: {
              variantId: variant.id,
              quantite: 1,
              prixUnitaire: Number(product.prix),
            },
          },
        },
      });
    } else if (order.statut !== 'LIVREE') {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { statut: 'LIVREE', statutPaiement: 'REUSSIE', livreeLe: order.livreeLe ?? new Date() },
      });
    }

    const existing = await prisma.productReview.findUnique({
      where: { orderId_productId: { orderId: order.id, productId: product.id } },
    });

    if (!existing) created += 1;

    await prisma.productReview.upsert({
      where: { orderId_productId: { orderId: order.id, productId: product.id } },
      update: {
        note: avis.note,
        commentaire: avis.commentaire,
        statut: 'APPROUVE',
        achatVerifie: true,
        modereLe: new Date(),
      },
      create: {
        productId: product.id,
        customerId: customer.id,
        orderId: order.id,
        note: avis.note,
        commentaire: avis.commentaire,
        statut: 'APPROUVE',
        achatVerifie: true,
        modereLe: new Date(),
      },
    });
  }

  if (created > 0) {
    console.log(`✅ ${created} avis clients démo (page d'accueil)`);
  } else {
    console.log(`ℹ️  Avis clients démo déjà en place`);
  }
}
