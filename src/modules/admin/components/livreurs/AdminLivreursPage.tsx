'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY, ADMIN_CARD, ADMIN_CARD_PAD } from '@/modules/admin/components/admin-ui';

const COMMUNES = ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto', 'Coyah', 'Kindia', 'Autre'];

type Livreur = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  typeEngin: string;
  immatriculation: string | null;
  numeroCni: string | null;
  commune: string | null;
  verifie: boolean;
  actif: boolean;
  penalitesCumuleesGn: number;
  commandesEnCours: number;
};

const empty = {
  email: '',
  password: '',
  nom: '',
  telephone: '',
  whatsapp: '',
  typeEngin: 'MOTO',
  immatriculation: '',
  numeroCni: '',
  quartierBase: '',
  commune: 'Ratoma',
  contactUrgenceNom: '',
  contactUrgenceTel: '',
  permisConduire: '',
  verifie: false,
  notesAdmin: '',
};

export function AdminLivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/livreurs');
      if (res.ok) {
        const data = await res.json();
        setLivreurs(data.livreurs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const creer = async () => {
    if (!form.nom.trim() || !form.email.trim() || !form.password.trim() || !form.telephone.trim()) {
      alert('Renseignez au minimum le nom, l\u2019e-mail, le mot de passe et le téléphone.');
      return;
    }
    if (form.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSaving(true);
    const emailCible = form.email.trim().toLowerCase();
    const payload = {
      ...form,
      nom: form.nom.trim(),
      email: emailCible,
      telephone: form.telephone.trim(),
      whatsapp: form.whatsapp.trim() || null,
      immatriculation: form.immatriculation.trim() || null,
      numeroCni: form.numeroCni.trim() || null,
      quartierBase: form.quartierBase.trim() || null,
      contactUrgenceNom: form.contactUrgenceNom.trim() || null,
      contactUrgenceTel: form.contactUrgenceTel.trim() || null,
      permisConduire: form.permisConduire.trim() || null,
      notesAdmin: form.notesAdmin.trim() || null,
    };

    try {
      const res = await fetch('/api/admin/livreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setForm(empty);
        setShowForm(false);
        await load();
        if (data.emailEnvoye) {
          alert(`Compte créé. Un e-mail avec les identifiants a été envoyé à ${emailCible}.`);
        } else if (data.avertissement) {
          alert(`Compte créé pour ${emailCible}.\n\n${data.avertissement}`);
        } else {
          alert(`Compte créé pour ${emailCible}.`);
        }
        return;
      }

      alert((data as { message?: string }).message ?? 'Impossible de créer le livreur.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVerifie = async (id: string, verifie: boolean) => {
    await fetch(`/api/admin/livreurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifie }),
    });
    await load();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Livreurs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Comptes livreurs — un e-mail avec les identifiants est envoyé à la création.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)} className={ADMIN_BTN_PRIMARY}>
          <UserPlus className="h-4 w-4 mr-1" />
          Nouveau livreur
        </Button>
      </div>

      {showForm && (
        <div className={`${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-3`}>
          <p className="font-semibold text-zinc-900">Créer un compte livreur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-kabishop" placeholder="Nom complet *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <input className="input-kabishop" placeholder="E-mail *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input-kabishop" type="password" placeholder="Mot de passe *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input className="input-kabishop" placeholder="Téléphone *" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            <input className="input-kabishop" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <input className="input-kabishop" placeholder="N° CNI *" value={form.numeroCni} onChange={(e) => setForm({ ...form, numeroCni: e.target.value })} />
            <select className="input-kabishop" value={form.typeEngin} onChange={(e) => setForm({ ...form, typeEngin: e.target.value })}>
              <option value="MOTO">Moto</option>
              <option value="VOITURE">Voiture</option>
              <option value="VELO">Vélo</option>
              <option value="AUTRE">Autre</option>
            </select>
            <input className="input-kabishop" placeholder="Immatriculation / plaque" value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} />
            <select className="input-kabishop" value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })}>
              {COMMUNES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input className="input-kabishop" placeholder="Quartier de base" value={form.quartierBase} onChange={(e) => setForm({ ...form, quartierBase: e.target.value })} />
            <input className="input-kabishop" placeholder="Permis de conduire" value={form.permisConduire} onChange={(e) => setForm({ ...form, permisConduire: e.target.value })} />
            <input className="input-kabishop" placeholder="Contact urgence (nom)" value={form.contactUrgenceNom} onChange={(e) => setForm({ ...form, contactUrgenceNom: e.target.value })} />
            <input className="input-kabishop" placeholder="Contact urgence (tél)" value={form.contactUrgenceTel} onChange={(e) => setForm({ ...form, contactUrgenceTel: e.target.value })} />
          </div>
          <textarea className="input-kabishop min-h-[80px]" placeholder="Notes admin" value={form.notesAdmin} onChange={(e) => setForm({ ...form, notesAdmin: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.verifie} onChange={(e) => setForm({ ...form, verifie: e.target.checked })} />
            Documents vérifiés (crédibilité validée)
          </label>
          <Button type="button" onClick={creer} disabled={saving} className={ADMIN_BTN_PRIMARY}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Enregistrer
          </Button>
        </div>
      )}

      <div className={`${ADMIN_CARD} ${ADMIN_CARD_PAD}`}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-olive" /></div>
        ) : livreurs.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun livreur enregistré.</p>
        ) : (
          <div className="space-y-3">
            {livreurs.map((l) => (
              <div key={l.id} className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">{l.nom}</p>
                  <p className="text-xs text-zinc-500">{l.email} · {l.telephone}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {l.typeEngin} {l.immatriculation ? `· ${l.immatriculation}` : ''} · CNI {l.numeroCni ?? '—'} · {l.commune ?? '—'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">{l.commandesEnCours} livraison(s) en cours</p>
                  {l.penalitesCumuleesGn > 0 && (
                    <p className="text-xs font-semibold text-red-700 mt-1">
                      Pénalités dues : {l.penalitesCumuleesGn.toLocaleString('fr-FR')} GN
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${l.verifie ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {l.verifie ? 'Vérifié' : 'Non vérifié'}
                  </span>
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => toggleVerifie(l.id, !l.verifie)}>
                    {l.verifie ? 'Retirer vérification' : 'Valider crédibilité'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
