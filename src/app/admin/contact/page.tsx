'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContactMessageResume, ContactStatusKey } from '@/modules/contact/types';

const STATUT_LABELS: Record<ContactStatusKey, string> = {
  NOUVEAU: 'Nouveau',
  LU: 'Lu',
  TRAITE: 'Traité',
};

const STATUT_STYLES: Record<ContactStatusKey, string> = {
  NOUVEAU: 'bg-amber-100 text-amber-800',
  LU: 'bg-blue-100 text-blue-800',
  TRAITE: 'bg-emerald-100 text-emerald-800',
};

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessageResume[]>([]);
  const [nonLus, setNonLus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contact');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setNonLus(data.nonLus ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const updateStatut = async (id: string, statut: ContactStatusKey) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setUpdating(false);
    }
  };

  const openMessage = (id: string) => {
    setSelectedId(id);
    const msg = messages.find((m) => m.id === id);
    if (msg?.statut === 'NOUVEAU') {
      updateStatut(id, 'LU');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Messages de contact
            {nonLus > 0 && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {nonLus}
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Formulaire public — réponses par e-mail ou WhatsApp.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-400">
          Aucun message pour le moment.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <ul className="divide-y divide-zinc-100 max-h-[70vh] overflow-y-auto">
              {messages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => openMessage(m.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#faf7f2] transition ${
                      selectedId === m.id ? 'bg-[#faf7f2] border-l-4 border-[#4a5240]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-zinc-900 truncate">{m.nom}</p>
                      {m.statut === 'NOUVEAU' && (
                        <Circle className="h-2.5 w-2.5 shrink-0 fill-amber-500 text-amber-500 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{m.sujetLabel}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(m.createdAt))}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white p-6 min-h-[320px]">
            {!selected ? (
              <p className="text-sm text-zinc-400 text-center py-12">
                Sélectionnez un message pour le lire.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">{selected.nom}</h2>
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-sm text-[#4a5240] hover:underline"
                    >
                      {selected.email}
                    </a>
                    {selected.telephone && (
                      <p className="text-sm text-zinc-500 mt-0.5">{selected.telephone}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_STYLES[selected.statut]}`}
                  >
                    {STATUT_LABELS[selected.statut]}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Sujet</p>
                  <p className="text-sm text-zinc-800">{selected.sujetLabel}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Message</p>
                  <div className="rounded-lg bg-[#faf7f2] p-4 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.statut !== 'TRAITE' && (
                    <Button
                      size="sm"
                      disabled={updating}
                      className="bg-[#4a5240] hover:bg-[#3d4534]"
                      onClick={() => updateStatut(selected.id, 'TRAITE')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Marquer traité
                    </Button>
                  )}
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.sujetLabel)}`}
                    className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition"
                  >
                    Répondre par e-mail
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
