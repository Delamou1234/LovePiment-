import Link from 'next/link';
import { buildCatalogUrl, type CatalogSearchParams } from '@/modules/produits/lib/catalog-url';

type Props = {
  params: CatalogSearchParams;
  page: number;
  totalPages: number;
  total: number;
};

export function CatalogPagination({ params, page, totalPages, total }: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav
      className="shop-dash-pagination"
      aria-label="Pagination du catalogue"
    >
      <p className="shop-dash-pagination-meta text-xs text-zinc-500">
        Page {page} sur {totalPages} — {total} produit{total !== 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 ? (
          <Link
            href={buildCatalogUrl(params, { page: String(page - 1) })}
            className="shop-dash-pagination-btn"
            rel="prev"
          >
            ← Précédent
          </Link>
        ) : (
          <span className="shop-dash-pagination-btn is-disabled" aria-hidden>
            ← Précédent
          </span>
        )}

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-zinc-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildCatalogUrl(params, { page: p === 1 ? null : String(p) })}
              className={`shop-dash-pagination-num ${p === page ? 'is-active' : ''}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={buildCatalogUrl(params, { page: String(page + 1) })}
            className="shop-dash-pagination-btn"
            rel="next"
          >
            Suivant →
          </Link>
        ) : (
          <span className="shop-dash-pagination-btn is-disabled" aria-hidden>
            Suivant →
          </span>
        )}
      </div>
    </nav>
  );
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p += 1) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}
