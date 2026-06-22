import { prisma } from '@/shared/lib/prisma';
import type {
  ProduitAvecVariantes,
  ProduitAvecCategorie,
  CreerProduitDto,
  ModifierProduitDto,
  FiltresProduits,
  TriProduits,
  SuggestionRecherche,
  CategorieArbre,
  StockVarianteClient,
} from '../types';
import type { Pagination } from '@/types';
import { normaliserRecherche } from '@/shared/lib/search';
import { wherePromoActive } from '../lib/promo';

export class ProductRepository {
  async trouverTous(
    filtres: FiltresProduits = {},
    tri: TriProduits = { champ: 'createdAt', ordre: 'desc' },
    pagination: { page: number; limit: number } = { page: 1, limit: 12 },
  ): Promise<{ produits: ProduitAvecCategorie[]; pagination: Pagination }> {
    const where = this.construireWhere(filtres);
    const skip = (pagination.page - 1) * pagination.limit;
    const orderBy =
      tri.champ === 'featured'
        ? [{ featured: 'desc' as const }, { createdAt: 'desc' as const }]
        : { [tri.champ]: tri.ordre };

    const [produits, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categorie: true,
          variantes: {
            where: { stock: { gt: 0 } },
            take: 1,
            orderBy: { stock: 'desc' },
          },
        },
        orderBy,
        skip,
        take: pagination.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      produits,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async trouverParSlug(slug: string): Promise<ProduitAvecVariantes | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        variantes: true,
        categorie: true,
      },
    });
  }

  async trouverParId(id: string): Promise<ProduitAvecVariantes | null> {
    return prisma.product.findUnique({
      where: { id },
      include: { variantes: true, categorie: true },
    });
  }

  async trouverParIds(ids: string[]): Promise<ProduitAvecCategorie[]> {
    if (ids.length === 0) return [];
    return prisma.product.findMany({
      where: { id: { in: ids }, actif: true },
      include: {
        categorie: true,
        variantes: {
          where: { stock: { gt: 0 } },
          take: 1,
          orderBy: { stock: 'desc' },
        },
      },
    });
  }

  async trouverPromotionsActives(filtres: { categorieSlug?: string } = {}): Promise<ProduitAvecCategorie[]> {
    const now = new Date();
    const produits = await prisma.product.findMany({
      where: {
        actif: true,
        ...wherePromoActive(now),
        ...(filtres.categorieSlug && { categorie: { slug: filtres.categorieSlug } }),
      },
      include: {
        categorie: true,
        variantes: {
          where: { stock: { gt: 0 } },
          take: 1,
          orderBy: { stock: 'desc' },
        },
      },
    });

    return produits;
  }

  async compterPromotionsActives(): Promise<number> {
    return prisma.product.count({
      where: { actif: true, ...wherePromoActive() },
    });
  }

  async trouverSimilaires(productId: string, categorieId: string, limit = 4): Promise<ProduitAvecCategorie[]> {
    return prisma.product.findMany({
      where: {
        categorieId,
        actif: true,
        id: { not: productId },
      },
      include: {
        categorie: true,
        variantes: {
          where: { stock: { gt: 0 } },
          take: 1,
          orderBy: { stock: 'desc' },
        },
      },
      take: limit,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async creer(dto: CreerProduitDto): Promise<ProduitAvecVariantes> {
    const { variantes, ...produitData } = dto;
    return prisma.product.create({
      data: {
        ...produitData,
        variantes: variantes ? { create: variantes } : undefined,
      },
      include: { variantes: true, categorie: true },
    });
  }

  async modifier(id: string, dto: ModifierProduitDto): Promise<ProduitAvecVariantes> {
    const { variantes, ...produitData } = dto;
    return prisma.product.update({
      where: { id },
      data: produitData,
      include: { variantes: true, categorie: true },
    });
  }

  async supprimer(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }

  async toggleActif(id: string): Promise<{ actif: boolean }> {
    const produit = await prisma.product.findUniqueOrThrow({ where: { id } });
    const updated = await prisma.product.update({
      where: { id },
      data: { actif: !produit.actif },
    });
    return { actif: updated.actif };
  }

  async suggererRecherche(
    query: string,
    limitProduits = 6,
    limitCategories = 3,
  ): Promise<SuggestionRecherche[]> {
    const cleanQuery = normaliserRecherche(query);
    if (cleanQuery.length < 2) return [];

    const [produits, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          actif: true,
          OR: [
            { nom: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { marque: { contains: query, mode: 'insensitive' } },
            { categorie: { nom: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: { categorie: true },
        take: limitProduits,
        orderBy: { nom: 'asc' },
      }),
      prisma.category.findMany({
        where: {
          actif: true,
          nom: { contains: query, mode: 'insensitive' },
        },
        take: limitCategories,
        orderBy: { nom: 'asc' },
      }),
    ]);

    return [
      ...produits.map(
        (p): SuggestionRecherche => ({
          type: 'produit',
          id: p.id,
          nom: p.nom,
          slug: p.slug,
          prix: Number(p.prix),
          image: p.images[0] ?? null,
          categorie: p.categorie.nom,
        }),
      ),
      ...categories.map(
        (c): SuggestionRecherche => ({
          type: 'categorie',
          nom: c.nom,
          slug: c.slug,
        }),
      ),
    ];
  }

  async listerCategories() {
    return prisma.category.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    });
  }

  async listerCategoriesAdmin() {
    return prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { nom: 'asc' }],
      include: {
        parent: { select: { id: true, nom: true, slug: true } },
        _count: { select: { produits: true, children: true } },
      },
    });
  }

  async trouverCategorieParId(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  async listerCategoriesVitrine() {
    const roots = await prisma.category.findMany({
      where: { actif: true, parentId: null },
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { produits: true, children: true } },
        children: {
          where: { actif: true },
          include: { _count: { select: { produits: true } } },
        },
      },
    });

    return roots.map((root) => {
      const produitsCount =
        root._count.produits +
        root.children.reduce((sum, child) => sum + child._count.produits, 0);

      return {
        id: root.id,
        nom: root.nom,
        slug: root.slug,
        image: root.image,
        produitsCount,
        childrenCount: root._count.children,
      };
    });
  }

  async creerCategorie(data: {
    nom: string;
    slug: string;
    image?: string | null;
    parentId?: string | null;
    actif?: boolean;
  }) {
    return prisma.category.create({
      data: {
        nom: data.nom.trim(),
        slug: data.slug.trim().toLowerCase(),
        image: data.image?.trim() || null,
        parentId: data.parentId || null,
        actif: data.actif ?? true,
      },
      include: {
        parent: { select: { id: true, nom: true, slug: true } },
        _count: { select: { produits: true, children: true } },
      },
    });
  }

  async mettreAJourCategorie(
    id: string,
    data: {
      nom?: string;
      slug?: string;
      image?: string | null;
      parentId?: string | null;
      actif?: boolean;
    },
  ) {
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.nom !== undefined && { nom: data.nom.trim() }),
        ...(data.slug !== undefined && { slug: data.slug.trim().toLowerCase() }),
        ...(data.image !== undefined && { image: data.image?.trim() || null }),
        ...(data.parentId !== undefined && { parentId: data.parentId || null }),
        ...(data.actif !== undefined && { actif: data.actif }),
      },
      include: {
        parent: { select: { id: true, nom: true, slug: true } },
        _count: { select: { produits: true, children: true } },
      },
    });
  }

  async supprimerCategorie(id: string, reassignToId?: string) {
    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { produits: true, children: true } } },
    });
    if (!cat) throw new Error('Catégorie introuvable');
    if (cat._count.children > 0) {
      throw new Error('Supprimez d’abord les sous-catégories');
    }
    if (cat._count.produits > 0) {
      if (!reassignToId) {
        throw new Error('Choisissez une catégorie pour déplacer les produits');
      }
      if (reassignToId === id) {
        throw new Error('La catégorie de destination doit être différente');
      }
      const destination = await prisma.category.findUnique({ where: { id: reassignToId } });
      if (!destination) throw new Error('Catégorie de destination introuvable');
      await prisma.product.updateMany({
        where: { categorieId: id },
        data: { categorieId: reassignToId },
      });
    }
    await prisma.category.delete({ where: { id } });
  }

  async listerCategoriesArbre(): Promise<CategorieArbre[]> {
    const all = await prisma.category.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    });
    const roots = all.filter((c) => !c.parentId);
    return roots.map((root) => ({
      ...root,
      children: all.filter((c) => c.parentId === root.id),
    }));
  }

  async obtenirFacettes(filtres: FiltresProduits = {}): Promise<FacettesCatalogue> {
    const where = this.construireWhere({
      ...filtres,
      taille: undefined,
      couleur: undefined,
      marque: undefined,
      enStock: undefined,
      prix: undefined,
    });

    const [variantes, marquesRows, prixAgg] = await Promise.all([
      prisma.productVariant.findMany({
        where: { produit: where },
        select: { taille: true, couleur: true },
      }),
      prisma.product.findMany({
        where: { ...where, marque: { not: null } },
        select: { marque: true },
        distinct: ['marque'],
        orderBy: { marque: 'asc' },
      }),
      prisma.product.aggregate({
        where,
        _min: { prix: true },
        _max: { prix: true },
      }),
    ]);

    const tailles = [...new Set(variantes.map((v) => v.taille).filter(Boolean))].sort();
    const couleurs = [...new Set(variantes.map((v) => v.couleur).filter(Boolean))].sort();
    const marques = marquesRows
      .map((m) => m.marque)
      .filter((m): m is string => Boolean(m));

    return {
      tailles,
      couleurs,
      marques,
      prixMin: prixAgg._min.prix ? Number(prixAgg._min.prix) : 0,
      prixMax: prixAgg._max.prix ? Number(prixAgg._max.prix) : 0,
    };
  }

  async obtenirStockParSlug(slug: string): Promise<StockVarianteClient[]> {
    const produit = await prisma.product.findUnique({
      where: { slug, actif: true },
      select: {
        variantes: {
          select: {
            id: true,
            taille: true,
            couleur: true,
            capacite: true,
            stock: true,
            sku: true,
            codeBarre: true,
            prix: true,
          },
          orderBy: [{ stock: 'desc' }, { sku: 'asc' }],
        },
      },
    });
    if (!produit) return [];
    return produit.variantes.map((v) => ({
      ...v,
      prix: v.prix != null ? Number(v.prix) : null,
    }));
  }

  async synchroniserVariantes(
    productId: string,
    variantes: NonNullable<CreerProduitDto['variantes']>,
  ): Promise<ProduitAvecVariantes> {
    const existing = await prisma.productVariant.findMany({ where: { productId } });
    const incomingIds = new Set(variantes.filter((v) => v.id).map((v) => v.id!));

    for (const ex of existing) {
      if (!incomingIds.has(ex.id)) {
        const orderCount = await prisma.orderItem.count({ where: { variantId: ex.id } });
        if (orderCount === 0) {
          await prisma.productVariant.delete({ where: { id: ex.id } });
        }
      }
    }

    for (const v of variantes) {
      const data = {
        taille: v.taille ?? null,
        couleur: v.couleur ?? null,
        capacite: v.capacite ?? null,
        stock: Math.max(0, v.stock),
        sku: v.sku ?? null,
        codeBarre: v.codeBarre ?? null,
        prix: v.prix ?? null,
      };

      if (v.id) {
        await prisma.productVariant.update({ where: { id: v.id }, data });
      } else {
        await prisma.productVariant.create({ data: { ...data, productId } });
      }
    }

    const updated = await this.trouverParId(productId);
    if (!updated) throw new Error('Produit introuvable');
    return updated;
  }

  async mettreAJourVariante(
    variantId: string,
    data: {
      taille?: string | null;
      couleur?: string | null;
      capacite?: string | null;
      stock?: number;
      sku?: string | null;
      codeBarre?: string | null;
      prix?: number | null;
    },
  ) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(data.taille !== undefined && { taille: data.taille }),
        ...(data.couleur !== undefined && { couleur: data.couleur }),
        ...(data.capacite !== undefined && { capacite: data.capacite }),
        ...(data.stock !== undefined && { stock: Math.max(0, data.stock) }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.codeBarre !== undefined && { codeBarre: data.codeBarre }),
        ...(data.prix !== undefined && { prix: data.prix }),
      },
    });
  }

  async listerPourAdmin() {
    return prisma.product.findMany({
      include: { categorie: true, variantes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listerStocks() {
    return prisma.productVariant.findMany({
      include: {
        produit: { select: { id: true, nom: true, slug: true, actif: true } },
      },
      orderBy: [{ stock: 'asc' }, { produit: { nom: 'asc' } }],
    });
  }

  async mettreAJourStock(variantId: string, stock: number) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.max(0, stock) },
    });
  }

  async mettreAJourPromo(
    id: string,
    data: {
      prixPromo?: number | null;
      promoDebut?: Date | null;
      promoFin?: Date | null;
      featured?: boolean;
    },
  ) {
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.prixPromo !== undefined && { prixPromo: data.prixPromo }),
        ...(data.promoDebut !== undefined && { promoDebut: data.promoDebut }),
        ...(data.promoFin !== undefined && { promoFin: data.promoFin }),
        ...(data.featured !== undefined && { featured: data.featured }),
      },
      include: { categorie: true, variantes: true },
    });
  }

  private construireWhere(filtres: FiltresProduits) {
    const variantFiltres =
      filtres.taille || filtres.couleur || filtres.enStock
        ? {
            variantes: {
              some: {
                ...(filtres.taille && { taille: filtres.taille }),
                ...(filtres.couleur && { couleur: filtres.couleur }),
                ...(filtres.enStock && { stock: { gt: 0 } }),
              },
            },
          }
        : {};

    return {
      ...(filtres.actif !== undefined ? { actif: filtres.actif } : { actif: true }),
      ...(filtres.enPromo && wherePromoActive()),
      ...(filtres.featured !== undefined && !filtres.enPromo && { featured: filtres.featured }),
      ...(filtres.categorieSlug && {
        categorie: {
          OR: [
            { slug: filtres.categorieSlug },
            { parent: { slug: filtres.categorieSlug } },
          ],
        },
      }),
      ...(filtres.marque && { marque: filtres.marque }),
      ...(filtres.search && {
        OR: [
          { nom: { contains: filtres.search, mode: 'insensitive' as const } },
          { description: { contains: filtres.search, mode: 'insensitive' as const } },
          { marque: { contains: filtres.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filtres.prix && {
        prix: {
          ...(filtres.prix.min !== undefined && { gte: filtres.prix.min }),
          ...(filtres.prix.max !== undefined && { lte: filtres.prix.max }),
        },
      }),
      ...variantFiltres,
    };
  }
}

export const productRepository = new ProductRepository();
