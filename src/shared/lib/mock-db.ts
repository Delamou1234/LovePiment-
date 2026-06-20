import type { Category, Product, ProductVariant, Order, OrderItem } from '@prisma/client';

// ─── TYPES POUR LE MOCK ──────────────────────────────────────────────────────

export type MockProduct = Product & {
  categorie: Category;
  variantes: ProductVariant[];
};

export type MockOrderItem = OrderItem & {
  variante: ProductVariant & {
    produit: { nom: string; images: string[]; slug: string };
  };
};

export type MockOrder = Order & {
  items: MockOrderItem[];
};

// ─── INITIALISATION DES DONNÉES FICTIVES ──────────────────────────────────────

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    nom: 'Robes',
    slug: 'robes',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-2',
    nom: 'Hauts & Tops',
    slug: 'hauts',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-3',
    nom: 'Pantalons & Jupes',
    slug: 'pantalons',
    image: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-4',
    nom: 'Accessoires',
    slug: 'accessoires',
    image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-5',
    nom: 'Tenues de Soirée',
    slug: 'tenues-soiree',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-6',
    nom: 'Parfums',
    slug: 'parfums',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-7',
    nom: 'Pommades & Crèmes',
    slug: 'pommades',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-8',
    nom: 'Soins Corps',
    slug: 'soins-corps',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export type Univers = 'mode' | 'beaute';

export const CATEGORY_UNIVERS: Record<string, Univers> = {
  robes: 'mode',
  hauts: 'mode',
  pantalons: 'mode',
  accessoires: 'mode',
  'tenues-soiree': 'mode',
  parfums: 'beaute',
  pommades: 'beaute',
  'soins-corps': 'beaute',
};

