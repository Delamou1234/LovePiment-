import { prisma } from '@/shared/lib/prisma';
import { mockDb } from '@/shared/lib/mock-db';
import type {
  ProduitAvecVariantes,
  ProduitAvecCategorie,
  CreerProduitDto,
  ModifierProduitDto,
  FiltresProduits,
  TriProduits,
} from '../types';
import type { Pagination } from '@/types';

// ─── ProductRepository — accès aux données (Prisma ou Mock) ───────────────────

export class ProductRepository {
  private isMock = process.env.MOCK_DATABASE === 'true';

  async trouverTous(
    filtres: FiltresProduits = {},
    tri: TriProduits = { champ: 'createdAt', ordre: 'desc' },
    pagination: { page: number; limit: number } = { page: 1, limit: 12 },
  ): Promise<{ produits: ProduitAvecCategorie[]; pagination: Pagination }> {
    if (this.isMock) {
      let products = [...mockDb.getProducts()];

      // Filtre actif
      const filtreActif = filtres.actif !== undefined ? filtres.actif : true;
      products = products.filter((p) => p.actif === filtreActif);

      // Filtre featured
      if (filtres.featured !== undefined) {
        products = products.filter((p) => p.featured === filtres.featured);
      }

      // Filtre categorie
      if (filtres.categorieSlug) {
        products = products.filter((p) => p.categorie.slug === filtres.categorieSlug);
      }

      // Filtre recherche (sans accent, insensible à la casse)
      if (filtres.search) {
        const cleanSearch = filtres.search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        products = products.filter((p) => {
          const cleanNom = p.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const cleanDesc = (p.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return cleanNom.includes(cleanSearch) || cleanDesc.includes(cleanSearch);
        });
      }

      // Filtre prix
      if (filtres.prix) {
        const { min, max } = filtres.prix;
        if (min !== undefined) {
          products = products.filter((p) => Number(p.prix) >= min);
        }
        if (max !== undefined) {
          products = products.filter((p) => Number(p.prix) <= max);
        }
      }

      // Filtre taille
      if (filtres.taille) {
        products = products.filter((p) => p.variantes.some((v) => v.taille === filtres.taille));
      }

      // Filtre couleur
      if (filtres.couleur) {
        products = products.filter((p) => p.variantes.some((v) => v.couleur === filtres.couleur));
      }

      // Tri
      products.sort((a, b) => {
        let valA = a[tri.champ];
        let valB = b[tri.champ];

        if (tri.champ === 'prix') {
          valA = Number(valA);
          valB = Number(valB);
        }

        if (valA < valB) return tri.ordre === 'asc' ? -1 : 1;
        if (valA > valB) return tri.ordre === 'asc' ? 1 : -1;
        return 0;
      });

      // Pagination
      const total = products.length;
      const skip = (pagination.page - 1) * pagination.limit;
      const paginated = products.slice(skip, skip + pagination.limit);

      return {
        produits: paginated,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }

    // Réel Prisma
    const where = this.construireWhere(filtres);
    const skip = (pagination.page - 1) * pagination.limit;

    const [produits, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { categorie: true },
        orderBy: { [tri.champ]: tri.ordre },
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
    if (this.isMock) {
      return mockDb.getProductBySlug(slug) || null;
    }

    return prisma.product.findUnique({
      where: { slug },
      include: {
        variantes: true,
        categorie: true,
      },
    });
  }

  async trouverParId(id: string): Promise<ProduitAvecVariantes | null> {
    if (this.isMock) {
      return mockDb.getProductById(id) || null;
    }

    return prisma.product.findUnique({
      where: { id },
      include: { variantes: true, categorie: true },
    });
  }

  async trouverSimilaires(productId: string, categorieId: string, limit = 4): Promise<ProduitAvecCategorie[]> {
    if (this.isMock) {
      return mockDb
        .getProducts()
        .filter((p) => p.categorieId === categorieId && p.actif && p.id !== productId)
        .slice(0, limit);
    }

    return prisma.product.findMany({
      where: {
        categorieId,
        actif: true,
        id: { not: productId },
      },
      include: { categorie: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async creer(dto: CreerProduitDto): Promise<ProduitAvecVariantes> {
    if (this.isMock) {
      const mockProd: ProduitAvecVariantes = {
        id: 'mock-prod-' + Math.random().toString(36).substr(2, 9),
        nom: dto.nom,
        slug: dto.slug,
        description: dto.description || null,
        prix: dto.prix as any,
        images: dto.images,
        actif: dto.actif ?? true,
        featured: dto.featured ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        categorieId: dto.categorieId,
        categorie: mockDb.getCategories().find((c) => c.id === dto.categorieId)!,
        variantes: (dto.variantes || []).map((v, idx) => ({
          id: `mock-var-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          taille: v.taille || null,
          couleur: v.couleur || null,
          stock: v.stock,
          sku: v.sku || null,
          prix: v.prix ? (v.prix as any) : null,
          productId: '',
        })),
      };
      mockDb.getProducts().push(mockProd as any);
      return mockProd;
    }

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
    if (this.isMock) {
      const prod = mockDb.getProductById(id);
      if (!prod) throw new Error('Produit introuvable');
      if (dto.nom) prod.nom = dto.nom;
      if (dto.description !== undefined) prod.description = dto.description;
      if (dto.prix) prod.prix = dto.prix as any;
      if (dto.images) prod.images = dto.images;
      if (dto.actif !== undefined) prod.actif = dto.actif;
      if (dto.featured !== undefined) prod.featured = dto.featured;
      prod.updatedAt = new Date();
      return prod as any;
    }

    const { variantes, ...produitData } = dto;
    return prisma.product.update({
      where: { id },
      data: produitData,
      include: { variantes: true, categorie: true },
    });
  }

  async supprimer(id: string): Promise<void> {
    if (this.isMock) {
      const products = mockDb.getProducts();
      const idx = products.findIndex((p) => p.id === id);
      if (idx !== -1) products.splice(idx, 1);
      return;
    }

    await prisma.product.delete({ where: { id } });
  }

  async toggleActif(id: string): Promise<{ actif: boolean }> {
    if (this.isMock) {
      const prod = mockDb.getProductById(id);
      if (!prod) throw new Error('Produit introuvable');
      prod.actif = !prod.actif;
      return { actif: prod.actif };
    }

    const produit = await prisma.product.findUniqueOrThrow({ where: { id } });
    const updated = await prisma.product.update({
      where: { id },
      data: { actif: !produit.actif },
    });
    return { actif: updated.actif };
  }

  private construireWhere(filtres: FiltresProduits) {
    return {
      ...(filtres.actif !== undefined ? { actif: filtres.actif } : { actif: true }),
      ...(filtres.featured !== undefined && { featured: filtres.featured }),
      ...(filtres.categorieSlug && { categorie: { slug: filtres.categorieSlug } }),
      ...(filtres.search && {
        OR: [
          { nom: { contains: filtres.search, mode: 'insensitive' as const } },
          { description: { contains: filtres.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filtres.prix && {
        prix: {
          ...(filtres.prix.min !== undefined && { gte: filtres.prix.min }),
          ...(filtres.prix.max !== undefined && { lte: filtres.prix.max }),
        },
      }),
      ...(filtres.taille && { variantes: { some: { taille: filtres.taille } } }),
      ...(filtres.couleur && { variantes: { some: { couleur: filtres.couleur } } }),
    };
  }
}

export const productRepository = new ProductRepository();
