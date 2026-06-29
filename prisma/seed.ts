import { loadProjectEnv } from './load-env';

loadProjectEnv();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL manquant — vérifiez .env ou .env.local');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('🌱 Seeding Love Piment& (boutique intime)...');

  const { ensureDefaultAdmin } = await import('./ensure-admin');
  await ensureDefaultAdmin(prisma);

  const { ensureDemoCustomer } = await import('./ensure-demo-customer');
  await ensureDemoCustomer(prisma);

  const { ensureDemoCourier } = await import('./ensure-demo-courier');
  await ensureDemoCourier(prisma);

  const { ensureDemoReviews } = await import('./seed-demo-reviews');
  await ensureDemoReviews(prisma);

  await prisma.storeSettings.upsert({
    where: { id: 'lovepiment-settings' },
    update: {
      metaDescription:
        'Boutique intime pour adultes à Conakry : sextoys, lingerie, lubrifiants. Livraison discrète, paiement Mobile Money.',
      newsletterActif: true,
      newsletterTitre: 'Offre de bienvenue !',
      newsletterDescription: 'Inscrivez-vous et recevez des offres exclusives 🧡',
      newsletterImageUrl: '/images/love-piment-secret.png',
      newsletterRemisePct: 10,
      newsletterCouponCode: 'BIENVENUE10',
      livraisonTarifConakry: 15_000,
      livraisonTarifHorsConakry: 25_000,
      livraisonSeuilGratuit: 500_000,
      livraisonVilleParDefaut: 'Conakry',
      livraisonGratuiteActive: true,
      livraisonDelaiLabel: '24–48 h',
      aproposHeroKicker: 'Notre histoire',
      aproposHeroTitre: 'Le plaisir sans tabou,',
      aproposHeroAccent: 'livrée à Conakry',
      aproposHeroTexte:
        'Love Piment& est votre boutique intime à Conakry : sextoys, lingerie, lubrifiants et accessoires pour adultes. Nous offrons une expérience discrète, confidentielle et chaleureuse à chaque cliente.',
      aproposHeroImageUrl: '/images/hero-love-piment-visual.png',
      aproposMissionTitre: 'Notre mission',
      aproposMissionTexte:
        "Rendre le bien-être intime accessible à toutes les femmes de Conakry : catalogue clair, conseils personnalisés, suivi de commande en temps réel et options de paiement adaptées au marché local — le tout dans le plus strict respect de votre vie privée.",
      aproposHistoireTitre: 'Qui sommes-nous ?',
      aproposHistoireTexte:
        "Love Piment& est née d'un constat simple : en Guinée, il manquait une boutique en ligne dédiée au plaisir féminin, à la fois professionnelle et sans jugement.\n\nNous avons créé un espace où chaque femme peut explorer sa sensualité en toute confiance : commande discrète, livraison soignée et accompagnement humain à chaque étape.",
      aproposCtaTitre: 'Prêt à commander ?',
      aproposCtaTexte:
        'Parcourez notre boutique intime ou profitez de nos promotions en cours. Notre équipe reste disponible pour vous guider, en toute discrétion.',
      aproposMetaDescription:
        'Love Piment& — boutique intime pour femmes à Conakry. Sextoys, lingerie, lubrifiants. Livraison discrète, paiement Mobile Money.',
    },
    create: {
      id: 'lovepiment-settings',
      nomBoutique: 'Love Piment&',
      telephone: '+224 620 00 00 00',
      adresse: 'Conakry, Guinée',
      ville: 'Conakry',
      pays: 'Guinée',
      whatsappNumber: '224625617377',
      facebookUrl: 'https://www.facebook.com/lovepiment',
      parrainageActif: true,
      appelsActifs: true,
      newsletterActif: true,
      newsletterTitre: 'Offre de bienvenue !',
      newsletterDescription: 'Inscrivez-vous et recevez des offres exclusives 🧡',
      newsletterImageUrl: '/images/love-piment-secret.png',
      newsletterRemisePct: 10,
      newsletterCouponCode: 'BIENVENUE10',
      livraisonTarifConakry: 15_000,
      livraisonTarifHorsConakry: 25_000,
      livraisonSeuilGratuit: 500_000,
      livraisonVilleParDefaut: 'Conakry',
      livraisonGratuiteActive: true,
      livraisonDelaiLabel: '24–48 h',
      aproposHeroKicker: 'Notre histoire',
      aproposHeroTitre: 'Le plaisir sans tabou,',
      aproposHeroAccent: 'livrée à Conakry',
      aproposHeroTexte:
        'Love Piment& est votre boutique intime à Conakry : sextoys, lingerie, lubrifiants et accessoires pour adultes. Nous offrons une expérience discrète, confidentielle et chaleureuse à chaque cliente.',
      aproposHeroImageUrl: '/images/hero-love-piment-visual.png',
      aproposMissionTitre: 'Notre mission',
      aproposMissionTexte:
        "Rendre le bien-être intime accessible à toutes les femmes de Conakry : catalogue clair, conseils personnalisés, suivi de commande en temps réel et options de paiement adaptées au marché local — le tout dans le plus strict respect de votre vie privée.",
      aproposHistoireTitre: 'Qui sommes-nous ?',
      aproposHistoireTexte:
        "Love Piment& est née d'un constat simple : en Guinée, il manquait une boutique en ligne dédiée au plaisir féminin, à la fois professionnelle et sans jugement.\n\nNous avons créé un espace où chaque femme peut explorer sa sensualité en toute confiance : commande discrète, livraison soignée et accompagnement humain à chaque étape.",
      aproposCtaTitre: 'Prêt à commander ?',
      aproposCtaTexte:
        'Parcourez notre boutique intime ou profitez de nos promotions en cours. Notre équipe reste disponible pour vous guider, en toute discrétion.',
      aproposMetaDescription:
        'Love Piment& — boutique intime pour femmes à Conakry. Sextoys, lingerie, lubrifiants. Livraison discrète, paiement Mobile Money.',
      metaDescription:
        'Boutique intime pour adultes à Conakry : sextoys, lingerie, lubrifiants. Livraison discrète, paiement Mobile Money.',
    },
  });

  const carriers = [
    {
      slug: 'lovepiment-express',
      nom: 'Love Piment& Express',
      telephone: '+224 620 00 00 00',
      delaiMinHeures: 24,
      delaiMaxHeures: 48,
      description: 'Livraison interne à Conakry',
    },
    {
      slug: 'moto-coursier',
      nom: 'Moto-Coursier Conakry',
      telephone: '+224 621 00 00 00',
      delaiMinHeures: 12,
      delaiMaxHeures: 24,
      description: 'Livraison rapide en moto',
    },
    {
      slug: 'partenaire-interieur',
      nom: 'Livraison Intérieur',
      telephone: '+224 622 00 00 00',
      delaiMinHeures: 48,
      delaiMaxHeures: 72,
      description: 'Hors Conakry et environs',
    },
  ];

  for (const carrier of carriers) {
    await prisma.carrier.upsert({
      where: { slug: carrier.slug },
      update: carrier,
      create: carrier,
    });
  }

  const categoryDefs = [
    {
      slug: 'sextoys',
      nom: 'Sextoys',
      image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80',
    },
    {
      slug: 'lingerie',
      nom: 'Lingerie sexy',
      image: 'https://images.unsplash.com/photo-1490114537557-0eba90f68969?w=400&q=80',
    },
    {
      slug: 'lubrifiants',
      nom: 'Lubrifiants',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    },
    {
      slug: 'accessoires',
      nom: 'Accessoires érotiques',
      image: 'https://images.unsplash.com/photo-1615485927827-4c5b5d7cb3c7?w=400&q=80',
    },
    {
      slug: 'bien-etre-intime',
      nom: 'Bien-être intime',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80',
    },
    {
      slug: 'cadeaux-couple',
      nom: 'Cadeaux couple',
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80',
    },
  ];

  const categories = await Promise.all(
    categoryDefs.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: { nom: cat.nom, image: cat.image },
        create: cat,
      }),
    ),
  );

  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const subCategoryDefs = [
    { slug: 'vibrateurs', nom: 'Vibrateurs', parentSlug: 'sextoys' },
    { slug: 'lingerie-dentelle', nom: 'Dentelle & satin', parentSlug: 'lingerie' },
    { slug: 'lubrifiants-aqueux', nom: 'Gels aqueux', parentSlug: 'lubrifiants' },
    { slug: 'menottes-masques', nom: 'Menottes & masques', parentSlug: 'accessoires' },
    { slug: 'huiles-massage', nom: 'Huiles de massage', parentSlug: 'bien-etre-intime' },
  ];

  for (const sub of subCategoryDefs) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { nom: sub.nom, parentId: bySlug[sub.parentSlug].id, actif: true },
      create: { slug: sub.slug, nom: sub.nom, parentId: bySlug[sub.parentSlug].id, actif: true },
    });
  }

  const validCategorySlugs = [
    ...categoryDefs.map((c) => c.slug),
    ...subCategoryDefs.map((c) => c.slug),
  ];
  await prisma.category.updateMany({
    where: { slug: { notIn: validCategorySlugs } },
    data: { actif: false },
  });

  const promoFin = new Date();
  promoFin.setUTCDate(promoFin.getUTCDate() + 30);

  const produits = [
    {
      nom: 'Vibrateur Silencieux Rose',
      slug: 'vibrateur-silencieux-rose',
      marque: 'Love Piment&',
      description:
        'Vibrateur discret au design ergonomique. Silencieux, rechargeable USB, silicone médical doux.',
      prix: 185000,
      prixPromo: 148000,
      promoFin,
      images: ['/images/love-piment-secret.png'],
      featured: true,
      categorieId: bySlug['sextoys'].id,
      variantes: [{ capacite: 'Standard', couleur: 'Rose', stock: 15, sku: 'STY-VIB-ROSE', codeBarre: '3761001001001' }],
    },
    {
      nom: 'Lubrifiant Secret Love',
      slug: 'lubrifiant-secret-love',
      marque: 'Love Piment&',
      description:
        'Gel lubrifiant à base d\'eau, non collant, compatible préservatifs. Format discret 100ml.',
      prix: 45000,
      prixPromo: 36000,
      promoFin,
      images: ['/images/love-piment-secret.png'],
      featured: true,
      categorieId: bySlug['lubrifiants'].id,
      variantes: [{ capacite: '100ml', couleur: 'Transparent', stock: 30, sku: 'LUB-SEC-100', codeBarre: '3761002001001' }],
    },
    {
      nom: 'Nuisette Dentelle Noire',
      slug: 'nuisette-dentelle-noire',
      marque: 'Love Piment&',
      description:
        'Nuisette en dentelle fine avec bretelles réglables. Coupe ajustée, taille unique élastique.',
      prix: 95000,
      prixPromo: 76000,
      promoFin,
      images: ['https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80'],
      featured: true,
      categorieId: bySlug['lingerie'].id,
      variantes: [{ taille: 'TU', couleur: 'Noir', stock: 20, sku: 'LNG-NUI-NOIR', codeBarre: '3761003001001' }],
    },
    {
      nom: 'Menottes Velours Doux',
      slug: 'menottes-velours-doux',
      marque: 'Love Piment&',
      description: 'Menottes en velours avec fermeture à clip rapide. Confortables et réversibles.',
      prix: 55000,
      images: ['https://images.unsplash.com/photo-1615485927827-4c5b5d7cb3c7?w=600&q=80'],
      featured: true,
      categorieId: bySlug['accessoires'].id,
      variantes: [{ couleur: 'Rouge', stock: 18, sku: 'ACC-MEN-VEL', codeBarre: '3761004001001' }],
    },
    {
      nom: 'Huile de Massage Sensuelle',
      slug: 'huile-massage-sensuelle',
      marque: 'Love Piment&',
      description:
        'Huile chauffante aux notes de vanille et ylang-ylang. Texture soyeuse, comestible.',
      prix: 65000,
      prixPromo: 52000,
      promoFin,
      images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'],
      featured: true,
      categorieId: bySlug['bien-etre-intime'].id,
      variantes: [{ capacite: '150ml', couleur: 'Vanille', stock: 22, sku: 'BEM-HUI-150', codeBarre: '3761005001001' }],
    },
    {
      nom: 'Bullet Vibrant Discret',
      slug: 'bullet-vibrant-discret',
      marque: 'Love Piment&',
      description: 'Mini vibromasseur compact, 10 modes de vibration. Étanche, parfait pour les déplacements.',
      prix: 75000,
      images: ['https://images.unsplash.com/photo-1490114537557-0eba90f68969?w=600&q=80'],
      featured: false,
      categorieId: bySlug['sextoys'].id,
      variantes: [{ couleur: 'Noir', stock: 25, sku: 'STY-BUL-NOIR', codeBarre: '3761006001001' }],
    },
    {
      nom: 'Coffret Couple Passion',
      slug: 'coffret-couple-passion',
      marque: 'Love Piment&',
      description:
        'Coffret cadeau : huile de massage, gel stimulant et accessoire surprise. Emballage cadeau discret.',
      prix: 120000,
      prixPromo: 96000,
      promoFin,
      images: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80'],
      featured: false,
      categorieId: bySlug['cadeaux-couple'].id,
      variantes: [{ couleur: 'Rouge', stock: 10, sku: 'CAD-COF-PAS', codeBarre: '3761007001001' }],
    },
    {
      nom: 'Body Rouge Satin',
      slug: 'body-rouge-satin',
      marque: 'Love Piment&',
      description: 'Body en satin rouge avec décolleté plongeant. Fermeture pression à l\'entrejambe.',
      prix: 85000,
      images: ['https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80'],
      featured: false,
      categorieId: bySlug['lingerie'].id,
      variantes: [
        { taille: 'S', couleur: 'Rouge', stock: 8, sku: 'LNG-BOD-S', codeBarre: '3761008001001' },
        { taille: 'M', couleur: 'Rouge', stock: 12, sku: 'LNG-BOD-M', codeBarre: '3761008001002' },
      ],
    },
    {
      nom: 'Gel Stimulant Intense',
      slug: 'gel-stimulant-intense',
      marque: 'Love Piment&',
      description: 'Gel stimulant effet chaud-froid pour intensifier les sensations. Format voyage 50ml.',
      prix: 48000,
      images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'],
      featured: false,
      categorieId: bySlug['lubrifiants'].id,
      variantes: [{ capacite: '50ml', couleur: 'Transparent', stock: 28, sku: 'LUB-GEL-50', codeBarre: '3761009001001' }],
    },
  ];

  for (const produit of produits) {
    const { variantes, prixPromo, promoFin: finPromo, ...produitData } = produit;
    const saved = await prisma.product.upsert({
      where: { slug: produit.slug },
      update: {
        nom: produitData.nom,
        marque: produitData.marque ?? null,
        description: produitData.description,
        prix: produitData.prix,
        prixPromo: prixPromo ?? null,
        promoFin: finPromo ?? null,
        images: produitData.images,
        featured: produitData.featured,
        categorieId: produitData.categorieId,
        actif: true,
      },
      create: {
        ...produitData,
        prixPromo: prixPromo ?? null,
        promoFin: finPromo ?? null,
        actif: true,
      },
    });

    for (const variante of variantes) {
      if (!variante.sku) continue;
      await prisma.productVariant.upsert({
        where: { sku: variante.sku },
        update: {
          taille: variante.taille ?? null,
          couleur: variante.couleur,
          capacite: variante.capacite ?? null,
          stock: variante.stock,
          codeBarre: variante.codeBarre ?? null,
        },
        create: {
          taille: variante.taille ?? null,
          couleur: variante.couleur,
          capacite: variante.capacite ?? null,
          stock: variante.stock,
          sku: variante.sku,
          codeBarre: variante.codeBarre ?? null,
          productId: saved.id,
        },
      });
    }
  }

  const validProductSlugs = produits.map((p) => p.slug);
  await prisma.product.updateMany({
    where: { slug: { notIn: validProductSlugs } },
    data: { actif: false },
  });

  const flashProducts = await prisma.product.findMany({
    where: { featured: true, actif: true },
    take: 3,
    select: { id: true },
  });

  await prisma.coupon.upsert({
    where: { code: 'BIENVENUE10' },
    update: { actif: true, type: 'POURCENT', valeur: 10, minCommande: 50000, premiereCommandeOnly: true },
    create: {
      code: 'BIENVENUE10',
      type: 'POURCENT',
      valeur: 10,
      minCommande: 50000,
      premiereCommandeOnly: true,
      actif: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'KABI5000' },
    update: { actif: true, type: 'MONTANT_FIXE', valeur: 5000, minCommande: 100000 },
    create: {
      code: 'KABI5000',
      type: 'MONTANT_FIXE',
      valeur: 5000,
      minCommande: 100000,
      maxUtilisations: 100,
      actif: true,
    },
  });

  const flashDebut = new Date();
  const flashFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.flashSale.upsert({
    where: { slug: 'flash-semaine' },
    update: {
      titre: 'Flash Semaine — Plaisir & Intimité',
      debut: flashDebut,
      fin: flashFin,
      actif: true,
      productIds: flashProducts.map((p) => p.id),
    },
    create: {
      titre: 'Flash Semaine — Plaisir & Intimité',
      slug: 'flash-semaine',
      description: 'Sélection limitée à prix réduits',
      debut: flashDebut,
      fin: flashFin,
      actif: true,
      productIds: flashProducts.map((p) => p.id),
    },
  });

  const clientsSansCode = await prisma.customer.findMany({
    where: { codeParrainage: null },
    select: { id: true },
  });
  for (const client of clientsSansCode) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    await prisma.customer.update({
      where: { id: client.id },
      data: { codeParrainage: `KABI${suffix}` },
    });
  }

  console.log(`✅ ${categories.length} catégories, ${produits.length} produits`);
  console.log('🎉 Seeding terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
