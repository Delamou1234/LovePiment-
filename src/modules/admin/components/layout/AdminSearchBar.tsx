'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Search, ShoppingBag, User } from 'lucide-react';
import type { AdminSearchResults } from '@/modules/admin/types/admin-search';
import { libelleStatutCommande } from '@/modules/admin/lib/order-status-labels';

type FlatItem =
  | AdminSearchResults['commandes'][number]
  | AdminSearchResults['clients'][number]
  | AdminSearchResults['produits'][number];

type Props = {
  className?: string;
};

const EMPTY: AdminSearchResults = {
  commandes: [],
  clients: [],
  produits: [],
  query: '',
  tookMs: 0,
};

function formatGn(value: number) {
  return `${value.toLocaleString('fr-FR')} GN`;
}

function formatOrderRef(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function AdminSearchBar({ className = '' }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= 2;
  const displayResults = canSearch ? results : EMPTY;
  const flatItems = useMemo<FlatItem[]>(
    () => [...displayResults.commandes, ...displayResults.clients, ...displayResults.produits],
    [displayResults],
  );
  const hasResults = flatItems.length > 0;
  const showDropdown = isOpen && canSearch;

  const navigateTo = useCallback(
    (item: FlatItem) => {
      setIsOpen(false);
      if (item.type === 'commande') {
        router.push(`/admin/commandes?open=${item.id}`);
      } else if (item.type === 'client') {
        router.push(`/admin/clients?q=${encodeURIComponent(item.email || item.nom)}`);
      } else {
        router.push(`/admin/produits?edit=${item.id}`);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/recherche?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as AdminSearchResults;
        if (!controller.signal.aborted) {
          setResults(data);
          setActiveIndex(-1);
        }
      } catch {
        if (!controller.signal.aborted) setResults(EMPTY);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, canSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || flatItems.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < flatItems.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) navigateTo(flatItems[activeIndex]);
      else if (flatItems.length === 1) navigateTo(flatItems[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const sectionsWithOffset = useMemo(() => {
    const sections = [
      { title: 'Commandes', icon: ShoppingBag, items: displayResults.commandes },
      { title: 'Clients', icon: User, items: displayResults.clients },
      { title: 'Produits', icon: Package, items: displayResults.produits },
    ];
    let offset = 0;
    return sections
      .filter((section) => section.items.length > 0)
      .map((section) => {
        const startIndex = offset;
        offset += section.items.length;
        return { ...section, startIndex };
      });
  }, [displayResults]);

  const renderSection = (
    title: string,
    Icon: typeof ShoppingBag,
    items: FlatItem[],
    startIndex: number,
  ) => {
    return (
      <div key={title}>
        <p className="admin-search-section-title">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          {title}
        </p>
        <ul>
          {items.map((item, i) => {
            const index = startIndex + i;
            return (
              <li key={`${item.type}-${item.id}`} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => navigateTo(item)}
                  className={`admin-search-item ${index === activeIndex ? 'is-active' : ''}`}
                >
                  {item.type === 'produit' ? (
                    <>
                      <div className="admin-search-thumb">
                        {item.image ? (
                          <Image src={item.image} alt="" fill className="object-cover" sizes="36px" />
                        ) : (
                          <Package className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900">{item.nom}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {item.actif ? 'Produit actif' : 'Produit inactif'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-zinc-600">
                        {formatGn(item.prix)}
                      </span>
                    </>
                  ) : item.type === 'client' ? (
                    <>
                      <div className="admin-search-icon-wrap">
                        <User className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900">{item.nom}</p>
                        <p className="truncate text-xs text-zinc-500">{item.email}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="admin-search-icon-wrap">
                        <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900">
                          {formatOrderRef(item.id)} · {item.clientNom}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {libelleStatutCommande(item.statut)} · {item.clientVille}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-zinc-600">
                        {formatGn(item.montantTotal)}
                      </span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`admin-search ${className}`.trim()}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (activeIndex >= 0 && flatItems[activeIndex]) navigateTo(flatItems[activeIndex]);
          else if (flatItems[0]) navigateTo(flatItems[0]);
        }}
        className="admin-search-form"
      >
        <Search className="admin-search-leading" strokeWidth={1.75} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (trimmed.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher (commande, client, produit…)"
          className="admin-search-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="admin-search-results"
          aria-autocomplete="list"
        />
        <button type="submit" className="admin-search-submit" aria-label="Rechercher">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </form>

      {showDropdown && (
        <div id="admin-search-results" role="listbox" className="admin-search-dropdown">
          {loading && !hasResults ? (
            <div className="admin-search-empty">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche en cours…
            </div>
          ) : hasResults ? (
            <>
              <div className="admin-search-dropdown-inner">
                {sectionsWithOffset.map(({ title, icon: Icon, items, startIndex }) =>
                  renderSection(title, Icon, items, startIndex),
                )}
              </div>
              {results.tookMs > 0 && (
                <p className="admin-search-meta">{results.tookMs} ms</p>
              )}
            </>
          ) : (
            <p className="admin-search-empty">Aucun résultat pour « {trimmed} »</p>
          )}
        </div>
      )}
    </div>
  );
}
