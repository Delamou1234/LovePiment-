'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Coupon } from '../marketing/marketing-types';

const emptyCoupon = (): Omit<Coupon, 'id' | 'utilisations'> => ({
  code: '',
  type: 'POURCENT',
  valeur: 10,
  minCommande: null,
  maxUtilisations: null,
  actif: true,
  debut: null,
  fin: null,
});

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatValeur(c: Coupon) {
  return c.type === 'POURCENT'
    ? `${c.valeur}%`
    : `${c.valeur.toLocaleString('fr-FR')} GN`;
}

type Props = {
  refreshToken?: number;
};

export function AdminPromoCouponsSection({ refreshToken = 0 }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState<'' | 'actif' | 'inactif'>('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyCoupon());
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load, refreshToken]);

  const couponStats = useMemo(
    () => ({
      total: coupons.length,
      actifs: coupons.filter((c) => c.actif).length,
      inactifs: coupons.filter((c) => !c.actif).length,
      utilisations: coupons.reduce((s, c) => s + c.utilisations, 0),
    }),
    [coupons],
  );

  const couponsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return coupons.filter((c) => {
      if (filtreActif === 'actif' && !c.actif) return false;
      if (filtreActif === 'inactif' && c.actif) return false;
      if (!q) return true;
      return c.code.toLowerCase().includes(q);
    });
  }, [coupons, recherche, filtreActif]);

  const creerCoupon = async () => {
    setActionId('create-coupon');
    try {
      await fetch('/api/admin/marketing/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      setDraft(emptyCoupon());
      await load();
    } finally {
      setActionId(null);
    }
  };

  const sauverCoupon = async (data: Coupon) => {
    setActionId(data.id);
    try {
      await fetch('/api/admin/marketing/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          code: data.code,
          type: data.type,
          valeur: data.valeur,
          minCommande: data.minCommande,
          maxUtilisations: data.maxUtilisations,
          actif: data.actif,
          debut: data.debut,
          fin: data.fin,
        }),
      });
      setEditCoupon(null);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const toggleCoupon = async (c: Coupon) => {
    setActionId(c.id);
    try {
      await fetch('/api/admin/marketing/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, actif: !c.actif }),
      });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const supprimerCoupon = async (id: string) => {
    if (!confirm('Supprimer ce coupon ?')) return;
    setActionId(id);
    try {
      await fetch(`/api/admin/marketing/coupons?id=${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const copierCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const inputClass = 'admin-marketing-input';

  return (
    <>
      <div className="admin-marketing-stats">
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{couponStats.total}</span>
          <span className="admin-marketing-stat-label">Codes promo</span>
        </div>
        <div className="admin-marketing-stat is-approved">
          <span className="admin-marketing-stat-value">{couponStats.actifs}</span>
          <span className="admin-marketing-stat-label">Actifs</span>
        </div>
        <div className="admin-marketing-stat is-refused">
          <span className="admin-marketing-stat-value">{couponStats.inactifs}</span>
          <span className="admin-marketing-stat-label">Inactifs</span>
        </div>
        <div className="admin-marketing-stat">
          <span className="admin-marketing-stat-value">{couponStats.utilisations}</span>
          <span className="admin-marketing-stat-label">Utilisations</span>
        </div>
      </div>

      <div className="admin-marketing-create-card">
        <p className="admin-marketing-create-title">Nouveau code promo</p>
        <p className="text-xs text-zinc-500 mb-3">
          Affiché sur la page Promotions et utilisable au checkout.
        </p>
        <div className="admin-marketing-create-grid">
          <input
            placeholder="Code (BIENVENUE10)"
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            className={inputClass}
          />
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as Coupon['type'] })}
            className={inputClass}
          >
            <option value="POURCENT">Pourcentage</option>
            <option value="MONTANT_FIXE">Montant fixe (GN)</option>
          </select>
          <input
            type="number"
            placeholder="Valeur"
            value={draft.valeur}
            onChange={(e) => setDraft({ ...draft, valeur: Number(e.target.value) })}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Max utilisations (optionnel)"
            value={draft.maxUtilisations ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                maxUtilisations: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={inputClass}
          />
          <button
            type="button"
            onClick={creerCoupon}
            disabled={!draft.code.trim() || actionId === 'create-coupon'}
            className="admin-marketing-create-btn"
          >
            {actionId === 'create-coupon' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Créer
          </button>
        </div>
      </div>

      <div className="admin-marketing-toolbar">
        <div className="admin-marketing-search-wrap">
          <Search className="admin-marketing-search-icon" strokeWidth={1.75} />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un code…"
            className="admin-marketing-search"
          />
        </div>
        <div className="admin-marketing-filters">
          {[
            { id: '' as const, label: 'Tous' },
            { id: 'actif' as const, label: 'Actifs' },
            { id: 'inactif' as const, label: 'Inactifs' },
          ].map(({ id, label }) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setFiltreActif(id)}
              className={`admin-marketing-filter ${filtreActif === id ? 'is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-marketing-table-card">
        {loading ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : couponsFiltres.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucun code promo trouvé.</p>
        ) : (
          <>
            <div className="admin-marketing-table-wrap">
              <table className="admin-marketing-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Réduction</th>
                    <th>Min. commande</th>
                    <th>Utilisations</th>
                    <th>Validité</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {couponsFiltres.map((c) => {
                    const busy = actionId === c.id;
                    return (
                      <tr key={c.id}>
                        <td>
                          <span className="admin-marketing-code">{c.code}</span>
                        </td>
                        <td className="text-zinc-500">
                          {c.type === 'POURCENT' ? 'Pourcentage' : 'Montant fixe'}
                        </td>
                        <td className="font-semibold text-zinc-900">{formatValeur(c)}</td>
                        <td className="text-zinc-500">
                          {c.minCommande ? `${c.minCommande.toLocaleString('fr-FR')} GN` : '—'}
                        </td>
                        <td>
                          <span className="font-medium">{c.utilisations}</span>
                          {c.maxUtilisations != null && (
                            <span className="text-zinc-400"> / {c.maxUtilisations}</span>
                          )}
                        </td>
                        <td className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(c.debut)} → {formatDate(c.fin)}
                        </td>
                        <td>
                          <span
                            className={`admin-marketing-badge ${c.actif ? 'is-active' : 'is-inactive'}`}
                          >
                            {c.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-marketing-actions">
                            <button
                              type="button"
                              title="Copier le code"
                              onClick={() => copierCode(c.code)}
                              className="admin-marketing-action"
                            >
                              {copiedCode === c.code ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4" strokeWidth={1.75} />
                              )}
                            </button>
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => setEditCoupon({ ...c })}
                              className="admin-marketing-action"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              title={c.actif ? 'Désactiver' : 'Activer'}
                              disabled={busy}
                              onClick={() => toggleCoupon(c)}
                              className={`admin-marketing-action ${c.actif ? '' : 'is-approve'}`}
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" strokeWidth={1.75} />
                              )}
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              disabled={busy}
                              onClick={() => supprimerCoupon(c.id)}
                              className="admin-marketing-action is-delete"
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
            <p className="admin-marketing-footer">
              {couponsFiltres.length} code{couponsFiltres.length > 1 ? 's' : ''} promo
            </p>
          </>
        )}
      </div>

      {editCoupon && (
        <div className="admin-marketing-modal-backdrop" onClick={() => setEditCoupon(null)}>
          <div className="admin-marketing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-marketing-modal-head">
              <h2>Modifier le code promo</h2>
              <button type="button" onClick={() => setEditCoupon(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="admin-marketing-modal-body">
              <label className="admin-marketing-field">
                <span>Code</span>
                <input
                  value={editCoupon.code}
                  onChange={(e) =>
                    setEditCoupon({ ...editCoupon, code: e.target.value.toUpperCase() })
                  }
                  className={inputClass}
                />
              </label>
              <div className="admin-marketing-modal-grid">
                <label className="admin-marketing-field">
                  <span>Type</span>
                  <select
                    value={editCoupon.type}
                    onChange={(e) =>
                      setEditCoupon({ ...editCoupon, type: e.target.value as Coupon['type'] })
                    }
                    className={inputClass}
                  >
                    <option value="POURCENT">Pourcentage</option>
                    <option value="MONTANT_FIXE">Montant fixe</option>
                  </select>
                </label>
                <label className="admin-marketing-field">
                  <span>Valeur</span>
                  <input
                    type="number"
                    value={editCoupon.valeur}
                    onChange={(e) =>
                      setEditCoupon({ ...editCoupon, valeur: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="admin-marketing-modal-grid">
                <label className="admin-marketing-field">
                  <span>Min. commande (GN)</span>
                  <input
                    type="number"
                    value={editCoupon.minCommande ?? ''}
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        minCommande: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="admin-marketing-field">
                  <span>Max utilisations</span>
                  <input
                    type="number"
                    value={editCoupon.maxUtilisations ?? ''}
                    onChange={(e) =>
                      setEditCoupon({
                        ...editCoupon,
                        maxUtilisations: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
            <div className="admin-marketing-modal-actions">
              <button
                type="button"
                onClick={() => sauverCoupon(editCoupon)}
                className="admin-marketing-modal-btn is-primary"
              >
                <Check className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
