'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  APROPOS_ICON_KEYS,
  DEFAULT_APROPOS,
  type AproposChiffre,
  type AproposIconKey,
  type AproposPublicConfig,
  type AproposValeur,
} from '@/modules/marketing/types/apropos';
import { CloudinaryImageField } from '@/shared/components/CloudinaryImageField';

const inputClass =
  'w-full rounded-xl border border-[#F2D4DC] bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#9B1B2E] focus:ring-2 focus:ring-[#9B1B2E]/10';

const textareaClass = `${inputClass} min-h-[7rem] resize-y leading-relaxed`;

const ICON_LABELS: Record<AproposIconKey, string> = {
  'badge-check': 'Badge vérifié',
  truck: 'Livraison',
  'shield-check': 'Sécurité',
  heart: 'Cœur',
  sparkles: 'Étoiles',
  users: 'Équipe',
  gem: 'Qualité',
  headset: 'Support',
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-zinc-600">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export function AdminAproposPage() {
  const [saved, setSaved] = useState<AproposPublicConfig | null>(null);
  const [draft, setDraft] = useState<AproposPublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/apropos');
      if (res.ok) {
        const data = (await res.json()) as { apropos: AproposPublicConfig };
        setSaved(data.apropos);
        setDraft(data.apropos);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setMessage('');
    setOk(false);
    try {
      const res = await fetch('/api/admin/apropos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setSaved(data.apropos);
      setDraft(data.apropos);
      setMessage('Page À propos mise à jour — visible sur /apropos');
      setOk(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
      setOk(false);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!window.confirm('Réinitialiser les textes avec le contenu éditorial par défaut ?')) return;
    try {
      const res = await fetch('/api/admin/apropos/chiffres-dynamiques');
      const chiffres = res.ok ? ((await res.json()) as { chiffres: AproposChiffre[] }).chiffres : [];
      setDraft({ ...DEFAULT_APROPOS, chiffres });
    } catch {
      setDraft({ ...DEFAULT_APROPOS, chiffres: draft?.chiffres ?? [] });
    }
  };

  const syncChiffres = async () => {
    try {
      const res = await fetch('/api/admin/apropos/chiffres-dynamiques');
      if (!res.ok) return;
      const data = (await res.json()) as { chiffres: AproposChiffre[] };
      setDraft((d) => (d ? { ...d, chiffres: data.chiffres } : d));
    } catch {
      /* ignore */
    }
  };

  const dirty = saved && draft && JSON.stringify(saved) !== JSON.stringify(draft);

  const patchChiffre = (index: number, patch: Partial<AproposChiffre>) => {
    setDraft((d) => {
      if (!d) return d;
      const chiffres = d.chiffres.map((c, i) => (i === index ? { ...c, ...patch } : c));
      return { ...d, chiffres };
    });
  };

  const patchValeur = (index: number, patch: Partial<AproposValeur>) => {
    setDraft((d) => {
      if (!d) return d;
      const valeurs = d.valeurs.map((v, i) => (i === index ? { ...v, ...patch } : v));
      return { ...d, valeurs };
    });
  };

  const addChiffre = () => {
    setDraft((d) =>
      d ? { ...d, chiffres: [...d.chiffres, { value: '0', label: 'Nouveau chiffre' }] } : d,
    );
  };

  const removeChiffre = (index: number) => {
    setDraft((d) => {
      if (!d || d.chiffres.length <= 1) return d;
      return { ...d, chiffres: d.chiffres.filter((_, i) => i !== index) };
    });
  };

  const addValeur = () => {
    setDraft((d) =>
      d
        ? {
            ...d,
            valeurs: [
              ...d.valeurs,
              { icon: 'heart' as const, title: 'Nouvelle valeur', text: 'Description…' },
            ],
          }
        : d,
    );
  };

  const removeValeur = (index: number) => {
    setDraft((d) => {
      if (!d || d.valeurs.length <= 1) return d;
      return { ...d, valeurs: d.valeurs.filter((_, i) => i !== index) };
    });
  };

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9B1B2E]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Page À propos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Contenu public de la page « À propos de nous » — hero, mission, chiffres et valeurs.
          </p>
        </div>
        <Link
          href="/apropos"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9B1B2E] hover:underline"
        >
          Voir la page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">SEO</h2>
        <Field label="Meta description (référencement)">
          <textarea
            className={textareaClass}
            value={draft.metaDescription}
            onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })}
            rows={2}
          />
        </Field>
      </section>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Hero</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Surtitre">
            <input
              className={inputClass}
              value={draft.heroKicker}
              onChange={(e) => setDraft({ ...draft, heroKicker: e.target.value })}
            />
          </Field>
        </div>
        <CloudinaryImageField
          label="Image hero"
          folder="apropos"
          value={draft.heroImageUrl}
          onChange={(heroImageUrl) => setDraft({ ...draft, heroImageUrl })}
          hint="Téléversez une image ou collez une URL (chemin local /images/… toujours possible)."
          previewAspect="wide"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre principal">
          <input
            className={inputClass}
            value={draft.heroTitre}
            onChange={(e) => setDraft({ ...draft, heroTitre: e.target.value })}
          />
        </Field>
        <Field label="Titre accentué (en rose sur le site)">
          <input
            className={inputClass}
            value={draft.heroAccent}
            onChange={(e) => setDraft({ ...draft, heroAccent: e.target.value })}
          />
        </Field>
        <Field label="Texte d'introduction">
          <textarea
            className={textareaClass}
            value={draft.heroTexte}
            onChange={(e) => setDraft({ ...draft, heroTexte: e.target.value })}
          />
        </Field>
        </div>
      </section>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mission</h2>
        <Field label="Titre">
          <input
            className={inputClass}
            value={draft.missionTitre}
            onChange={(e) => setDraft({ ...draft, missionTitre: e.target.value })}
          />
        </Field>
        <Field label="Texte">
          <textarea
            className={textareaClass}
            value={draft.missionTexte}
            onChange={(e) => setDraft({ ...draft, missionTexte: e.target.value })}
          />
        </Field>
      </section>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Notre histoire</h2>
        <Field label="Titre">
          <input
            className={inputClass}
            value={draft.histoireTitre}
            onChange={(e) => setDraft({ ...draft, histoireTitre: e.target.value })}
          />
        </Field>
        <Field label="Texte" hint="Saut de ligne = nouveau paragraphe">
          <textarea
            className={textareaClass}
            value={draft.histoireTexte}
            onChange={(e) => setDraft({ ...draft, histoireTexte: e.target.value })}
            rows={6}
          />
        </Field>
      </section>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Chiffres clés</h2>
            <p className="mt-1 text-[11px] text-zinc-400">
              Par défaut, calculés depuis la boutique (clients, commandes, avis, délais).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void syncChiffres()}
              className="inline-flex items-center gap-1 rounded-lg border border-[#F2D4DC] px-2.5 py-1.5 text-xs font-semibold text-[#9B1B2E] hover:bg-[#FFF8F6]"
            >
              Synchroniser stats réelles
            </button>
            <button
              type="button"
              onClick={addChiffre}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B1B2E]"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {draft.chiffres.map((chiffre, index) => (
            <div
              key={`chiffre-${index}`}
              className="grid gap-3 rounded-lg border border-[#F2D4DC]/80 bg-[#fafafa] p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                className={inputClass}
                placeholder="Ex. 42"
                value={chiffre.value}
                onChange={(e) => patchChiffre(index, { value: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Label"
                value={chiffre.label}
                onChange={(e) => patchChiffre(index, { label: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeChiffre(index)}
                disabled={draft.chiffres.length <= 1}
                className="flex h-10 w-10 items-center justify-center self-end rounded-lg border border-[#F2D4DC] text-zinc-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nos valeurs</h2>
          <button
            type="button"
            onClick={addValeur}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B1B2E]"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>
        <div className="space-y-4">
          {draft.valeurs.map((valeur, index) => (
            <div
              key={`valeur-${index}`}
              className="space-y-3 rounded-lg border border-[#F2D4DC]/80 bg-[#fafafa] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-500">Valeur {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeValeur(index)}
                  disabled={draft.valeurs.length <= 1}
                  className="text-zinc-400 hover:text-red-600 disabled:opacity-30"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Titre">
                  <input
                    className={inputClass}
                    value={valeur.title}
                    onChange={(e) => patchValeur(index, { title: e.target.value })}
                  />
                </Field>
                <Field label="Icône">
                  <select
                    className={inputClass}
                    value={valeur.icon}
                    onChange={(e) =>
                      patchValeur(index, { icon: e.target.value as AproposIconKey })
                    }
                  >
                    {APROPOS_ICON_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {ICON_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={valeur.text}
                  onChange={(e) => patchValeur(index, { text: e.target.value })}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Bandeau d&apos;appel à l&apos;action
        </h2>
        <Field label="Titre">
          <input
            className={inputClass}
            value={draft.ctaTitre}
            onChange={(e) => setDraft({ ...draft, ctaTitre: e.target.value })}
          />
        </Field>
        <Field label="Texte">
          <textarea
            className={textareaClass}
            value={draft.ctaTexte}
            onChange={(e) => setDraft({ ...draft, ctaTexte: e.target.value })}
            rows={3}
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-xl bg-[#9B1B2E] hover:bg-[#6E1020]"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          Réinitialiser les textes par défaut
        </button>
        {message && (
          <p
            className={`text-sm flex items-center gap-1.5 ${
              ok ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {ok && <CheckCircle2 className="h-4 w-4" />}
            {message}
          </p>
        )}
      </div>

      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
        <BadgeCheck className="h-3.5 w-3.5" />
        Les infos livraison (tarifs, délai) restent gérées dans Paramètres.
      </p>
    </div>
  );
}
