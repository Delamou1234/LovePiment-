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
  console.log('🌱 Seeding KabiShop (parfums & huiles)...');

  const { ensureDefaultAdmin } = await import('./ensure-admin');
  await ensureDefaultAdmin(prisma);

  const { ensureDemoCustomer } = await import('./ensure-demo-customer');
  await ensureDemoCustomer(prisma);

  const { ensureDemoCourier } = await import('./ensure-demo-courier');
  await ensureDemoCourier(prisma);

  await prisma.storeSettings.upsert({
    where: { id: 'kabishop-settings' },
    update: {
      metaDescription:
        'Parfums, huiles pour la peau et crèmes corporelles à Conakry, Guinée. Paiement Mobile Money et livraison rapide.',
    },
    create: {
      id: 'kabishop-settings',
      nomBoutique: 'KabiShop',
      telephone: '+224 620 00 00 00',
      adresse: 'Conakry, Guinée',
      ville: 'Conakry',
      pays: 'Guinée',
      whatsappNumber: '224625617377',
      facebookUrl: 'https://www.facebook.com/kabishop',
      parrainageActif: true,
      appelsActifs: true,
      metaDescription:
        'Parfums, huiles pour la peau et crèmes corporelles à Conakry, Guinée. Paiement Mobile Money et livraison rapide.',
    },
  });

  const carriers = [
    {
      slug: 'kabishop-express',
      nom: 'KabiShop Express',
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
      slug: 'parfums',
      nom: 'Parfums',
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80',
    },
    {
      slug: 'huiles-corps',
      nom: 'Huiles corporelles',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80',
    },
    {
      slug: 'cremes-corporelles',
      nom: 'Crèmes corporelles',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    },
    {
      slug: 'huiles-capillaires',
      nom: 'Huiles capillaires',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    },
    {
      slug: 'eaux-parfum',
      nom: 'Eaux de parfum',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
    },
    {
      slug: 'huiles-pures',
      nom: 'Huiles pures',
      image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80',
    },
    {
      slug: 'pommades-baumes',
      nom: 'Pommades & baumes',
      image:
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=85&auto=format&fit=crop',
    },
    {
      slug: 'gels-douche',
      nom: 'Gels douche & savons',
      image:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=85&auto=format&fit=crop',
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
    { slug: 'parfums-orientaux', nom: 'Parfums orientaux', parentSlug: 'parfums' },
    { slug: 'eaux-legere', nom: 'Eaux légères', parentSlug: 'eaux-parfum' },
    { slug: 'huiles-nourrissantes', nom: 'Huiles nourrissantes', parentSlug: 'huiles-corps' },
    { slug: 'cremes-hydratantes', nom: 'Crèmes hydratantes', parentSlug: 'cremes-corporelles' },
    { slug: 'huiles-cheveux', nom: 'Soins cheveux', parentSlug: 'huiles-capillaires' },
  ];

  for (const sub of subCategoryDefs) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { nom: sub.nom, parentId: bySlug[sub.parentSlug].id },
      create: { slug: sub.slug, nom: sub.nom, parentId: bySlug[sub.parentSlug].id },
    });
  }

  const promoFin = new Date();
  promoFin.setUTCDate(promoFin.getUTCDate() + 30);

  const produits = [
    {
      nom: 'Parfum Oud Royal 100ml',
      slug: 'parfum-oud-royal',
      marque: 'Oud Collection',
      description:
        "Fragrance orientale intense aux notes d'oud, de rose et d'ambre. Tenue longue durée, flacon élégant.",
      prix: 95000,
      prixPromo: 76000,
      promoFin,
      images: [
        'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80',
        'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&q=80',
      ],
      featured: true,
      categorieId: bySlug['parfums'].id,
      variantes: [
        {
          capacite: '100ml',
          couleur: 'Oud Royal',
          stock: 20,
          sku: 'PRF-OUD-100',
          codeBarre: '3760001001001',
        },
        {
          capacite: '50ml',
          couleur: 'Oud Royal',
          stock: 12,
          sku: 'PRF-OUD-50',
          codeBarre: '3760001001002',
        },
      ],
    },
    {
      nom: 'Eau de Parfum Rose Ambre 50ml',
      slug: 'eau-parfum-rose-ambre',
      marque: 'KabiShop',
      description:
        'Notes florales de rose damascena et fond ambré chaud. Fraîcheur élégante pour le quotidien.',
      prix: 75000,
      prixPromo: 60000,
      promoFin,
      images: [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80',
        'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80',
      ],
      featured: true,
      categorieId: bySlug['eaux-parfum'].id,
      variantes: [
        {
          capacite: '50ml',
          couleur: 'Rose Ambre',
          stock: 15,
          sku: 'EDP-RA-50',
          codeBarre: '3760002001001',
        },
      ],
    },
    {
      nom: 'Huile Corporelle Karité & Coco',
      slug: 'huile-corps-karite-coco',
      marque: 'KabiShop',
      description:
        'Huile hydratante au beurre de karité et huile de coco. Peau douce, satinée et délicatement parfumée.',
      prix: 65000,
      prixPromo: 52000,
      promoFin,
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80'],
      featured: true,
      categorieId: bySlug['huiles-corps'].id,
      variantes: [{ capacite: '200ml', couleur: 'Naturel', stock: 18, sku: 'HUI-KAR', codeBarre: '3760003001001' }],
    },
    {
      nom: 'Crème Corporelle Karité & Cacao',
      slug: 'creme-corps-karite-cacao',
      marque: 'KabiShop',
      description:
        'Crème riche au beurre de karité et beurre de cacao. Nourrit, adoucit et parfume la peau sans la graisser.',
      prix: 58000,
      prixPromo: 46400,
      promoFin,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80'],
      featured: true,
      categorieId: bySlug['cremes-corporelles'].id,
      variantes: [{ capacite: '250ml', couleur: 'Naturel', stock: 22, sku: 'CRM-KAR', codeBarre: '3760003002001' }],
    },
    {
      nom: 'Huile Capillaire Croissance & Brillance',
      slug: 'huile-capillaire-croissance',
      marque: 'Afro Glow',
      description:
        'Formule enrichie en huiles nourrissantes pour stimuler la pousse et apporter brillance aux cheveux afro.',
      prix: 55000,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80'],
      featured: true,
      categorieId: bySlug['huiles-capillaires'].id,
      variantes: [{ capacite: '150ml', couleur: 'Standard', stock: 25, sku: 'HUI-CAP', codeBarre: '3760004001001' }],
    },
    {
      nom: 'Parfum Musk Blanc 100ml',
      slug: 'parfum-musk-blanc',
      marque: 'Oud Collection',
      description:
        'Musc blanc pur et enveloppant. Sillage discret et raffiné, idéal pour toutes occasions.',
      prix: 85000,
      prixPromo: 68000,
      promoFin,
      images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80'],
      featured: true,
      categorieId: bySlug['parfums'].id,
      variantes: [{ capacite: '100ml', couleur: 'Musk Blanc', stock: 12, sku: 'PRF-MUSK', codeBarre: '3760005001001' }],
    },
    {
      nom: 'Huile de Nigelle Pure 100ml',
      slug: 'huile-nigelle-pure',
      marque: 'Pure Nature',
      description:
        'Huile de nigelle 100% pure. Traditionnellement utilisée pour la peau et les cheveux.',
      prix: 48000,
      images: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80'],
      featured: false,
      categorieId: bySlug['huiles-pures'].id,
      variantes: [{ capacite: '100ml', couleur: 'Pure', stock: 30, sku: 'HUI-NIG', codeBarre: '3760006001001' }],
    },
    {
      nom: 'Parfum Vanille Gourmande 50ml',
      slug: 'parfum-vanille-gourmande',
      marque: 'KabiShop',
      description:
        'Vanille bourbon, caramel doux et notes boisées. Un parfum gourmand et addictif.',
      prix: 72000,
      images: ['https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&q=80'],
      featured: false,
      categorieId: bySlug['eaux-parfum'].id,
      variantes: [{ capacite: '50ml', couleur: 'Vanille', stock: 14, sku: 'EDP-VAN', codeBarre: '3760007001001' }],
    },
    {
      nom: 'Huile de Massage Ylang-Ylang',
      slug: 'huile-massage-ylang',
      marque: 'KabiShop',
      description:
        "Huile de massage relaxante aux essences d'ylang-ylang et d'amande douce. Texture soyeuse.",
      prix: 58000,
      images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80'],
      featured: false,
      categorieId: bySlug['huiles-corps'].id,
      variantes: [{ capacite: '250ml', couleur: 'Ylang-Ylang', stock: 16, sku: 'HUI-YLA', codeBarre: '3760008001001' }],
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

  const flashProducts = await prisma.product.findMany({
    where: { featured: true, actif: true },
    take: 3,
    select: { id: true },
  });

  await prisma.coupon.upsert({
    where: { code: 'BIENVENUE10' },
    update: { actif: true, type: 'POURCENT', valeur: 10, minCommande: 50000 },
    create: {
      code: 'BIENVENUE10',
      type: 'POURCENT',
      valeur: 10,
      minCommande: 50000,
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
      titre: 'Flash Semaine — Parfums & Huiles',
      debut: flashDebut,
      fin: flashFin,
      actif: true,
      productIds: flashProducts.map((p) => p.id),
    },
    create: {
      titre: 'Flash Semaine — Parfums & Huiles',
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
