'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustomerAddress } from '@/modules/compte/types';

const inputClass =
  'w-full rounded-xl border border-[#ebe4d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#4a5240] focus:ring-2 focus:ring-[#4a5240]/10';

const emptyForm = { label: '', adresse: '', ville: 'Conakry', telephone: '', parDefaut: false };

export function CompteAdressesSection() {
  const [adresses, setAdresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
          <MapPin className="h-5 w-5 text-[#4a5240]" />
          Mes adresses
        </h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : adresses.length === 0 && !showForm ? (
        <p className="text-sm text-zinc-500">Aucune adresse enregistrée.</p>
      ) : (
        <div className="space-y-3">
          {adresses.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-4 ${a.parDefaut ? 'border-[#4a5240] bg-[#faf7f2]' : 'border-zinc-100'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {a.label || 'Adresse'}
                    {a.parDefaut && (
                      <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-[#4a5240] px-2 py-0.5 text-[10px] font-bold text-white">
                        <Star className="h-3 w-3" />
                        Par défaut
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{a.adresse}</p>
                  <p className="text-sm text-zinc-500">{a.ville}</p>
                  {a.telephone && <p className="text-xs text-zinc-400 mt-1">{a.telephone}</p>}
                </div>
                <div className="flex gap-1">
                  {!a.parDefaut && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(a.id)}>
                      Définir par défaut
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => supprimer(a.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
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
        <div className="mt-6 space-y-3 rounded-xl border border-dashed border-zinc-200 p-4">
          <input
            className={inputClass}
            placeholder="Libellé (ex. Maison, Bureau)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Adresse complète *"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Ville"
              value={form.ville}
              onChange={(e) => setForm({ ...form, ville: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Téléphone"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={form.parDefaut}
              onChange={(e) => setForm({ ...form, parDefaut: e.target.checked })}
            />
            Adresse par défaut
          </label>
          <div className="flex gap-2">
            <Button onClick={creer} disabled={saving} className="bg-[#4a5240] hover:bg-[#3d4534] text-white">
              Enregistrer
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
