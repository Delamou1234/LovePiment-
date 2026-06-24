'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { Loader2, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustomerAddress } from '@/modules/compte/types';
import { GeolocationAddressPrompt } from '@/shared/components/GeolocationAddressPrompt';
import type { GeolocationAddressSuggestion } from '@/shared/lib/geolocation/reverse-geocode';
import {
  COMPTE_BTN_PRIMARY,
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_INPUT,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
} from './compte-ui';

const emptyForm = { label: '', adresse: '', ville: 'Conakry', telephone: '', parDefaut: false };

export function CompteAdressesSection() {
  const [adresses, setAdresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [geoPromptKey, setGeoPromptKey] = useState(0);

  const openAddForm = () => {
    setShowForm(true);
    setGeoPromptKey((k) => k + 1);
  };

  const applySuggestion = (suggestion: GeolocationAddressSuggestion) => {
    setForm({
      label: suggestion.label,
      adresse: suggestion.adresse,
      ville: suggestion.ville,
      telephone: form.telephone,
      parDefaut: adresses.length === 0,
    });
    setShowForm(true);
  };

  const saveSuggestion = async (suggestion: GeolocationAddressSuggestion) => {
    setSaving(true);
    try {
      await fetch('/api/compte/adresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          label: suggestion.label,
          adresse: suggestion.adresse,
          ville: suggestion.ville,
          parDefaut: adresses.length === 0,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compte/adresses');
      if (res.ok) {
        const data = await res.json();
        setAdresses(
          (data.adresses ?? []).map((a: CustomerAddress & { createdAt: string }) => ({
            ...a,
            createdAt: a.createdAt,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [setAdresses, setLoading]);

  useRunAfterMount(() => void load(), [load]);

  const creer = async () => {
    if (!form.adresse.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/compte/adresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/compte/adresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parDefaut: true }),
    });
    await load();
  };

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cette adresse ?')) return;
    await fetch(`/api/compte/adresses/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD}`}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="lg:hidden">
              <h2 className={COMPTE_SECTION_TITLE}>Mes adresses</h2>
              <p className={COMPTE_SECTION_DESC}>Enregistrez vos adresses de livraison à Conakry</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={openAddForm}
            className="rounded-full border-beige-border"
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-olive" />
          </div>
        ) : adresses.length === 0 && !showForm ? (
          <div className="rounded-xl border border-dashed border-beige-border bg-cream/50 py-8 px-4 text-center space-y-4">
            <MapPin className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">Aucune adresse enregistrée pour le moment.</p>
            <GeolocationAddressPrompt
              key={geoPromptKey}
              autoStart
              showManualTrigger={false}
              onAccept={saveSuggestion}
              onDismiss={openAddForm}
              className="text-left max-w-md mx-auto"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={openAddForm}
              className="rounded-full border-beige-border"
            >
              <Plus className="mr-1 h-4 w-4" />
              Saisir une adresse manuellement
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {adresses.map((a) => (
              <div
                key={a.id}
                className={`relative rounded-xl border p-5 transition hover:shadow-sm ${
                  a.parDefaut
                    ? 'border-olive/40 bg-cream ring-1 ring-olive/10'
                    : 'border-beige-border bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900">{a.label || 'Adresse'}</p>
                      {a.parDefaut && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-olive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          <Star className="h-3 w-3" />
                          Défaut
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{a.adresse}</p>
                    <p className="text-sm text-zinc-500 mt-1">{a.ville}</p>
                    {a.telephone && (
                      <p className="text-xs text-zinc-400 mt-2 font-medium">{a.telephone}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-beige-border/60">
                    {!a.parDefaut && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefault(a.id)}
                        className="rounded-full text-xs h-8"
                      >
                        Par défaut
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => supprimer(a.id)}
                      className="ml-auto rounded-full p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="mt-6 space-y-4 rounded-xl border border-dashed border-beige-border bg-cream/30 p-5 md:p-6">
            <p className="text-sm font-semibold text-zinc-900">Nouvelle adresse</p>
            <GeolocationAddressPrompt
              key={`form-${geoPromptKey}`}
              autoStart={!form.adresse.trim()}
              onAccept={applySuggestion}
              compact
            />
            <input
              className={COMPTE_INPUT}
              placeholder="Libellé (ex. Maison, Bureau)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <input
              className={COMPTE_INPUT}
              placeholder="Adresse complète *"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={COMPTE_INPUT}
                placeholder="Ville"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
              />
              <input
                className={COMPTE_INPUT}
                placeholder="Téléphone"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.parDefaut}
                onChange={(e) => setForm({ ...form, parDefaut: e.target.checked })}
                className="rounded border-beige-border text-olive focus:ring-olive/20"
              />
              Définir comme adresse par défaut
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={creer} disabled={saving} className={COMPTE_BTN_PRIMARY}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-full">
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
