'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Tag, X } from 'lucide-react';
import type { SuggestionRecherche } from '@/modules/produits/types';
import { buildCatalogUrl, type CatalogSearchParams } from '@/modules/produits/lib/catalog-url';
import { useSyncedState } from '@/shared/hooks/useSyncedState';
import { useVoiceSearchInput } from '@/shared/hooks/useVoiceSearchInput';
import { VoiceSearchMicButton } from '@/shared/components/VoiceSearchMicButton';
import { cn } from '@/lib/utils';

type Props = {
  currentParams: CatalogSearchParams;
  defaultQuery?: string;
  className?: string;
};

export function CatalogSearchBar({ currentParams, defaultQuery = '', className }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useSyncedState(defaultQuery);
  const [suggestions, setSuggestions] = useState<SuggestionRecherche[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= 2;
  const displaySuggestions = canSearch ? suggestions : [];
  const dropdownOpen = canSearch && isOpen && displaySuggestions.length > 0;

  useEffect(() => {
    if (!canSearch) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recherche/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = (await res.json()) as SuggestionRecherche[];
          setSuggestions(data);
          setIsOpen(data.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
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

  const navigateSearch = useCallback(
    (q: string) => {
      const next = q.trim();
      setIsOpen(false);
      router.push(
        buildCatalogUrl(currentParams, { search: next || null }),
      );
    },
    [router, currentParams],
  );

  const voice = useVoiceSearchInput({
    onTranscript: (text, isFinal) => {
      setQuery(text);
      setActiveIndex(-1);
      setIsOpen(true);
      if (isFinal && text.trim().length >= 2) {
        navigateSearch(text);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownOpen || displaySuggestions.length === 0) {
      if (e.key === 'Enter') navigateSearch(query);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % displaySuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? displaySuggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const s = displaySuggestions[activeIndex];
      if (s.type === 'produit' && s.slug) {
        router.push(`/produits/${s.slug}`);
      } else if (s.type === 'categorie') {
        router.push(buildCatalogUrl(currentParams, { categorie: s.slug, search: null }));
      } else {
        navigateSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full min-w-0 sm:max-w-md lg:max-w-lg flex-grow', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => displaySuggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={voice.voicePlaceholder ?? 'Rechercher un sextoy, lingerie, lubrifiant...'}
          className={cn(
            'catalog-search',
            voice.isSupported && 'has-voice-search',
            voice.isListening && 'is-voice-listening',
          )}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              router.push(buildCatalogUrl(currentParams, { search: null }));
            }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition',
              voice.isSupported ? 'right-14' : 'right-9',
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {voice.isSupported && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2">
            <VoiceSearchMicButton
              isListening={voice.isListening}
              onToggle={voice.toggleVoice}
              size="sm"
            />
          </div>
        )}
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-olive transition"
        >
          {loading && canSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {voice.voiceError && (
        <p className="mt-1 text-[11px] text-red-500" role="alert">
          {voice.voiceError}
        </p>
      )}

      {dropdownOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-beige-border bg-white shadow-lg shadow-black/5">
          <ul className="max-h-72 overflow-y-auto py-1">
            {displaySuggestions.map((s, i) => (
              <li key={`${s.type}-${s.slug ?? s.nom}-${i}`}>
                {s.type === 'produit' && s.slug ? (
                  <Link
                    href={`/produits/${s.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50',
                      activeIndex === i && 'bg-olive-light',
                    )}
                  >
                    {s.image ? (
                      <Image src={s.image} alt="" width={36} height={36} className="rounded-md object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100">
                        <Search className="h-4 w-4 text-zinc-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-900">{s.nom}</p>
                      <p className="truncate text-xs text-zinc-500">{s.categorie}</p>
                    </div>
                    {s.prix != null && (
                      <span className="text-xs font-bold text-olive">
                        {s.prix.toLocaleString('fr-GN')} GNF
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href={buildCatalogUrl(currentParams, { categorie: s.slug, search: null })}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50',
                      activeIndex === i && 'bg-olive-light',
                    )}
                  >
                    <Tag className="h-4 w-4 text-olive" />
                    <span className="font-medium text-zinc-800">{s.nom}</span>
                    <span className="text-xs text-zinc-400">Catégorie</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
