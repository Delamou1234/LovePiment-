'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Bike,
  FileText,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_BTN_PRIMARY } from '@/modules/admin/components/admin-ui';

export type CourierCreateForm = {
  email: string;
  password: string;
  nom: string;
  telephone: string;
  whatsapp: string;
  typeEngin: string;
  immatriculation: string;
  numeroCni: string;
  quartierBase: string;
  commune: string;
  contactUrgenceNom: string;
  contactUrgenceTel: string;
  permisConduire: string;
  verifie: boolean;
  notesAdmin: string;
};

const EMPTY_FORM: CourierCreateForm = {
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

type Props = {
  open: boolean;
  onClose: () => void;
  communes: string[];
  saving: boolean;
  onSubmit: (form: CourierCreateForm, photoFile: File | null) => Promise<boolean>;
};

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-courier-field">
      <label htmlFor={id} className="admin-courier-label">
        {label}
        {required && <span className="admin-courier-required">*</span>}
      </label>
      {children}
      {hint && <p className="admin-courier-hint">{hint}</p>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-courier-section">
      <h3 className="admin-courier-section-title">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function CourierCreateModal({ open, onClose, communes, saving, onSubmit }: Props) {
  const [form, setForm] = useState<CourierCreateForm>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const reset = useCallback(() => {
    setForm({
      ...EMPTY_FORM,
      commune: communes[0] ?? '',
    });
    setPhotoFile(null);
  }, [communes]);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const patch = (partial: Partial<CourierCreateForm>) => setForm((f) => ({ ...f, ...partial }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.email.trim() || !form.password.trim() || !form.telephone.trim()) {
      alert('Renseignez au minimum le nom, l\u2019e-mail, le mot de passe et le téléphone.');
      return;
    }
    if (form.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    const ok = await onSubmit(form, photoFile);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <div
      className="admin-courier-modal-backdrop"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal
      aria-labelledby="courier-create-title"
    >
      <div className="admin-courier-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-courier-modal__head">
          <div className="admin-courier-modal__head-icon" aria-hidden>
            <UserPlus className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="courier-create-title" className="admin-courier-modal__title">
              Nouveau livreur
            </h2>
            <p className="admin-courier-modal__subtitle">
              Un e-mail avec les identifiants sera envoyé après la création du compte.
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

        <form onSubmit={handleSubmit} className="admin-courier-modal__form">
          <div className="admin-courier-modal__body">
            <Section icon={User} title="Identité & connexion">
              <div className="admin-courier-grid">
                <Field id="courier-nom" label="Nom complet" required>
                  <input
                    id="courier-nom"
                    className="admin-courier-input"
                    value={form.nom}
                    onChange={(e) => patch({ nom: e.target.value })}
                    autoComplete="name"
                  />
                </Field>
                <Field id="courier-email" label="E-mail" required>
                  <input
                    id="courier-email"
                    type="email"
                    className="admin-courier-input"
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    autoComplete="off"
                  />
                </Field>
                <Field id="courier-password" label="Mot de passe" required hint="Minimum 6 caractères">
                  <input
                    id="courier-password"
                    type="password"
                    className="admin-courier-input"
                    value={form.password}
                    onChange={(e) => patch({ password: e.target.value })}
                    autoComplete="new-password"
                  />
                </Field>
                <Field id="courier-tel" label="Téléphone" required>
                  <input
                    id="courier-tel"
                    type="tel"
                    className="admin-courier-input"
                    value={form.telephone}
                    onChange={(e) => patch({ telephone: e.target.value })}
                    autoComplete="tel"
                  />
                </Field>
                <Field id="courier-wa" label="WhatsApp" hint="Optionnel — pour le suivi des livraisons">
                  <input
                    id="courier-wa"
                    type="tel"
                    className="admin-courier-input"
                    value={form.whatsapp}
                    onChange={(e) => patch({ whatsapp: e.target.value })}
                  />
                </Field>
                <Field id="courier-cni" label="N° CNI" required>
                  <input
                    id="courier-cni"
                    className="admin-courier-input"
                    value={form.numeroCni}
                    onChange={(e) => patch({ numeroCni: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            <Section icon={Bike} title="Véhicule & zone">
              <div className="admin-courier-grid">
                <Field id="courier-engin" label="Type de véhicule">
                  <select
                    id="courier-engin"
                    className="admin-courier-input"
                    value={form.typeEngin}
                    onChange={(e) => patch({ typeEngin: e.target.value })}
                  >
                    <option value="MOTO">Moto</option>
                    <option value="VOITURE">Voiture</option>
                    <option value="VELO">Vélo</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </Field>
                <Field id="courier-plaque" label="Immatriculation">
                  <input
                    id="courier-plaque"
                    className="admin-courier-input"
                    placeholder="Plaque ou référence"
                    value={form.immatriculation}
                    onChange={(e) => patch({ immatriculation: e.target.value })}
                  />
                </Field>
                <Field id="courier-commune" label="Commune">
                  <select
                    id="courier-commune"
                    className="admin-courier-input"
                    value={form.commune}
                    onChange={(e) => patch({ commune: e.target.value })}
                  >
                    {communes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="courier-quartier" label="Quartier de base">
                  <input
                    id="courier-quartier"
                    className="admin-courier-input"
                    value={form.quartierBase}
                    onChange={(e) => patch({ quartierBase: e.target.value })}
                  />
                </Field>
                <Field id="courier-permis" label="Permis de conduire">
                  <input
                    id="courier-permis"
                    className="admin-courier-input"
                    value={form.permisConduire}
                    onChange={(e) => patch({ permisConduire: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            <Section icon={Phone} title="Contact d'urgence">
              <div className="admin-courier-grid admin-courier-grid--2">
                <Field id="courier-urgence-nom" label="Nom du contact">
                  <input
                    id="courier-urgence-nom"
                    className="admin-courier-input"
                    value={form.contactUrgenceNom}
                    onChange={(e) => patch({ contactUrgenceNom: e.target.value })}
                  />
                </Field>
                <Field id="courier-urgence-tel" label="Téléphone">
                  <input
                    id="courier-urgence-tel"
                    type="tel"
                    className="admin-courier-input"
                    value={form.contactUrgenceTel}
                    onChange={(e) => patch({ contactUrgenceTel: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            <Section icon={FileText} title="Administration">
              <div className="admin-courier-grid">
                <Field
                  id="courier-photo"
                  label="Photo pour la carte"
                  hint="JPG, PNG ou WebP — max 2 Mo"
                >
                  <label htmlFor="courier-photo" className="admin-courier-file">
                    <span className="admin-courier-file-label">
                      {photoFile ? photoFile.name : 'Choisir une photo'}
                    </span>
                    <span className="admin-courier-file-btn">Parcourir</span>
                    <input
                      id="courier-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </Field>
                <Field id="courier-notes" label="Notes internes">
                  <textarea
                    id="courier-notes"
                    className="admin-courier-input admin-courier-textarea"
                    rows={3}
                    placeholder="Remarques visibles uniquement par l'administration"
                    value={form.notesAdmin}
                    onChange={(e) => patch({ notesAdmin: e.target.value })}
                  />
                </Field>
              </div>
              <label className="admin-courier-check">
                <input
                  type="checkbox"
                  checked={form.verifie}
                  onChange={(e) => patch({ verifie: e.target.checked })}
                />
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#9B1B2E]" strokeWidth={1.75} />
                <span>Documents vérifiés — crédibilité validée</span>
              </label>
            </Section>
          </div>

          <footer className="admin-courier-modal__foot">
            <p className="admin-courier-modal__foot-note">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Les champs marqués <span className="admin-courier-required">*</span> sont obligatoires
            </p>
            <div className="admin-courier-modal__actions">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className={ADMIN_BTN_PRIMARY}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Créer le compte
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
