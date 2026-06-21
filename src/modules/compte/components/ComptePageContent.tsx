'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Gift,
  CheckCircle2,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Shield,
  MessageSquare,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompteAdressesSection } from './CompteAdressesSection';
import { CompteWishlistSection } from './CompteWishlistSection';
import { CompteFideliteSection } from '@/modules/marketing/components/CompteFideliteSection';
import { CompteAvisSection } from '@/modules/avis/components/CompteAvisSection';
import {
  AVATAR_COULEURS,
  couleurAvatar,
  initialesNom,
  type CustomerOrderResume,
  type CustomerProfile,
} from '@/modules/compte/types';

const inputClass =
  'w-full rounded-xl border border-[#ebe4d8] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a5240] focus:ring-2 focus:ring-[#4a5240]/10';

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

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  PAYEE: 'Payée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

function AvatarDisplay({
  profil,
  size = 'lg',
}: {
  profil: CustomerProfile;
  size?: 'lg' | 'sm';
}) {
  const dim = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-10 w-10 text-sm';
  const bg = couleurAvatar(profil.avatarCouleur);

  if (profil.avatarUrl && (profil.viaGoogle || profil.viaFacebook || profil.viaApple)) {
    return (
      <Image
        src={profil.avatarUrl}
        alt={profil.nom}
        width={80}
        height={80}
        className={`${dim} rounded-full object-cover ring-4 ring-white shadow`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full font-bold text-white ring-4 ring-white shadow`}
      style={{ backgroundColor: bg }}
    >
      {initialesNom(profil.nom) || '?'}
    </div>
  );
}

export function ComptePageContent() {
  const router = useRouter();
  const [section, setSection] = useState<
    'profil' | 'commandes' | 'adresses' | 'favoris' | 'fidelite' | 'avis'
  >('profil');
  const [profil, setProfil] = useState<CustomerProfile | null>(null);
  const [commandes, setCommandes] = useState<CustomerOrderResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilMsg, setProfilMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);
  const [savingCouleur, setSavingCouleur] = useState(false);

  const profilForm = useForm<ProfilFormValues>({ resolver: zodResolver(profilSchema) });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profilRes, cmdRes] = await Promise.all([
        fetch('/api/compte/profil'),
        fetch('/api/compte/commandes'),
      ]);
      if (profilRes.status === 401) {
        router.push('/connexion?redirect=/compte');
        return;
      }
      if (profilRes.ok) {
        const data = await profilRes.json();
        const p = data.profil as CustomerProfile;
        setProfil(p);
        profilForm.reset({
          nom: p.nom,
          telephone: p.telephone ?? '',
          adressePreferee: p.adressePreferee ?? '',
          villePreferee: p.villePreferee ?? '',
        });
      }
      if (cmdRes.ok) {
        const data = await cmdRes.json();
        setCommandes(data.commandes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [profilForm, router]);

  useEffect(() => {
    load();
  }, [load]);

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
    setProfil(data.profil);
    setProfilMsg('Profil enregistré');
    router.refresh();
  };

  const onChangeCouleur = async (avatarCouleur: string) => {
    if (!profil || savingCouleur) return;
    setSavingCouleur(true);
    try {
      const res = await fetch('/api/compte/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarCouleur }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfil(data.profil);
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading || !profil) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="container-kabishop py-10 md:py-14 animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête profil */}
        <div className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <AvatarDisplay profil={profil} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4a5240] mb-1">
                Mon compte
              </p>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900 truncate">
                {profil.nom}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">{profil.email}</p>
              <p className="text-xs text-zinc-400 mt-2">
                Membre depuis{' '}
                {new Intl.DateTimeFormat('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(profil.inscritLe))}
                {profil.viaGoogle && ' · Google'}
                {profil.viaFacebook && ' · Facebook'}
                {profil.viaApple && ' · Apple'}
              </p>
            </div>
            <div className="flex gap-6 text-center sm:text-right">
              <div>
                <p className="text-2xl font-bold text-zinc-900">{profil.stats.commandes}</p>
                <p className="text-xs text-zinc-500">Commandes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#4a5240]">
                  {profil.stats.totalDepense.toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-zinc-500">GN dépensés</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 border-b border-[#ebe4d8] pb-1">
          {(
            [
              { id: 'profil', label: 'Profil', icon: User },
              { id: 'commandes', label: 'Commandes', icon: Package },
              { id: 'adresses', label: 'Adresses', icon: MapPin },
              { id: 'favoris', label: 'Favoris', icon: Heart },
              { id: 'fidelite', label: 'Fidélité', icon: Gift },
              { id: 'avis', label: 'Mes avis', icon: MessageSquare },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                section === id
                  ? 'bg-[#4a5240] text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {section === 'profil' && (
          <>
        {/* Personnalisation avatar */}
        <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#4a5240]" />
            Personnalisation
          </h2>
          <p className="text-sm text-zinc-600 mb-4">Couleur de votre avatar (initiales)</p>
          <div className="flex flex-wrap gap-3">
            {AVATAR_COULEURS.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={savingCouleur}
                onClick={() => onChangeCouleur(c.id)}
                className={`h-10 w-10 rounded-full transition ring-offset-2 hover:scale-110 ${
                  profil.avatarCouleur === c.id
                    ? 'ring-2 ring-zinc-900 scale-110'
                    : 'ring-1 ring-transparent'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
        </section>

        {/* Informations */}
        <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-[#4a5240]" />
            Informations personnelles
          </h2>
          <form onSubmit={profilForm.handleSubmit(onSaveProfil)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Nom</label>
                <input {...profilForm.register('nom')} className={inputClass} />
                {profilForm.formState.errors.nom && (
                  <p className="mt-1 text-xs text-red-600">
                    {profilForm.formState.errors.nom.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Téléphone
                </label>
                <input {...profilForm.register('telephone')} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Adresse de livraison préférée
              </label>
              <input
                {...profilForm.register('adressePreferee')}
                className={inputClass}
                placeholder="Quartier, rue, repères…"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Ville</label>
              <input
                {...profilForm.register('villePreferee')}
                className={inputClass}
                placeholder="Conakry"
              />
            </div>
            {profilMsg && (
              <p
                className={`text-sm ${profilMsg.includes('enregistré') ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {profilMsg}
              </p>
            )}
            <Button
              type="submit"
              disabled={profilForm.formState.isSubmitting}
              className="bg-[#4a5240] hover:bg-[#3d4534] text-white"
            >
              {profilForm.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Enregistrer
            </Button>
          </form>
        </section>

        {/* Mot de passe */}
        {profil.peutChangerMotDePasse && (
          <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-[#4a5240]" />
              Sécurité
            </h2>
            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  {...passwordForm.register('ancienMotDePasse')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  {...passwordForm.register('nouveauMotDePasse')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Confirmer
                </label>
                <input
                  type="password"
                  {...passwordForm.register('confirmation')}
                  className={inputClass}
                />
                {passwordForm.formState.errors.confirmation && (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordForm.formState.errors.confirmation.message}
                  </p>
                )}
              </div>
              {passwordMsg && (
                <p className={`text-sm flex items-center gap-1 ${passwordOk ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passwordOk && <CheckCircle2 className="h-4 w-4" />}
                  {passwordMsg}
                </p>
              )}
              <Button
                type="submit"
                variant="outline"
                disabled={passwordForm.formState.isSubmitting}
              >
                Changer le mot de passe
              </Button>
            </form>
          </section>
        )}

          </>
        )}

        {section === 'commandes' && (
        <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-[#4a5240]" />
            Mes commandes
          </h2>
          {commandes.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aucune commande pour le moment.{' '}
              <Link href="/produits" className="text-[#4a5240] font-medium hover:underline">
                Découvrir la boutique
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-[#ebe4d8]">
              {commandes.map((cmd) => (
                <li key={cmd.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">
                      Commande #{cmd.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }).format(new Date(cmd.createdAt))}
                      {' · '}
                      {cmd.itemsCount} article{cmd.itemsCount > 1 ? 's' : ''}
                      {' · '}
                      {STATUT_LABELS[cmd.statut] ?? cmd.statut}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#4a5240]">
                      {cmd.montantTotal.toLocaleString('fr-FR')} GN
                    </span>
                    {cmd.suiviToken && (
                      <Link
                        href={`/suivi/${cmd.suiviToken}`}
                        className="text-xs font-medium text-[#4a5240] hover:underline"
                      >
                        Suivre →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {section === 'adresses' && <CompteAdressesSection />}

        {section === 'favoris' && <CompteWishlistSection />}

        {section === 'fidelite' && (
          <CompteFideliteSection
            pointsFidelite={profil.pointsFidelite}
            codeParrainage={profil.codeParrainage}
          />
        )}

        {section === 'avis' && <CompteAvisSection />}

        {/* Déconnexion */}
        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
