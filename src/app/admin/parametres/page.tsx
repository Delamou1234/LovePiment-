'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { CheckCircle2, Gift, Loader2, Mail, Phone, Save, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LivraisonConfig } from '@/shared/lib/shipping';

type Settings = {
  parrainageActif: boolean;
  appelsActifs: boolean;
  livraison: LivraisonConfig;
  newsletter: {
    actif: boolean;
    titre: string;
    description: string | null;
    imageUrl: string | null;
    remisePct: number;
    couponCode: string | null;
  };
  updatedAt: string;
};

const inputClass =
  'w-full rounded-xl border border-[#F2D4DC] bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#9B1B2E] focus:ring-2 focus:ring-[#9B1B2E]/10';

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: typeof Gift;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#F2D4DC] bg-white p-5">
      <div className="flex gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0eb] text-[#9B1B2E]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-[#9B1B2E]' : 'bg-zinc-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function parseGnInput(value: string): number {
  const n = Number(value.replace(/\s/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export default function AdminParametresPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/parametres');
      if (res.ok) {
        const data = await res.json();
        const s: Settings = {
          parrainageActif: data.settings.parrainageActif,
          appelsActifs: data.settings.appelsActifs,
          livraison: data.settings.livraison,
          newsletter: {
            actif: data.settings.newsletterActif,
            titre: data.settings.newsletterTitre,
            description: data.settings.newsletterDescription,
            imageUrl: data.settings.newsletterImageUrl,
            remisePct: data.settings.newsletterRemisePct,
            couponCode: data.settings.newsletterCouponCode,
          },
          updatedAt: data.settings.updatedAt,
        };
        setSettings(s);
        setDraft(s);
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
      const res = await fetch('/api/admin/parametres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parrainageActif: draft.parrainageActif,
          appelsActifs: draft.appelsActifs,
          livraison: draft.livraison,
          newsletter: {
            actif: draft.newsletter.actif,
            titre: draft.newsletter.titre,
            description: draft.newsletter.description,
            imageUrl: draft.newsletter.imageUrl,
            remisePct: draft.newsletter.remisePct,
            couponCode: draft.newsletter.couponCode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      const s: Settings = {
        parrainageActif: data.settings.parrainageActif,
        appelsActifs: data.settings.appelsActifs,
        livraison: data.settings.livraison,
        newsletter: {
          actif: data.settings.newsletterActif,
          titre: data.settings.newsletterTitre,
          description: data.settings.newsletterDescription,
          imageUrl: data.settings.newsletterImageUrl,
          remisePct: data.settings.newsletterRemisePct,
          couponCode: data.settings.newsletterCouponCode,
        },
        updatedAt: data.settings.updatedAt,
      };
      setSettings(s);
      setDraft(s);
      setMessage('Paramètres enregistrés — visibles sur le panier et le checkout');
      setOk(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
      setOk(false);
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    settings &&
    draft &&
    (settings.parrainageActif !== draft.parrainageActif ||
      settings.appelsActifs !== draft.appelsActifs ||
      JSON.stringify(settings.livraison) !== JSON.stringify(draft.livraison) ||
      JSON.stringify(settings.newsletter) !== JSON.stringify(draft.newsletter));

  const patchLivraison = (patch: Partial<LivraisonConfig>) => {
    setDraft((d) => (d ? { ...d, livraison: { ...d.livraison, ...patch } } : d));
  };

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9B1B2E]" />
      </div>
    );
  }

  const { livraison } = draft;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Paramètres</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Fonctionnalités boutique, tarifs de livraison et règles affichées au panier.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Livraison
        </h2>

        <div className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
          <p className="text-sm text-zinc-500 leading-relaxed">
            Ces montants sont utilisés sur le panier, le checkout et le calcul des commandes.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                Ville de référence (tarif local)
              </label>
              <input
                className={inputClass}
                value={livraison.villeParDefaut}
                onChange={(e) => patchLivraison({ villeParDefaut: e.target.value })}
                placeholder="Conakry"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                Délai indicatif
              </label>
              <input
                className={inputClass}
                value={livraison.delaiLabel ?? ''}
                onChange={(e) => patchLivraison({ delaiLabel: e.target.value || null })}
                placeholder="24–48 h"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                Tarif livraison — {livraison.villeParDefaut} (GN)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                className={inputClass}
                value={livraison.tarifConakry}
                onChange={(e) => patchLivraison({ tarifConakry: parseGnInput(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                Tarif livraison — hors {livraison.villeParDefaut} (GN)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                className={inputClass}
                value={livraison.tarifHorsConakry}
                onChange={(e) =>
                  patchLivraison({ tarifHorsConakry: parseGnInput(e.target.value) })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                Seuil livraison gratuite à {livraison.villeParDefaut} (GN)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                className={inputClass}
                value={livraison.seuilGratuit}
                onChange={(e) => patchLivraison({ seuilGratuit: parseGnInput(e.target.value) })}
                disabled={!livraison.gratuiteActive}
              />
            </div>
          </div>

          <ToggleRow
            icon={Truck}
            title="Livraison gratuite activée"
            description={`Offrir la livraison à ${livraison.villeParDefaut} dès le seuil indiqué.`}
            checked={livraison.gratuiteActive}
            onChange={(v) => patchLivraison({ gratuiteActive: v })}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Newsletter popup
        </h2>

        <div className="rounded-xl border border-[#F2D4DC] bg-white p-5 space-y-4">
          <ToggleRow
            icon={Mail}
            title="Popup newsletter active"
            description="Bandeau d'inscription affiché sur la boutique (titre, texte, remise et code coupon)."
            checked={draft.newsletter.actif}
            onChange={(v) =>
              setDraft((d) => (d ? { ...d, newsletter: { ...d.newsletter, actif: v } } : d))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Titre</label>
              <input
                className={inputClass}
                value={draft.newsletter.titre}
                onChange={(e) =>
                  setDraft((d) =>
                    d ? { ...d, newsletter: { ...d.newsletter, titre: e.target.value } } : d,
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Description</label>
              <textarea
                className={`${inputClass} min-h-[5rem] resize-y`}
                value={draft.newsletter.description ?? ''}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          newsletter: {
                            ...d.newsletter,
                            description: e.target.value || null,
                          },
                        }
                      : d,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Remise (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={draft.newsletter.remisePct}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          newsletter: {
                            ...d.newsletter,
                            remisePct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          },
                        }
                      : d,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Code coupon</label>
              <input
                className={inputClass}
                value={draft.newsletter.couponCode ?? ''}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          newsletter: {
                            ...d.newsletter,
                            couponCode: e.target.value.trim() || null,
                          },
                        }
                      : d,
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Image (URL)</label>
              <input
                className={inputClass}
                value={draft.newsletter.imageUrl ?? ''}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          newsletter: {
                            ...d.newsletter,
                            imageUrl: e.target.value.trim() || null,
                          },
                        }
                      : d,
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Fonctionnalités
        </h2>

        <ToggleRow
          icon={Gift}
          title="Programme de parrainage"
          description="Codes parrain, remise filleul au checkout, points parrain et section fidélité dans le compte client."
          checked={draft.parrainageActif}
          onChange={(v) => setDraft((d) => (d ? { ...d, parrainageActif: v } : d))}
        />

        <ToggleRow
          icon={Phone}
          title="Appels vocaux (WebRTC)"
          description="Bouton d'appel dans la messagerie client et admin. Les messages restent disponibles si désactivé."
          checked={draft.appelsActifs}
          onChange={(v) => setDraft((d) => (d ? { ...d, appelsActifs: v } : d))}
        />
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

      <p className="text-xs text-zinc-400">
        Dernière mise à jour :{' '}
        {new Date(draft.updatedAt).toLocaleString('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </p>
    </div>
  );
}