export function getUniversForCategory(slug: string): Univers {
  return CATEGORY_UNIVERS[slug] ?? 'mode';
}

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-1',
    nom: 'Robe Fleurie Élégante',
    slug: 'robe-fleurie-elegante',
    description: 'Une robe fleurie légère et élégante, parfaite pour les sorties estivales. Tissu respirant et coupe flatteuse.',
    prix: 150000 as any, // Decimal type representation in mock
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
    ],
    actif: true,
    featured: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // il y a 5 jours
    updatedAt: new Date(),
    categorieId: 'cat-1',
    categorie: MOCK_CATEGORIES[0],
    variantes: [
      { id: 'v-1', taille: 'XS', couleur: 'Bleu fleuri', stock: 5, sku: 'RFE-XS-BF', prix: null, productId: 'prod-1' },
      { id: 'v-2', taille: 'S', couleur: 'Bleu fleuri', stock: 8, sku: 'RFE-S-BF', prix: null, productId: 'prod-1' },
      { id: 'v-3', taille: 'M', couleur: 'Bleu fleuri', stock: 10, sku: 'RFE-M-BF', prix: null, productId: 'prod-1' },
      { id: 'v-4', taille: 'L', couleur: 'Bleu fleuri', stock: 6, sku: 'RFE-L-BF', prix: null, productId: 'prod-1' },
      { id: 'v-5', taille: 'XL', couleur: 'Bleu fleuri', stock: 3, sku: 'RFE-XL-BF', prix: null, productId: 'prod-1' },
      { id: 'v-6', taille: 'S', couleur: 'Rouge fleuri', stock: 4, sku: 'RFE-S-RF', prix: null, productId: 'prod-1' },
      { id: 'v-7', taille: 'M', couleur: 'Rouge fleuri', stock: 7, sku: 'RFE-M-RF', prix: null, productId: 'prod-1' },
    ],
  },
  {
    id: 'prod-2',
    nom: 'Top Brodé Traditionnel',
    slug: 'top-brode-traditionnel',
    description: 'Top à broderies traditionnelles guinéennes, associant modernité et héritage culturel. Tissage artisanal de qualité.',
    prix: 85000 as any,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
      'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80',
    ],
    actif: true,
    featured: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categorieId: 'cat-2',
    categorie: MOCK_CATEGORIES[1],
    variantes: [
      { id: 'v-8', taille: 'S', couleur: 'Blanc', stock: 12, sku: 'TBT-S-W', prix: null, productId: 'prod-2' },
      { id: 'v-9', taille: 'M', couleur: 'Blanc', stock: 15, sku: 'TBT-M-W', prix: null, productId: 'prod-2' },
      { id: 'v-10', taille: 'L', couleur: 'Blanc', stock: 8, sku: 'TBT-L-W', prix: null, productId: 'prod-2' },
      { id: 'v-11', taille: 'S', couleur: 'Beige', stock: 6, sku: 'TBT-S-B', prix: null, productId: 'prod-2' },
      { id: 'v-12', taille: 'M', couleur: 'Beige', stock: 9, sku: 'TBT-M-B', prix: null, productId: 'prod-2' },
    ],
  },
  {
    id: 'prod-3',
    nom: 'Pantalon Taille Haute Tendance',
    slug: 'pantalon-taille-haute-tendance',
    description: 'Pantalon taille haute tendance, coupe droite et confortable. Idéal pour un look professionnel ou casual chic.',
    prix: 120000 as any,
    images: [
      'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=600&q=80',
    ],
    actif: true,
    featured: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categorieId: 'cat-3',
    categorie: MOCK_CATEGORIES[2],
    variantes: [
      { id: 'v-13', taille: '36', couleur: 'Noir', stock: 7, sku: 'PTH-36-N', prix: null, productId: 'prod-3' },
      { id: 'v-14', taille: '38', couleur: 'Noir', stock: 10, sku: 'PTH-38-N', prix: null, productId: 'prod-3' },
      { id: 'v-15', taille: '40', couleur: 'Noir', stock: 8, sku: 'PTH-40-N', prix: null, productId: 'prod-3' },
      { id: 'v-16', taille: '42', couleur: 'Noir', stock: 5, sku: 'PTH-42-N', prix: null, productId: 'prod-3' },
      { id: 'v-17', taille: '38', couleur: 'Beige', stock: 6, sku: 'PTH-38-B', prix: null, productId: 'prod-3' },
      { id: 'v-18', taille: '40', couleur: 'Beige', stock: 4, sku: 'PTH-40-B', prix: null, productId: 'prod-3' },
    ],
  },
  {
    id: 'prod-4',
    nom: 'Robe Soirée Glamour',
    slug: 'robe-soiree-glamour',
    description: 'Robe longue de soirée au style glamour. Tissu satiné, coupe sirène. Pour des occasions exceptionnelles.',
    prix: 350000 as any,
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80',
    ],
    actif: true,
    featured: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categorieId: 'cat-5',
    categorie: MOCK_CATEGORIES[4],
    variantes: [
      { id: 'v-19', taille: 'XS', couleur: 'Bordeaux', stock: 2, sku: 'RSG-XS-BO', prix: null, productId: 'prod-4' },
      { id: 'v-20', taille: 'S', couleur: 'Bordeaux', stock: 3, sku: 'RSG-S-BO', prix: null, productId: 'prod-4' },
      { id: 'v-21', taille: 'M', couleur: 'Bordeaux', stock: 4, sku: 'RSG-M-BO', prix: null, productId: 'prod-4' },
      { id: 'v-22', taille: 'L', couleur: 'Bordeaux', stock: 2, sku: 'RSG-L-BO', prix: null, productId: 'prod-4' },
      { id: 'v-23', taille: 'S', couleur: 'Noir', stock: 5, sku: 'RSG-S-N', prix: null, productId: 'prod-4' },
      { id: 'v-24', taille: 'M', couleur: 'Noir', stock: 4, sku: 'RSG-M-N', prix: null, productId: 'prod-4' },
    ],
  },
  {
    id: 'prod-5',
    nom: 'Ensemble Wax Moderne',
    slug: 'ensemble-wax-moderne',
    description: 'Ensemble deux pièces en tissu wax aux motifs africains contemporains. Haut et pantalon coordonnés.',
    prix: 220000 as any,
    images: [
      'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80',
    ],
    actif: true,
    featured: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categorieId: 'cat-1',
    categorie: MOCK_CATEGORIES[0],
    variantes: [
      { id: 'v-25', taille: 'S', couleur: 'Orange & Noir', stock: 4, sku: 'EWM-S-ON', prix: null, productId: 'prod-5' },
      { id: 'v-26', taille: 'M', couleur: 'Orange & Noir', stock: 6, sku: 'EWM-M-ON', prix: null, productId: 'prod-5' },
      { id: 'v-27', taille: 'L', couleur: 'Orange & Noir', stock: 4, sku: 'EWM-L-ON', prix: null, productId: 'prod-5' },
      { id: 'v-28', taille: 'XL', couleur: 'Orange & Noir', stock: 2, sku: 'EWM-XL-ON', prix: null, productId: 'prod-5' },
      { id: 'v-29', taille: 'M', couleur: 'Bleu & Or', stock: 3, sku: 'EWM-M-BO', prix: null, productId: 'prod-5' },
      { id: 'v-30', taille: 'L', couleur: 'Bleu & Or', stock: 3, sku: 'EWM-L-BO', prix: null, productId: 'prod-5' },
    ],
  },
  {
    id: 'prod-6',
    nom: 'Parfum Oud Royal 100ml',
    slug: 'parfum-oud-royal',
    description: 'Fragrance orientale intense aux notes d\'oud, de rose et d\'ambre. Tenue longue durée, flacon élégant.',
    prix: 95000 as any,
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80',
    ],
    actif: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categorieId: 'cat-6',
    categorie: MOCK_CATEGORIES[5],
    variantes: [
      { id: 'v-31', taille: '100ml', couleur: 'Oud Royal', stock: 20, sku: 'PRF-OUD', prix: null, productId: 'prod-6' },
    ],
  },
  {
    id: 'prod-7',
    nom: 'Pommade Capillaire Brillance Afro',
    slug: 'pommade-capillaire-brillance',
    description: 'Pommade nourrissante pour cheveux afro et bouclés. Fixation légère, brillance naturelle sans résidu.',
    prix: 45000 as any,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
    ],
    actif: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categorieId: 'cat-7',
    categorie: MOCK_CATEGORIES[6],
    variantes: [
      { id: 'v-32', taille: '250g', couleur: 'Standard', stock: 35, sku: 'POM-BRI', prix: null, productId: 'prod-7' },
    ],
  },
  {
    id: 'prod-8',
    nom: 'Huile Corps Karité & Coco',
    slug: 'huile-corps-karite-coco',
    description: 'Huile hydratante au beurre de karité et huile de coco. Peau douce et parfumée toute la journée.',
    prix: 65000 as any,
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    ],
    actif: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    categorieId: 'cat-8',
    categorie: MOCK_CATEGORIES[7],
    variantes: [
      { id: 'v-33', taille: '200ml', couleur: 'Naturel', stock: 18, sku: 'SOI-KAR', prix: null, productId: 'prod-8' },
    ],
  },
];

