'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { Check, Coins, Loader2, Search, Send, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';
import { VoiceSearchMicButton } from '@/shared/components/VoiceSearchMicButton';
import { useVoiceSearchInput } from '@/shared/hooks/useVoiceSearchInput';
import { cn } from '@/lib/utils';
import { formaterDateCourte } from '@/modules/admin/lib/order-status-labels';
import type { AssignLivreurCommande } from './assign-livreur.types';

type Livreur = { id: string; nom: string; telephone: string; verifie: boolean; actif: boolean };

type Props = {
  open: boolean;
  commandes: AssignLivreurCommande[];
  onClose: () => void;
  onAssigned: () => void;
};

function parseMontantGn(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(/\s/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function AdminAssignLivreurModal({ open, commandes, onClose, onAssigned }: Props) {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primeCommune, setPrimeCommune] = useState('');
  const [primes, setPrimes] = useState<Record<string, string>>({});
  const [personnaliserPrimes, setPersonnaliserPrimes] = useState(false);

  const voice = useVoiceSearchInput({
    onTranscript: (text) => setSearch(text),
  });

  useRunAfterMount(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/admin/livreurs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setLivreurs((d?.livreurs ?? []).filter((l: Livreur) => l.actif));
      })
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelected('');
    setSearch('');
    setError(null);
    setPrimeCommune('');
    setPrimes({});
    setPersonnaliserPrimes(false);
  }, [open, commandes]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, saving, onClose]);

  const livreursFiltres = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return livreurs;
    return livreurs.filter(
      (l) =>
        l.nom.toLowerCase().includes(q) ||
        l.telephone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    );
  }, [livreurs, search]);

  const livreurSelectionne = livreurs.find((l) => l.id === selected);

  if (!open || commandes.length === 0) return null;

  const orderIds = commandes.map((c) => c.id);
  const totalMontant = commandes.reduce((s, c) => s + c.montantTotal, 0);
  const plusieurs = commandes.length > 1;

  const primePourCommande = (orderId: string): number | undefined => {
    if (plusieurs && !personnaliserPrimes) {
      return parseMontantGn(primeCommune);
    }
    return parseMontantGn(primes[orderId] ?? '');
  };

  const assigner = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      if (orderIds.length === 1) {
        const prime = primePourCommande(orderIds[0]!);
        const res = await fetch(`/api/admin/commandes/${orderIds[0]}/assigner-livreur`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courierId: selected,
            ...(prime !== undefined ? { primeLivreurGn: prime } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { message?: string }).message ?? 'Assignation impossible.');
          return;
        }
      } else {
        const primesParCommande: Record<string, number> = {};
        for (const id of orderIds) {
          const prime = primePourCommande(id);
          if (prime !== undefined) primesParCommande[id] = prime;
        }
        const res = await fetch('/api/admin/livraisons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courierId: selected,
            orderIds,
            ...(Object.keys(primesParCommande).length > 0 ? { primesParCommande } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { message?: string }).message ?? 'Assignation impossible.');
          return;
        }
      }
      onAssigned();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="admin-courier-modal-backdrop"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal
      aria-labelledby="assign-livreur-title"
    >
      <div className="admin-courier-modal admin-assign-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-courier-modal__head">
          <div className="admin-courier-modal__head-icon" aria-hidden>
            <Truck className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="assign-livreur-title" className="admin-courier-modal__title">
              {plusieurs
                ? `Envoyer ${commandes.length} commandes`
                : 'Envoyer la commande au livreur'}
            </h2>
            <p className="admin-courier-modal__subtitle">
              1. Vérifiez la commande · 2. Choisissez le livreur · 3. Indiquez la prime
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="admin-courier-modal__close"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="admin-courier-modal__body admin-assign-modal__body">
          {/* Étape 1 — Commandes */}
          <section className="admin-assign-modal__step">
            <p className="admin-assign-modal__step-title">
              <span className="admin-assign-modal__step-num">1</span>
              Commande{plusieurs ? 's' : ''} sélectionnée{plusieurs ? 's' : ''}
            </p>
            <ul className="admin-assign-modal__order-list">
              {commandes.map((cmd) => (
                <li key={cmd.id} className="admin-assign-modal__order">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 text-sm truncate">{cmd.clientNom}</p>
                    <p className="text-xs text-zinc-500">
                      {cmd.clientVille}
                      {cmd.createdAt ? ` · ${formaterDateCourte(cmd.createdAt)}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-800 tabular-nums shrink-0">
                    {cmd.montantTotal.toLocaleString('fr-FR')} GN
                  </span>
                </li>
              ))}
            </ul>
            {plusieurs && (
              <p className="admin-assign-modal__total">
                Total commandes : <strong>{totalMontant.toLocaleString('fr-FR')} GN</strong>
              </p>
            )}
          </section>

          {/* Étape 2 — Livreur */}
          <section className="admin-assign-modal__step">
            <p className="admin-assign-modal__step-title">
              <span className="admin-assign-modal__step-num">2</span>
              Choisir le livreur
            </p>
            <div className="admin-assign-modal__search-wrap">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={voice.voicePlaceholder ?? 'Rechercher par nom ou téléphone…'}
                className={cn(
                  'admin-assign-modal__search',
                  voice.isListening && 'is-voice-listening',
                )}
                disabled={saving || loading}
                autoComplete="off"
              />
              {voice.isSupported && (
                <VoiceSearchMicButton
                  isListening={voice.isListening}
                  onToggle={voice.toggleVoice}
                  disabled={saving || loading}
                  size="sm"
                />
              )}
            </div>
            {voice.voiceError && (
              <p className="text-[11px] text-red-500" role="alert">
                {voice.voiceError}
              </p>
            )}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-olive" />
              </div>
            ) : livreurs.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">
                Aucun livreur actif.{' '}
                <a href="/admin/livreurs" className="text-olive font-semibold hover:underline">
                  Créer un livreur
                </a>
              </p>
            ) : livreursFiltres.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">
                Aucun livreur pour « {search} ».
              </p>
            ) : (
              <ul className="admin-assign-modal__livreur-list">
                {livreursFiltres.map((l) => {
                  const active = selected === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        className={`admin-assign-modal__livreur${active ? ' is-selected' : ''}`}
                        onClick={() => setSelected(l.id)}
                        disabled={saving}
                      >
                        <span className="admin-assign-modal__livreur-check" aria-hidden>
                          {active ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block font-semibold text-zinc-900 text-sm">{l.nom}</span>
                          <span className="block text-xs text-zinc-500">{l.telephone}</span>
                        </span>
                        {l.verifie && (
                          <span className="admin-assign-modal__verified">Vérifié</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Étape 3 — Prime */}
          <section className="admin-assign-modal__step admin-assign-modal__prime">
            <p className="admin-assign-modal__step-title">
              <span className="admin-assign-modal__step-num">3</span>
              Prime de livraison
            </p>
            <p className="admin-assign-modal__prime-hint">
              Montant versé au livreur pour cette livraison (en francs guinéens). Laissez vide si
              aucune prime.
            </p>

            {plusieurs && !personnaliserPrimes ? (
              <label className="admin-assign-modal__prime-field">
                <Coins className="h-4 w-4 shrink-0 text-olive" aria-hidden />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex. 5000"
                  className="input-shop flex-1"
                  value={primeCommune}
                  disabled={saving}
                  onChange={(e) => setPrimeCommune(e.target.value)}
                />
                <span className="text-xs font-semibold text-zinc-500 shrink-0">GN</span>
              </label>
            ) : plusieurs && personnaliserPrimes ? (
              <ul className="admin-assign-modal__prime-list">
                {commandes.map((cmd) => (
                  <li key={cmd.id} className="admin-assign-modal__prime-row">
                    <span className="text-xs text-zinc-600 truncate flex-1">{cmd.clientNom}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="input-shop h-9 w-28 text-sm"
                      value={primes[cmd.id] ?? ''}
                      disabled={saving}
                      onChange={(e) =>
                        setPrimes((prev) => ({ ...prev, [cmd.id]: e.target.value }))
                      }
                    />
                    <span className="text-xs text-zinc-500">GN</span>
                  </li>
                ))}
              </ul>
            ) : (
              <label className="admin-assign-modal__prime-field">
                <Coins className="h-4 w-4 shrink-0 text-olive" aria-hidden />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex. 5000"
                  className="input-shop flex-1"
                  value={primes[commandes[0]!.id] ?? ''}
                  disabled={saving}
                  onChange={(e) =>
                    setPrimes((prev) => ({ ...prev, [commandes[0]!.id]: e.target.value }))
                  }
                />
                <span className="text-xs font-semibold text-zinc-500 shrink-0">GN</span>
              </label>
            )}

            {plusieurs && (
              <button
                type="button"
                className="text-xs font-semibold text-olive hover:underline mt-2"
                onClick={() => {
                  if (!personnaliserPrimes && primeCommune.trim()) {
                    const parsed = parseMontantGn(primeCommune);
                    if (parsed !== undefined) {
                      setPrimes(
                        Object.fromEntries(commandes.map((c) => [c.id, String(parsed)])),
                      );
                    }
                  }
                  setPersonnaliserPrimes((v) => !v);
                }}
              >
                {personnaliserPrimes
                  ? '← Même prime pour toutes les commandes'
                  : 'Personnaliser la prime par commande'}
              </button>
            )}
          </section>

          {error && (
            <p className="admin-assign-modal__error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="admin-courier-modal__foot">
          <p className="admin-courier-modal__foot-note">
            {livreurSelectionne
              ? `Envoi à ${livreurSelectionne.nom} — le livreur verra la commande sur son téléphone.`
              : 'Sélectionnez un livreur pour continuer.'}
          </p>
          <div className="admin-courier-modal__actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button
              type="button"
              className={ADMIN_BTN_PRIMARY}
              disabled={saving || !selected || livreurs.length === 0}
              onClick={assigner}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Confirmer l&apos;envoi
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
