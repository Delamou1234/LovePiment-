import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KabiShop database...');

  // ─── Paramètres boutique ────────────────────────────────────────────────────
  await prisma.storeSettings.upsert({
    where: { id: 'kabishop-settings' },
    update: {},
    create: {
      id: 'kabishop-settings',
      nomBoutique: 'KabiShop',
      telephone: '+224 620 00 00 00',
      adresse: 'J94Q+7VG',
      ville: 'Conakry',
      pays: 'Guinée',
      whatsappNumber: '224620000000',
      facebookUrl: 'https://www.facebook.com/kabishop',
      metaDescription:
        'Boutique de vêtements tendance à Conakry, Guinée. Paiement Mobile Money et livraison rapide.',
    },
  });

  // ─── Catégories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'robes' },
      update: {},
      create: {
        nom: 'Robes',
        slug: 'robes',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'hauts' },
      update: {},
      create: {
        nom: 'Hauts & Tops',
        slug: 'hauts',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pantalons' },
      update: {},
      create: {
        nom: 'Pantalons & Jupes',
        slug: 'pantalons',
        image: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400&q=80',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessoires' },
      update: {},
      create: {
        nom: 'Accessoires',
        slug: 'accessoires',
        image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'tenues-soiree' },
      update: {},
      create: {
        nom: 'Tenues de Soirée',
        slug: 'tenues-soiree',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80',
      },
    }),
  ]);

  console.log(`✅ ${categories.length} catégories créées`);

  // ─── Produits fictifs ────────────────────────────────────────────────────────
  const produits = [
    {
      nom: 'Robe Fleurie Élégante',
      slug: 'robe-fleurie-elegante',
      description:
        'Une robe fleurie légère et élégante, parfaite pour les sorties estivales. Tissu respirant et coupe flatteuse.',
      prix: 150000,
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
      ],
      featured: true,
      categorieId: categories[0].id,
      variantes: [
        { taille: 'XS', couleur: 'Bleu fleuri', stock: 5, sku: 'RFE-XS-BF' },
        { taille: 'S', couleur: 'Bleu fleuri', stock: 8, sku: 'RFE-S-BF' },
        { taille: 'M', couleur: 'Bleu fleuri', stock: 10, sku: 'RFE-M-BF' },
        { taille: 'L', couleur: 'Bleu fleuri', stock: 6, sku: 'RFE-L-BF' },
        { taille: 'XL', couleur: 'Bleu fleuri', stock: 3, sku: 'RFE-XL-BF' },
        { taille: 'S', couleur: 'Rouge fleuri', stock: 4, sku: 'RFE-S-RF' },
        { taille: 'M', couleur: 'Rouge fleuri', stock: 7, sku: 'RFE-M-RF' },
      ],
    },
    {
      nom: 'Top Brodé Traditionnel',
      slug: 'top-brode-traditionnel',
      description:
        'Top à broderies traditionnelles guinéennes, associant modernité et héritage culturel. Tissage artisanal de qualité.',
      prix: 85000,
      images: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
        'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80',
      ],
      featured: true,
      categorieId: categories[1].id,
      variantes: [
        { taille: 'S', couleur: 'Blanc', stock: 12, sku: 'TBT-S-W' },
        { taille: 'M', couleur: 'Blanc', stock: 15, sku: 'TBT-M-W' },
        { taille: 'L', couleur: 'Blanc', stock: 8, sku: 'TBT-L-W' },
        { taille: 'S', couleur: 'Beige', stock: 6, sku: 'TBT-S-B' },
        { taille: 'M', couleur: 'Beige', stock: 9, sku: 'TBT-M-B' },
      ],
    },
    {
      nom: 'Pantalon Taille Haute Tendance',
      slug: 'pantalon-taille-haute-tendance',
      description:
        'Pantalon taille haute tendance, coupe droite et confortable. Idéal pour un look professionnel ou casual chic.',
      prix: 120000,
      images: [
        'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=600&q=80',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
      ],
      featured: false,
      categorieId: categories[2].id,
      variantes: [
        { taille: '36', couleur: 'Noir', stock: 7, sku: 'PTH-36-N' },
        { taille: '38', couleur: 'Noir', stock: 10, sku: 'PTH-38-N' },
        { taille: '40', couleur: 'Noir', stock: 8, sku: 'PTH-40-N' },
        { taille: '42', couleur: 'Noir', stock: 5, sku: 'PTH-42-N' },
        { taille: '38', couleur: 'Beige', stock: 6, sku: 'PTH-38-B' },
        { taille: '40', couleur: 'Beige', stock: 4, sku: 'PTH-40-B' },
      ],
    },
    {
      nom: 'Robe Soirée Glamour',
      slug: 'robe-soiree-glamour',
      description:
        'Robe longue de soirée au style glamour. Tissu satiné, coupe sirène. Pour des occasions exceptionnelles.',
      prix: 350000,
      images: [
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80',
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
      ],
      featured: true,
      categorieId: categories[4].id,
      variantes: [
        { taille: 'XS', couleur: 'Bordeaux', stock: 2, sku: 'RSG-XS-BO' },
        { taille: 'S', couleur: 'Bordeaux', stock: 3, sku: 'RSG-S-BO' },
        { taille: 'M', couleur: 'Bordeaux', stock: 4, sku: 'RSG-M-BO' },
        { taille: 'L', couleur: 'Bordeaux', stock: 2, sku: 'RSG-L-BO' },
        { taille: 'S', couleur: 'Noir', stock: 5, sku: 'RSG-S-N' },
        { taille: 'M', couleur: 'Noir', stock: 4, sku: 'RSG-M-N' },
      ],
    },
    {
      nom: 'Ensemble Wax Moderne',
      slug: 'ensemble-wax-moderne',
      description:
        'Ensemble deux pièces en tissu wax aux motifs africains contemporains. Haut et pantalon coordonnés.',
      prix: 220000,
      images: [
        'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
      ],
      featured: true,
      categorieId: categories[0].id,
      variantes: [
        { taille: 'S', couleur: 'Orange & Noir', stock: 4, sku: 'EWM-S-ON' },
        { taille: 'M', couleur: 'Orange & Noir', stock: 6, sku: 'EWM-M-ON' },
        { taille: 'L', couleur: 'Orange & Noir', stock: 4, sku: 'EWM-L-ON' },
        { taille: 'XL', couleur: 'Orange & Noir', stock: 2, sku: 'EWM-XL-ON' },
        { taille: 'M', couleur: 'Bleu & Or', stock: 3, sku: 'EWM-M-BO' },
        { taille: 'L', couleur: 'Bleu & Or', stock: 3, sku: 'EWM-L-BO' },
      ],
    },
    {
      nom: 'Sac à Main Cuir Premium',
      slug: 'sac-main-cuir-premium',
      description:
        'Sac à main en cuir synthétique haut de gamme. Grande capacité, bandoulière réglable. Parfait pour le quotidien.',
      prix: 95000,
      images: [
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80',
      ],
      featured: false,
      categorieId: categories[3].id,
      variantes: [
        { taille: 'Unique', couleur: 'Noir', stock: 15, sku: 'SMC-U-N' },
        { taille: 'Unique', couleur: 'Camel', stock: 8, sku: 'SMC-U-C' },
        { taille: 'Unique', couleur: 'Bordeaux', stock: 5, sku: 'SMC-U-B' },
      ],
    },
    {
      nom: 'Jupe Midi Bohème',
      slug: 'jupe-midi-boheme',
      description:
        'Jupe midi style bohème avec imprimé floral. Légère et fluide, parfaite pour la chaleur guinéenne.',
      prix: 75000,
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
      ],
      featured: false,
      categorieId: categories[2].id,
      variantes: [
        { taille: 'XS', couleur: 'Multicolore', stock: 5, sku: 'JMB-XS-M' },
        { taille: 'S', couleur: 'Multicolore', stock: 8, sku: 'JMB-S-M' },
        { taille: 'M', couleur: 'Multicolore', stock: 10, sku: 'JMB-M-M' },
        { taille: 'L', couleur: 'Multicolore', stock: 6, sku: 'JMB-L-M' },
      ],
    },
    {
      nom: 'Blouse Dentelle Romantique',
      slug: 'blouse-dentelle-romantique',
      description:
        'Blouse en dentelle délicate avec manches longues. Un classique indémodable pour toutes occasions.',
      prix: 65000,
      images: [
        'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80',
      ],
      featured: false,
      categorieId: categories[1].id,
      variantes: [
        { taille: 'XS', couleur: 'Blanc', stock: 6, sku: 'BDR-XS-W' },
        { taille: 'S', couleur: 'Blanc', stock: 10, sku: 'BDR-S-W' },
        { taille: 'M', couleur: 'Blanc', stock: 8, sku: 'BDR-M-W' },
        { taille: 'L', couleur: 'Blanc', stock: 5, sku: 'BDR-L-W' },
        { taille: 'S', couleur: 'Crème', stock: 7, sku: 'BDR-S-C' },
        { taille: 'M', couleur: 'Crème', stock: 6, sku: 'BDR-M-C' },
      ],
    },
  ];

  let nbProduits = 0;
  for (const produit of produits) {
    const { variantes, ...produitData } = produit;
    await prisma.product.upsert({
      where: { slug: produit.slug },
      update: {},
      create: {
        ...produitData,
        variantes: { create: variantes },
      },
    });
    nbProduits++;
  }

  console.log(`✅ ${nbProduits} produits créés avec leurs variantes`);
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
