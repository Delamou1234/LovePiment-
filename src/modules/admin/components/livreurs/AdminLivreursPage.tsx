'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { IdCard, Loader2, Printer, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY, ADMIN_CARD, ADMIN_CARD_PAD } from '@/modules/admin/components/admin-ui';
import { CourierCardPreviewModal } from './CourierCardPreviewModal';
import { courierCardBatchPrintUrl, type CourierCardData } from './courier-card.utils';
import { CourierIdCard } from './CourierIdCard';
import { CourierPhotoUpload, uploadCourierPhoto } from './CourierPhotoUpload';
import { triggerCourierCardPrint } from './print-courier-card';

const ENGIN_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  VELO: 'Vélo',
  AUTRE: 'Autre',
};

type Livreur = CourierCardData & {
  email: string;
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
  commune: '',
  contactUrgenceNom: '',
  contactUrgenceTel: '',
  permisConduire: '',
  verifie: false,
  notesAdmin: '',
};

export function AdminLivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cardLivreur, setCardLivreur] = useState<Livreur | null>(null);
  const [printingLivreur, setPrintingLivreur] = useState<Livreur | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [livRes, commRes] = await Promise.all([
        fetch('/api/admin/livreurs'),
        fetch('/api/admin/reference/communes'),
      ]);
      if (livRes.ok) {
        const data = await livRes.json();
        setLivreurs(data.livreurs ?? []);
      }
      if (commRes.ok) {
        const data = await commRes.json();
        const list: string[] = data.communes ?? [];
        setCommunes(list);
        setForm((f) => (f.commune ? f : { ...f, commune: list[0] ?? '' }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRunAfterMount(() => void load(), [load]);

  const majPhotoLivreur = (id: string, photoUrl: string | null) => {
    setLivreurs((prev) => prev.map((l) => (l.id === id ? { ...l, photoUrl } : l)));
    setCardLivreur((prev) => (prev?.id === id ? { ...prev, photoUrl } : prev));
    setPrintingLivreur((prev) => (prev?.id === id ? { ...prev, photoUrl } : prev));
  };

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
        const livreurId = (data as { livreur?: { id?: string } }).livreur?.id;
        if (livreurId && photoFile) {
          try {
            await uploadCourierPhoto(livreurId, photoFile);
          } catch (err) {
            alert(
              `Compte créé mais la photo n\u2019a pas pu être envoyée.\n\n${err instanceof Error ? err.message : 'Erreur inconnue'}`,
            );
          }
        }
        setForm(empty);
        setPhotoFile(null);
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

  const imprimerUneCarte = (livreur: Livreur) => {
    setPrintingLivreur(livreur);
    requestAnimationFrame(() => {
      triggerCourierCardPrint(() => setPrintingLivreur(null));
    });
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading || livreurs.length === 0}
            onClick={() =>
              window.open(
                courierCardBatchPrintUrl(livreurs.filter((l) => l.actif).map((l) => l.id)),
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            <Printer className="h-4 w-4 mr-1" />
            Imprimer les cartes
          </Button>
          <Button type="button" onClick={() => setShowForm((v) => !v)} className={ADMIN_BTN_PRIMARY}>
            <UserPlus className="h-4 w-4 mr-1" />
            Nouveau livreur
          </Button>
        </div>
      </div>

      {showForm && (
        <div className={`${ADMIN_CARD} ${ADMIN_CARD_PAD} space-y-3`}>
          <p className="font-semibold text-zinc-900">Créer un compte livreur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-shop" placeholder="Nom complet *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <input className="input-shop" placeholder="E-mail *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input-shop" type="password" placeholder="Mot de passe *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input className="input-shop" placeholder="Téléphone *" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            <input className="input-shop" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <input className="input-shop" placeholder="N° CNI *" value={form.numeroCni} onChange={(e) => setForm({ ...form, numeroCni: e.target.value })} />
            <select className="input-shop" value={form.typeEngin} onChange={(e) => setForm({ ...form, typeEngin: e.target.value })}>
              <option value="MOTO">Moto</option>
              <option value="VOITURE">Voiture</option>
              <option value="VELO">Vélo</option>
              <option value="AUTRE">Autre</option>
            </select>
            <input className="input-shop" placeholder="Immatriculation / plaque" value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} />
            <select className="input-shop" value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })}>
              {communes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input className="input-shop" placeholder="Quartier de base" value={form.quartierBase} onChange={(e) => setForm({ ...form, quartierBase: e.target.value })} />
            <input className="input-shop" placeholder="Permis de conduire" value={form.permisConduire} onChange={(e) => setForm({ ...form, permisConduire: e.target.value })} />
            <input className="input-shop" placeholder="Contact urgence (nom)" value={form.contactUrgenceNom} onChange={(e) => setForm({ ...form, contactUrgenceNom: e.target.value })} />
            <input className="input-shop" placeholder="Contact urgence (tél)" value={form.contactUrgenceTel} onChange={(e) => setForm({ ...form, contactUrgenceTel: e.target.value })} />
            <label className="input-shop flex cursor-pointer flex-col justify-center gap-1 border-dashed !bg-zinc-50 text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">Photo pour la carte</span>
              <span className="text-xs text-zinc-500">JPG, PNG ou WebP — max 2 Mo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="text-xs"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              {photoFile && <span className="text-xs text-olive">{photoFile.name}</span>}
            </label>
          </div>
          <textarea className="input-shop min-h-[80px]" placeholder="Notes admin" value={form.notesAdmin} onChange={(e) => setForm({ ...form, notesAdmin: e.target.value })} />
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

      <div className="admin-marketing-table-card">
        {loading ? (
          <div className="admin-marketing-empty">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : livreurs.length === 0 ? (
          <p className="admin-marketing-empty-text">Aucun livreur enregistré.</p>
        ) : (
          <div className="admin-marketing-table-wrap">
            <table className="admin-marketing-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Nom</th>
                  <th>Contact</th>
                  <th>Véhicule</th>
                  <th>Zone / CNI</th>
                  <th>Livraisons</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {livreurs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <CourierPhotoUpload
                        livreurId={l.id}
                        nom={l.nom}
                        photoUrl={l.photoUrl}
                        size="sm"
                        onPhotoChange={(url) => majPhotoLivreur(l.id, url)}
                      />
                    </td>
                    <td>
                      <p className="font-semibold text-zinc-900">{l.nom}</p>
                      {!l.actif && (
                        <span className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                          Inactif
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="text-zinc-700">{l.email}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{l.telephone}</p>
                    </td>
                    <td>
                      <p className="font-medium text-zinc-800">
                        {ENGIN_LABELS[l.typeEngin] ?? l.typeEngin}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">{l.immatriculation ?? '—'}</p>
                    </td>
                    <td>
                      <p className="text-zinc-700">{l.commune ?? '—'}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {l.numeroCni ? `CNI ${l.numeroCni}` : '—'}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-zinc-800">
                        {l.commandesEnCours} en cours
                      </p>
                      {l.penalitesCumuleesGn > 0 && (
                        <p className="mt-0.5 text-xs font-semibold text-red-700">
                          {l.penalitesCumuleesGn.toLocaleString('fr-FR')} GN de pénalités
                        </p>
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-marketing-badge ${l.verifie ? 'is-active' : 'is-inactive'}`}
                      >
                        {l.verifie ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-avis-actions">
                        <button
                          type="button"
                          title="Générer la carte"
                          onClick={() => setCardLivreur(l)}
                          className="admin-avis-action"
                        >
                          <IdCard className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          title="Imprimer une carte"
                          onClick={() => imprimerUneCarte(l)}
                          className="admin-avis-action"
                        >
                          <Printer className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => toggleVerifie(l.id, !l.verifie)}
                        >
                          {l.verifie ? 'Retirer vérif.' : 'Valider'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cardLivreur && (
        <CourierCardPreviewModal
          livreur={cardLivreur}
          onClose={() => setCardLivreur(null)}
          onPhotoChange={(url) => majPhotoLivreur(cardLivreur.id, url)}
        />
      )}

      {printingLivreur && (
        <div className="courier-card-print-portal" aria-hidden>
          <CourierIdCard livreur={printingLivreur} />
        </div>
      )}
    </div>
  );
}
