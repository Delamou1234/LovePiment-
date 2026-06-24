'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  Check,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { AvisAdmin } from '@/modules/avis/types';

type FiltreStatut = '' | 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE';

const FILTRES: { id: FiltreStatut; label: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'EN_ATTENTE', label: 'En attente' },
  { id: 'APPROUVE', label: 'Approuvés' },
  { id: 'REFUSE', label: 'Refusés' },
];

function Stars({ note }: { note: number }) {
  return (
    <div className="admin-avis-stars" aria-label={`${note} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < note ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`}
        />
      ))}
    </div>
  );
}

function StatutBadge({ statut }: { statut: AvisAdmin['statut'] }) {
  const map = {
    APPROUVE: { label: 'Approuvé', className: 'is-approved' },
    REFUSE: { label: 'Refusé', className: 'is-refused' },
    EN_ATTENTE: { label: 'En attente', className: 'is-pending' },
  } as const;
  const { label, className } = map[statut];
  return <span className={`admin-avis-statut ${className}`}>{label}</span>;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function AdminAvisPage() {
  const [avis, setAvis] = useState<AvisAdmin[]>([]);
  const [filtre, setFiltre] = useState<FiltreStatut>('');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [detailAvis, setDetailAvis] = useState<AvisAdmin | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/avis');
      if (res.ok) {
        const data = await res.json();
        setAvis(data.avis ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  const stats = useMemo(
    () => ({
      total: avis.length,
      enAttente: avis.filter((a) => a.statut === 'EN_ATTENTE').length,
      approuves: avis.filter((a) => a.statut === 'APPROUVE').length,
      refuses: avis.filter((a) => a.statut === 'REFUSE').length,
    }),
    [avis],
  );

  const avisFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return avis.filter((a) => {
      if (filtre && a.statut !== filtre) return false;
      if (!q) return true;
      return (
        a.productNom.toLowerCase().includes(q) ||
        a.clientNom.toLowerCase().includes(q) ||
        a.clientVille.toLowerCase().includes(q) ||
        a.commentaire.toLowerCase().includes(q)
      );
    });
  }, [avis, filtre, recherche]);

  const moderer = async (id: string, statut: AvisAdmin['statut']) => {
    setActionId(id);
    try {
      await fetch('/api/admin/avis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut }),
      });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer définitivement cet avis ?')) return;
    setActionId(id);
    try {
      await fetch('/api/admin/avis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await load();
      if (detailAvis?.id === id) setDetailAvis(null);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="admin-avis-page">
      <header className="admin-avis-header">
        <div>
          <h1 className="admin-avis-title">
            <MessageSquare className="h-6 w-6 text-[#e91e8c]" strokeWidth={1.75} />
            Avis &amp; notations
          </h1>
          <p className="admin-avis-subtitle">
            Modération des avis produits — achats vérifiés automatiquement.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="admin-avis-refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </header>

      <div className="admin-avis-stats">
        <div className="admin-avis-stat">
          <span className="admin-avis-stat-value">{stats.total}</span>
          <span className="admin-avis-stat-label">Total</span>
        </div>
        <div className="admin-avis-stat is-pending">
          <span className="admin-avis-stat-value">{stats.enAttente}</span>
          <span className="admin-avis-stat-label">En attente</span>
        </div>
        <div className="admin-avis-stat is-approved">
          <span className="admin-avis-stat-value">{stats.approuves}</span>
          <span className="admin-avis-stat-label">Approuvés</span>
        </div>
        <div className="admin-avis-stat is-refused">
          <span className="admin-avis-stat-value">{stats.refuses}</span>
          <span className="admin-avis-stat-label">Refusés</span>
        </div>
      </div>

      <div className="admin-avis-toolbar">
        <div className="admin-avis-search-wrap">
          <Search className="admin-avis-search-icon" strokeWidth={1.75} />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher produit, client, commentaire…"
            className="admin-avis-search"
          />
        </div>
        <div className="admin-avis-filters">
          {FILTRES.map(({ id, label }) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setFiltre(id)}
              className={`admin-avis-filter ${filtre === id ? 'is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-avis-table-card">
        {loading ? (
          <div className="admin-avis-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : avisFiltres.length === 0 ? (
          <p className="admin-avis-empty-text">Aucun avis ne correspond à votre recherche.</p>
        ) : (
          <div className="admin-avis-table-wrap">
            <table className="admin-avis-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Commentaire</th>
                  <th>Photos</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {avisFiltres.map((a) => {
                  const busy = actionId === a.id;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="admin-avis-product">
                          <Link
                            href={`/produits/${a.productSlug}`}
                            className="admin-avis-product-name"
                            target="_blank"
                          >
                            {a.productNom}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-zinc-900">{a.clientNom}</p>
                        <p className="text-xs text-zinc-500">{a.clientVille}</p>
                        {a.achatVerifie && (
                          <span className="admin-avis-verified">
                            <BadgeCheck className="h-3 w-3" />
                            Vérifié
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-zinc-500">{formatDate(a.createdAt)}</td>
                      <td>
                        <Stars note={a.note} />
                        <span className="mt-0.5 block text-xs font-semibold text-zinc-600">
                          {a.note}/5
                        </span>
                      </td>
                      <td>
                        <p className="admin-avis-comment line-clamp-2">{a.commentaire}</p>
                      </td>
                      <td>
                        {a.photos.length > 0 ? (
                          <div className="admin-avis-photos">
                            {a.photos.slice(0, 2).map((url) => (
                              <button
                                key={url}
                                type="button"
                                onClick={() => setPhotoPreview(url)}
                                className="admin-avis-photo"
                                title="Agrandir la photo"
                              >
                                <Image src={url} alt="" fill className="object-cover" unoptimized />
                              </button>
                            ))}
                            {a.photos.length > 2 && (
                              <span className="admin-avis-photo-more">+{a.photos.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </td>
                      <td>
                        <StatutBadge statut={a.statut} />
                      </td>
                      <td>
                        <div className="admin-avis-actions">
                          <button
                            type="button"
                            title="Voir le détail"
                            onClick={() => setDetailAvis(a)}
                            className="admin-avis-action"
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          {a.statut !== 'APPROUVE' && (
                            <button
                              type="button"
                              title="Approuver"
                              disabled={busy}
                              onClick={() => moderer(a.id, 'APPROUVE')}
                              className="admin-avis-action is-approve"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" strokeWidth={2} />
                              )}
                            </button>
                          )}
                          {a.statut !== 'REFUSE' && (
                            <button
                              type="button"
                              title="Refuser"
                              disabled={busy}
                              onClick={() => moderer(a.id, 'REFUSE')}
                              className="admin-avis-action is-refuse"
                            >
                              <XCircle className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                          )}
                          {a.statut !== 'EN_ATTENTE' && (
                            <button
                              type="button"
                              title="Remettre en attente"
                              disabled={busy}
                              onClick={() => moderer(a.id, 'EN_ATTENTE')}
                              className="admin-avis-action"
                            >
                              <Clock className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                          )}
                          <Link
                            href={`/admin/produits?edit=${a.productId}`}
                            title="Modifier le produit"
                            className="admin-avis-action"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </Link>
                          <Link
                            href={`/produits/${a.productSlug}`}
                            target="_blank"
                            title="Voir sur la boutique"
                            className="admin-avis-action"
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                          </Link>
                          <button
                            type="button"
                            title="Supprimer"
                            disabled={busy}
                            onClick={() => supprimer(a.id)}
                            className="admin-avis-action is-delete"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && avisFiltres.length > 0 && (
          <p className="admin-avis-footer">
            {avisFiltres.length} avis affiché{avisFiltres.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {photoPreview && (
        <div
          className="admin-avis-lightbox"
          onClick={() => setPhotoPreview(null)}
          role="dialog"
          aria-modal
          aria-label="Aperçu photo"
        >
          <button
            type="button"
            className="admin-avis-lightbox-close"
            onClick={() => setPhotoPreview(null)}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="admin-avis-lightbox-img" onClick={(e) => e.stopPropagation()}>
            <Image src={photoPreview} alt="Photo avis" fill className="object-contain" unoptimized />
          </div>
        </div>
      )}

      {detailAvis && (
        <div
          className="admin-avis-modal-backdrop"
          onClick={() => setDetailAvis(null)}
          role="dialog"
          aria-modal
        >
          <div className="admin-avis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-avis-modal-head">
              <div>
                <h2 className="text-base font-bold text-zinc-900">{detailAvis.productNom}</h2>
                <p className="text-sm text-zinc-500">
                  {detailAvis.clientNom} · {detailAvis.clientVille} · {formatDate(detailAvis.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailAvis(null)}
                className="admin-avis-modal-close"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-avis-modal-body">
              <div className="flex items-center gap-3">
                <Stars note={detailAvis.note} />
                <StatutBadge statut={detailAvis.statut} />
                {detailAvis.achatVerifie && (
                  <span className="admin-avis-verified">
                    <BadgeCheck className="h-3 w-3" />
                    Achat vérifié
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-700">{detailAvis.commentaire}</p>
              {detailAvis.photos.length > 0 && (
                <div className="admin-avis-modal-photos">
                  {detailAvis.photos.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoPreview(url)}
                      className="admin-avis-modal-photo"
                    >
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-avis-modal-actions">
              {detailAvis.statut !== 'APPROUVE' && (
                <button
                  type="button"
                  onClick={() => {
                    void moderer(detailAvis.id, 'APPROUVE');
                    setDetailAvis(null);
                  }}
                  className="admin-avis-modal-btn is-approve"
                >
                  <Check className="h-4 w-4" />
                  Approuver
                </button>
              )}
              {detailAvis.statut !== 'REFUSE' && (
                <button
                  type="button"
                  onClick={() => {
                    void moderer(detailAvis.id, 'REFUSE');
                    setDetailAvis(null);
                  }}
                  className="admin-avis-modal-btn is-refuse"
                >
                  <XCircle className="h-4 w-4" />
                  Refuser
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  void supprimer(detailAvis.id);
                }}
                className="admin-avis-modal-btn is-delete"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
