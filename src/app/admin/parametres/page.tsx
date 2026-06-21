'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Gift, Loader2, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Settings = {
  parrainageActif: boolean;
  appelsActifs: boolean;
  updatedAt: string;
};

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
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#ebe4d8] bg-white p-5">
      <div className="flex gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0eb] text-[#4a5240]">
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
          checked ? 'bg-[#4a5240]' : 'bg-zinc-200'
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
        const s = {
          parrainageActif: data.settings.parrainageActif,
          appelsActifs: data.settings.appelsActifs,
          updatedAt: data.settings.updatedAt,
        };
        setSettings(s);
        setDraft(s);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      const s = {
        parrainageActif: data.settings.parrainageActif,
        appelsActifs: data.settings.appelsActifs,
        updatedAt: data.settings.updatedAt,
      };
      setSettings(s);
      setDraft(s);
      setMessage('Paramètres enregistrés');
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
      settings.appelsActifs !== draft.appelsActifs);

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#4a5240]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Paramètres</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Activez ou désactivez les fonctionnalités visibles sur la boutique et l&apos;espace client.
        </p>
      </div>

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
          className="rounded-xl bg-[#4a5240] hover:bg-[#3d4534]"
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
