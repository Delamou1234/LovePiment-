'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useState } from 'react';
import { IdCard, Loader2, Printer, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';
import { CourierCardPreviewModal } from './CourierCardPreviewModal';
import { CourierCreateModal, type CourierCreateForm } from './CourierCreateModal';
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

export function AdminLivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cardLivreur, setCardLivreur] = useState<Livreur | null>(null);
  const [printingLivreur, setPrintingLivreur] = useState<Livreur | null>(null);

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
        setCommunes(data.communes ?? []);
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

  const creer = async (form: CourierCreateForm, photoFile: File | null): Promise<boolean> => {
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

    setSaving(true);
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
        await load();
        if (data.emailEnvoye) {
          alert(`Compte créé. Un e-mail avec les identifiants a été envoyé à ${emailCible}.`);
        } else if (data.avertissement) {
          alert(`Compte créé pour ${emailCible}.\n\n${data.avertissement}`);
        } else {
          alert(`Compte créé pour ${emailCible}.`);
        }
        return true;
      }

      alert((data as { message?: string }).message ?? 'Impossible de créer le livreur.');
      return false;
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
          <Button type="button" onClick={() => setShowForm(true)} className={ADMIN_BTN_PRIMARY}>
            <UserPlus className="h-4 w-4 mr-1" />
            Nouveau livreur
          </Button>
        </div>
      </div>

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

      <CourierCreateModal
        open={showForm}
        onClose={() => setShowForm(false)}
        communes={communes}
        saving={saving}
        onSubmit={creer}
      />

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