// Stockage dynamique en mémoire pour les commandes et analytics
let MOCK_ORDERS: MockOrder[] = [];

export type MockAnalyticsEvent = {
  id: string;
  type: string;
  path?: string;
  productId?: string;
  sessionId?: string;
  userAgent?: string;
  createdAt: Date;
};

let MOCK_ANALYTICS_EVENTS: MockAnalyticsEvent[] = [];

// Paramètres de la boutique fictive
export const MOCK_STORE_SETTINGS = {
  id: 'kabishop-settings',
  nomBoutique: 'KabiShop',
  telephone: '+224 620 00 00 00',
  adresse: 'J94Q+7VG, Conakry, Guinée',
  ville: 'Conakry',
  pays: 'Guinée',
  whatsappNumber: '224620000000',
  facebookUrl: 'https://www.facebook.com/kabishop',
  instagramUrl: 'https://www.instagram.com/kabishop',
  email: 'contact@kabishop.com',
  metaDescription: 'Boutique de vêtements tendance à Conakry, Guinée. Paiement Mobile Money et livraison rapide.',
  updatedAt: new Date(),
};

// ─── SERVICES D'ACCÈS AUX DONNÉES FICTIVES ────────────────────────────────────

export const mockDb = {
  // --- Catégories ---
  getCategories: () => MOCK_CATEGORIES,
  getCategoryBySlug: (slug: string) => MOCK_CATEGORIES.find((c) => c.slug === slug),
  getCategoriesByUnivers: (univers: Univers) =>
    MOCK_CATEGORIES.filter((c) => getUniversForCategory(c.slug) === univers),

  // --- Produits ---
  getProducts: () => MOCK_PRODUCTS,
  getProductsByUnivers: (univers: Univers) =>
    MOCK_PRODUCTS.filter(
      (p) => p.actif && getUniversForCategory(p.categorie.slug) === univers,
    ),
  getProductBySlug: (slug: string) => MOCK_PRODUCTS.find((p) => p.slug === slug),
  getProductById: (id: string) => MOCK_PRODUCTS.find((p) => p.id === id),
  getVariantById: (variantId: string) => {
    for (const p of MOCK_PRODUCTS) {
      const v = p.variantes.find((varItem) => varItem.id === variantId);
      if (v) return { variant: v, product: p };
    }
    return null;
  },

  // --- Commandes ---
  getOrders: () => MOCK_ORDERS,
  getOrderById: (id: string) => MOCK_ORDERS.find((o) => o.id === id),
  getOrderByCinetpayTxId: (txId: string) => MOCK_ORDERS.find((o) => o.cinetpayTxId === txId),
  
  createOrder: (orderData: {
    clientNom: string;
    clientTelephone: string;
    clientAdresse: string;
    clientVille: string;
    modePaiement: 'CINETPAY' | 'PAIEMENT_LIVRAISON';
    items: { variantId: string; quantite: number; prixUnitaire: number }[];
  }): MockOrder => {
    const total = orderData.items.reduce((acc, item) => acc + item.prixUnitaire * item.quantite, 0);
    const orderId = 'order-' + Math.random().toString(36).substr(2, 9);
    
    const items: MockOrderItem[] = orderData.items.map((i, idx) => {
      const varInfo = mockDb.getVariantById(i.variantId);
      if (!varInfo) throw new Error(`Variante ${i.variantId} introuvable`);
      
      // Déduire le stock
      varInfo.variant.stock = Math.max(0, varInfo.variant.stock - i.quantite);

      return {
        id: `item-${orderId}-${idx}`,
        quantite: i.quantite,
        prixUnitaire: i.prixUnitaire as any,
        orderId,
        variantId: i.variantId,
        variante: {
          ...varInfo.variant,
          produit: {
            nom: varInfo.product.nom,
            images: varInfo.product.images,
            slug: varInfo.product.slug,
          },
        },
      };
    });

    const newOrder: MockOrder = {
      id: orderId,
      clientNom: orderData.clientNom,
      clientTelephone: orderData.clientTelephone,
      clientAdresse: orderData.clientAdresse,
      clientVille: orderData.clientVille,
      statut: 'EN_ATTENTE',
      modePaiement: orderData.modePaiement,
      statutPaiement: 'EN_ATTENTE',
      montantTotal: total as any,
      cinetpayTxId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items,
    };

    MOCK_ORDERS.unshift(newOrder); // Placer au début de la liste (nouveautés)
    return newOrder;
  },

  updateOrderPayment: (id: string, data: { statutPaiement: string; cinetpayTxId?: string }) => {
    const o = MOCK_ORDERS.find((order) => order.id === id);
    if (o) {
      o.statutPaiement = data.statutPaiement as any;
      if (data.cinetpayTxId) {
        o.cinetpayTxId = data.cinetpayTxId;
      }
      if (data.statutPaiement === 'REUSSIE') {
        o.statut = 'PAYEE';
      }
      o.updatedAt = new Date();
    }
  },

  updateOrderStatus: (id: string, statut: string) => {
    const o = MOCK_ORDERS.find((order) => order.id === id);
    if (o) {
      o.statut = statut as any;
      o.updatedAt = new Date();
    }
  },

  // --- Analytics ---
  saveAnalyticsEvent: (data: {
    type: string;
    path?: string;
    productId?: string;
    sessionId?: string;
    userAgent?: string;
  }): MockAnalyticsEvent => {
    const event: MockAnalyticsEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...data,
      createdAt: new Date(),
    };
    MOCK_ANALYTICS_EVENTS.push(event);
    return event;
  },

  getAnalyticsEvents: () => MOCK_ANALYTICS_EVENTS,
};
