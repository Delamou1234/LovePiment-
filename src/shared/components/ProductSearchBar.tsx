'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Search, Tag, X } from 'lucide-react';
import type { SuggestionRecherche } from '@/modules/produits/types';
import { useVoiceSearchInput } from '@/shared/hooks/useVoiceSearchInput';
import { VoiceSearchMicButton } from '@/shared/components/VoiceSearchMicButton';
import { cn } from '@/lib/utils';

interface ProductSearchBarProps {
  className?: string;
  inputClassName?: string;
  compact?: boolean;
  /** Masque la recherche par photo (le micro navigateur reste disponible) */
  hideImageSearch?: boolean;
  /** @deprecated Utiliser hideImageSearch */
  textOnly?: boolean;
  fullWidth?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
}

type ImageSearchResult = {
  id: string;
  nom: string;
  slug: string;
  prix: number;
  image: string | null;
  categorie: string;
  score: number;
};

export function ProductSearchBar({
  className,
  inputClassName,
  compact = false,
  hideImageSearch = false,
  textOnly = false,
  fullWidth = false,
  autoFocus = false,
  placeholder = 'Rechercher un produit...',
  onNavigate,
}: ProductSearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionRecherche[]>([]);
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [imageError, setImageError] = useState('');

  const trimmed = query.trim();
  const canSearchText = searchMode === 'text' && trimmed.length >= 2;
  const displaySuggestions = canSearchText ? suggestions : [];

  const navigateToSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      setIsOpen(false);
      onNavigate?.();
      if (trimmed) {
        router.push(`/produits?search=${encodeURIComponent(trimmed)}`);
      } else {
        router.push('/produits');
      }
    },
    [router, onNavigate],
  );

  const clearImageSearch = useCallback(() => {
    setImageResults([]);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSearchMode('text');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const noImageSearch = hideImageSearch || textOnly;

  const voice = useVoiceSearchInput({
    onTranscript: (transcript, isFinal) => {
      clearImageSearch();
      setQuery(transcript);
      setIsOpen(true);
      inputRef.current?.focus();
      if (isFinal && transcript.length >= 2) {
        navigateToSearch(transcript);
      }
    },
  });

  const inputPaddingRight = noImageSearch
    ? compact
      ? voice.isSupported
        ? 'pr-[4.75rem]'
        : 'pr-9'
      : voice.isSupported
        ? 'pr-[5.75rem]'
        : 'pr-10'
    : compact
      ? voice.isSupported
        ? 'pr-[4.75rem]'
        : 'pr-[3.5rem]'
      : voice.isSupported
        ? 'pr-[5.75rem]'
        : 'pr-[4.25rem]';

  const actionBtnClass = compact ? 'h-6 w-6' : 'h-7 w-7';
  const actionIconClass = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';

  const searchByImage = useCallback(async (file: File) => {
    setImageError('');
    clearImageSearch();

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setSearchMode('image');
    setImageLoading(true);
    setIsOpen(true);
    setQuery('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/recherche/image', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as {
        results?: ImageSearchResult[];
        message?: string;
        poweredByAi?: boolean;
      };

      if (!res.ok) {
        throw new Error(data.message ?? 'Erreur lors de la recherche par image');
      }

      setImageResults(data.results ?? []);
      setActiveIndex(-1);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Recherche par image impossible');
      setImageResults([]);
    } finally {
      setImageLoading(false);
    }
  }, [clearImageSearch]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void searchByImage(file);
  };

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  useEffect(() => {
    if (!canSearchText) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/recherche/suggestions?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          suggestions: SuggestionRecherche[];
        };
        setSuggestions(data.suggestions ?? []);
        setSearchMode('text');
        clearImageSearch();
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchMode, clearImageSearch, canSearchText, trimmed]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'image' && imageResults.length > 0) {
      router.push(`/produits/${imageResults[0].slug}`);
      onNavigate?.();
      return;
    }
    navigateToSearch(query);
  };

  const selectProduct = (slug: string) => {
    setIsOpen(false);
    onNavigate?.();
    router.push(`/produits/${slug}`);
  };

  const selectSuggestion = (item: SuggestionRecherche) => {
    setIsOpen(false);
    onNavigate?.();
    if (item.type === 'produit') {
      router.push(`/produits/${item.slug}`);
    } else {
      router.push(`/produits?categorie=${item.slug}`);
    }
  };

  const dropdownItems =
    searchMode === 'image'
      ? imageResults.map((r) => ({ type: 'produit' as const, ...r }))
      : displaySuggestions;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || dropdownItems.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < dropdownItems.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : dropdownItems.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const item = dropdownItems[activeIndex];
      if ('type' in item && item.type === 'produit') {
        selectProduct(item.slug);
      } else if ('type' in item) {
        selectSuggestion(item as SuggestionRecherche);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const toggleVoice = voice.toggleVoice;

  const showDropdown =
    isOpen &&
    (searchMode === 'image'
      ? imageLoading || imageResults.length > 0 || !!imageError
      : query.trim().length >= 2);

  const isBusy = loading || imageLoading;

  return (
    <div ref={containerRef} className={cn('relative', fullWidth ? 'w-full' : '', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        className="sr-only"
        onChange={handleImageFile}
        aria-hidden
      />

      <form onSubmit={handleSubmit} className="relative">
        {imagePreview && (
          <div className="absolute left-2 top-1/2 z-[1] flex -translate-y-1/2 items-center gap-1">
            <div className="relative h-7 w-7 overflow-hidden rounded-full border border-[#e8e0d4] ring-1 ring-white">
              <Image src={imagePreview} alt="Aperçu recherche" fill className="object-cover" sizes="28px" unoptimized />
            </div>
            <button
              type="button"
              onClick={clearImageSearch}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
              aria-label="Supprimer l'image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          placeholder={
            voice.isListening
              ? 'Parlez maintenant…'
              : searchMode === 'image'
                ? 'Résultats par image…'
                : placeholder
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchMode('text');
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchMode === 'image' || query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={searchMode === 'image' && imageLoading}
          className={cn(
            'rounded-full border border-[#e8e0d4] bg-[#FFF8F6] text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white',
            compact ? 'py-1.5 text-xs' : 'py-2 text-sm',
            fullWidth ? 'w-full py-2.5' : compact ? 'w-48 xl:w-64' : 'w-52 xl:w-72',
            imagePreview ? (compact ? 'pl-12' : 'pl-14') : compact ? 'pl-3' : 'pl-4',
            inputPaddingRight,
            voice.isListening && 'ring-2 ring-red-200 border-red-300',
            inputClassName,
          )}
        />

        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {!noImageSearch && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
              className={cn(
                'flex items-center justify-center rounded-full transition',
                actionBtnClass,
                searchMode === 'image'
                  ? 'bg-[#9B1B2E] text-white'
                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700',
              )}
              aria-label="Rechercher par image"
              title="Rechercher par photo"
            >
              {imageLoading ? (
                <Loader2 className={cn('animate-spin', actionIconClass)} />
              ) : (
                <Camera className={actionIconClass} />
              )}
            </button>
          )}
          {voice.isSupported && (
            <VoiceSearchMicButton
              isListening={voice.isListening}
              onToggle={toggleVoice}
              size={compact ? 'sm' : 'md'}
            />
          )}
          <button
            type="submit"
            className={cn(
              'flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 transition',
              actionBtnClass,
            )}
            aria-label="Rechercher"
          >
            {isBusy && searchMode === 'text' ? (
              <Loader2 className={cn('animate-spin', actionIconClass)} />
            ) : (
              <Search className={actionIconClass} />
            )}
          </button>
        </div>
      </form>

      {(voice.voiceError || imageError) && (
        <p className="mt-1 text-[11px] text-red-500" role="alert">
          {voice.voiceError || imageError}
        </p>
      )}

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#F2D4DC] bg-white shadow-lg animate-fadeIn"
        >
          {searchMode === 'image' && (
            <div className="border-b border-[#F2D4DC] bg-[#FFF8F6] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1B2E]">
                Recherche par image
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Produits visuellement similaires à votre photo
              </p>
            </div>
          )}

          {imageLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse de l&apos;image…
            </div>
          ) : dropdownItems.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-1">
              {searchMode === 'image'
                ? imageResults.map((item, index) => (
                    <li key={item.id} role="option" aria-selected={index === activeIndex}>
                      <button
                        type="button"
                        onClick={() => selectProduct(item.slug)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                          index === activeIndex ? 'bg-[#FFF8F6]' : 'hover:bg-[#FFF8F6]',
                        )}
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                          {item.image ? (
                            <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-zinc-300">
                              <Search className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">{item.nom}</p>
                          <p className="text-xs text-zinc-500">{item.categorie}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-zinc-700">
                          {item.prix.toLocaleString('fr-FR')} GN
                        </span>
                      </button>
                    </li>
                  ))
                : displaySuggestions.map((item, index) => (
                    <li
                      key={`${item.type}-${item.type === 'produit' ? item.id : item.slug}`}
                      role="option"
                      aria-selected={index === activeIndex}
                    >
                      {item.type === 'produit' ? (
                        <button
                          type="button"
                          onClick={() => selectSuggestion(item)}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                            index === activeIndex ? 'bg-[#FFF8F6]' : 'hover:bg-[#FFF8F6]',
                          )}
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                            {item.image ? (
                              <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-300">
                                <Search className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-900">{item.nom}</p>
                            <p className="text-xs text-zinc-500">{item.categorie}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-zinc-700">
                            {item.prix.toLocaleString('fr-FR')} GN
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectSuggestion(item)}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                            index === activeIndex ? 'bg-[#FFF8F6]' : 'hover:bg-[#FFF8F6]',
                          )}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FCEEE8] text-[#9B1B2E]">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{item.nom}</p>
                            <p className="text-xs text-zinc-500">Catégorie</p>
                          </div>
                        </button>
                      )}
                    </li>
                  ))}
            </ul>
          ) : searchMode === 'image' ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Aucun produit similaire trouvé. Essayez une autre photo.
            </p>
          ) : !loading ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Aucun résultat pour « {query.trim()} »
            </p>
          ) : null}

          {searchMode === 'text' && query.trim().length >= 2 && (
            <div className="border-t border-[#F2D4DC] bg-[#FFF8F6]/80 px-3 py-2">
              <button
                type="button"
                onClick={() => navigateToSearch(query)}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition"
              >
                <Search className="h-3.5 w-3.5" />
                Voir tous les résultats pour « {query.trim()} »
              </button>
            </div>
          )}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {voice.isListening ? 'Écoute en cours, parlez maintenant.' : ''}
        {imageLoading ? 'Analyse de l\'image en cours.' : ''}
      </span>
    </div>
  );
}
