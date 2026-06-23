'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, MapPin, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { CompteAvatarUpload } from './CompteAvatarUpload';
import {
  AVATAR_COULEURS,
  type CustomerProfile,
} from '@/modules/compte/types';
import {
  COMPTE_BTN_PRIMARY,
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_INPUT,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
} from './compte-ui';

const profilSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  telephone: z.string().max(30).optional(),
  adressePreferee: z.string().max(300).optional(),
  villePreferee: z.string().max(100).optional(),
});

const passwordSchema = z
  .object({
    ancienMotDePasse: z.string().min(1, 'Requis'),
    nouveauMotDePasse: z.string().min(6, 'Minimum 6 caractères'),
    confirmation: z.string().min(6, 'Requis'),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmation'],
  });

type ProfilFormValues = z.infer<typeof profilSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

type Props = {
  profil: CustomerProfile;
  onProfilUpdate: (p: CustomerProfile) => void;
};

export function CompteProfilForms({ profil, onProfilUpdate }: Props) {
  const [profilMsg, setProfilMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);
  const [savingCouleur, setSavingCouleur] = useState(false);

  const profilForm = useForm<ProfilFormValues>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      nom: profil.nom,
      telephone: profil.telephone ?? '',
      adressePreferee: profil.adressePreferee ?? '',
      villePreferee: profil.villePreferee ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfil = async (values: ProfilFormValues) => {
    setProfilMsg('');
    const res = await fetch('/api/compte/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: values.nom,
        telephone: values.telephone || null,
        adressePreferee: values.adressePreferee || null,
        villePreferee: values.villePreferee || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setProfilMsg(data.message ?? 'Erreur');
      return;
    }
    onProfilUpdate(data.profil);
    setProfilMsg('Profil enregistré avec succès');
  };

  const onChangeCouleur = async (avatarCouleur: string) => {
    if (savingCouleur) return;
    setSavingCouleur(true);
    try {
      const res = await fetch('/api/compte/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarCouleur }),
      });
      if (res.ok) {
        const data = await res.json();
        onProfilUpdate(data.profil);
      }
    } finally {
      setSavingCouleur(false);
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    setPasswordMsg('');
    setPasswordOk(false);
    const res = await fetch('/api/compte/mot-de-passe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setPasswordMsg(data.message ?? 'Erreur');
      return;
    }
    setPasswordOk(true);
    setPasswordMsg('Mot de passe mis à jour');
    passwordForm.reset();
  };

  return (
    <div className="space-y-6">
      <section className={`${COMPTE_CARD} ${COMPTE_CARD_PAD}`}>
        <div className="flex items-start gap-3 mb-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className={COMPTE_SECTION_TITLE}>Photo & personnalisation</h2>
            <p className={COMPTE_SECTION_DESC}>
              Ajoutez votre photo ou choisissez une couleur d&apos;avatar
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-8 mb-8 pb-8 border-b border-beige-border/60">
          <CompteAvatarUpload profil={profil} onProfilUpdate={onProfilUpdate} size="lg" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
          Couleur sans photo
        </p>
        <div className="flex flex-wrap gap-3">
          {AVATAR_COULEURS.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={savingCouleur}
              onClick={() => onChangeCouleur(c.id)}
              className={`relative h-11 w-11 rounded-full transition hover:scale-110 disabled:opacity-50 ${
                profil.avatarCouleur === c.id
                  ? 'ring-2 ring-zinc-900 ring-offset-2 scale-110'
                  : 'ring-1 ring-beige-border'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
              aria-label={c.label}
            />
          ))}
        </div>
      </section>

      <section className={`${COMPTE_CARD} ${COMPTE_CARD_PAD}`}>
        <div className="flex items-start gap-3 mb-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className={COMPTE_SECTION_TITLE}>Informations personnelles</h2>
            <p className={COMPTE_SECTION_DESC}>
              Mettez à jour vos coordonnées pour la livraison et le support
            </p>
          </div>
        </div>
        <form onSubmit={profilForm.handleSubmit(onSaveProfil)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Nom complet
              </label>
              <input {...profilForm.register('nom')} className={COMPTE_INPUT} />
              {profilForm.formState.errors.nom && (
                <p className="mt-1.5 text-xs text-red-600">{profilForm.formState.errors.nom.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Téléphone
              </label>
              <input {...profilForm.register('telephone')} className={COMPTE_INPUT} placeholder="+224 …" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Adresse de livraison préférée
            </label>
            <input
              {...profilForm.register('adressePreferee')}
              className={COMPTE_INPUT}
              placeholder="Quartier, rue, repères…"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Ville
            </label>
            <input {...profilForm.register('villePreferee')} className={COMPTE_INPUT} placeholder="Conakry" />
          </div>
          {profilMsg && (
            <p
              className={`text-sm flex items-center gap-1.5 ${
                profilMsg.includes('succès') ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {profilMsg.includes('succès') && <CheckCircle2 className="h-4 w-4" />}
              {profilMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={profilForm.formState.isSubmitting}
            className={COMPTE_BTN_PRIMARY}
          >
            {profilForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </button>
        </form>
      </section>

      {profil.peutChangerMotDePasse && (
        <section className={`${COMPTE_CARD} ${COMPTE_CARD_PAD}`}>
          <div className="flex items-start gap-3 mb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className={COMPTE_SECTION_TITLE}>Sécurité</h2>
              <p className={COMPTE_SECTION_DESC}>Modifiez votre mot de passe de connexion</p>
            </div>
          </div>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="space-y-5 max-w-md"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Mot de passe actuel
              </label>
              <PasswordInput {...passwordForm.register('ancienMotDePasse')} className={COMPTE_INPUT} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Nouveau mot de passe
              </label>
              <PasswordInput {...passwordForm.register('nouveauMotDePasse')} className={COMPTE_INPUT} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Confirmer le mot de passe
              </label>
              <PasswordInput {...passwordForm.register('confirmation')} className={COMPTE_INPUT} />
              {passwordForm.formState.errors.confirmation && (
                <p className="mt-1.5 text-xs text-red-600">
                  {passwordForm.formState.errors.confirmation.message}
                </p>
              )}
            </div>
            {passwordMsg && (
              <p className={`text-sm flex items-center gap-1.5 ${passwordOk ? 'text-emerald-600' : 'text-red-600'}`}>
                {passwordOk && <CheckCircle2 className="h-4 w-4" />}
                {passwordMsg}
              </p>
            )}
            <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting} className="rounded-full">
              Changer le mot de passe
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
