'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Loader2, Lock, Mail, Phone, User, UserPlus, Users } from 'lucide-react';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';
import { seedAuthSessionAfterLogin } from '@/shared/lib/auth/auth-session-user';
import { PARRAINAGE_SESSION_KEY } from '@/modules/marketing/lib/referral-code';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { AuthField } from './AuthField';
import { PasswordInput } from '@/shared/components/PasswordInput';
import {
  SocialLoginButtons,
  SocialLoginDivider,
} from './SocialLoginButtons';
import type { SocialAuthProviders } from '@/shared/lib/auth/social-providers';
import { hasAnySocialProvider } from '@/shared/lib/auth/social-providers';

const registerSchema = z
  .object({
    nom: z.string().min(2, 'Nom complet requis (2 caractères min.)'),
    telephone: z
      .string()
      .min(9, 'Numéro invalide')
      .max(20, 'Numéro trop long')
      .regex(/^[\d\s+()-]+$/, 'Format téléphone invalide'),
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(6, 'Minimum 6 caractères'),
    confirmPassword: z.string().min(6, 'Confirmez votre mot de passe'),
    codeParrainage: z.string().max(40).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  isCheckout?: boolean;
  socialProviders?: SocialAuthProviders;
}

export function RegisterForm({
  isCheckout = false,
  socialProviders,
}: RegisterFormProps) {
  const { parrainageActif } = useFeatureFlags();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const parrainParam = searchParams.get('parrain')?.trim().toUpperCase() ?? '';
  const safeRedirect = getSafeRedirect(redirectParam, isCheckout ? '/commande' : '/compte');
  const loginHref = `/connexion${redirectParam ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`;
  const showSocial = socialProviders && hasAnySocialProvider(socialProviders);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (parrainParam && parrainageActif) {
      sessionStorage.setItem(PARRAINAGE_SESSION_KEY, parrainParam);
    }
  }, [parrainParam, parrainageActif]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      codeParrainage: parrainParam,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          nom: values.nom,
          telephone: values.telephone,
          redirect: safeRedirect,
          codeParrainage: parrainageActif ? values.codeParrainage?.trim() || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Inscription impossible.');
        return;
      }
      if (data.user) seedAuthSessionAfterLogin(data.user);
      const target = data.redirect ?? safeRedirect;
      window.location.assign(target);
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-connexion-card auth-connexion-card--register">
      {isCheckout && (
        <div className="auth-connexion-checkout-badge">
          <span className="auth-connexion-checkout-step">2</span>
          <span>Créez votre compte client</span>
        </div>
      )}

      <div className="auth-connexion-card-header auth-connexion-card-header--compact">
        <div className="auth-connexion-avatar auth-connexion-avatar--compact">
          <UserPlus className="h-5 w-5 text-[#e91e8c]" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h1 className="auth-connexion-title">Inscription</h1>
          <p className="auth-connexion-subtitle">
            {isCheckout ? (
              'Finalisez votre commande'
            ) : (
              <>
                Bienvenue chez Love Piment& !
                <Heart className="inline-block h-3 w-3 text-[#e91e8c] fill-[#fce7f3] ml-1 -mt-0.5" strokeWidth={1.75} />
              </>
            )}
          </p>
        </div>
      </div>

      {errorMsg && <div className="auth-connexion-error auth-connexion-error--compact">{errorMsg}</div>}

      {showSocial && socialProviders && (
        <>
          <SocialLoginButtons
            redirect={safeRedirect}
            googleEnabled={socialProviders.google}
            facebookEnabled={socialProviders.facebook}
            appleEnabled={socialProviders.apple}
          />
          <SocialLoginDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="auth-connexion-form auth-connexion-form--register">
        <div className="auth-connexion-form-grid">
          <AuthField label="Nom complet" error={errors.nom?.message} variant="light" className="auth-connexion-field--compact">
            <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Nom complet"
              className="auth-connexion-input auth-connexion-input--compact"
              {...register('nom')}
            />
          </AuthField>

          <AuthField label="Téléphone" error={errors.telephone?.message} variant="light" className="auth-connexion-field--compact">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="tel"
              autoComplete="tel"
              placeholder="620 00 00 00"
              className="auth-connexion-input auth-connexion-input--compact"
              {...register('telephone')}
            />
          </AuthField>

          <AuthField
            label="Adresse e-mail"
            error={errors.email?.message}
            variant="light"
            className="auth-connexion-field--compact auth-connexion-field--full"
          >
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="Entrez votre adresse e-mail"
              className="auth-connexion-input auth-connexion-input--compact"
              {...register('email')}
            />
          </AuthField>

          {parrainageActif && (
            <AuthField
              label="Code parrainage (optionnel)"
              error={errors.codeParrainage?.message}
              variant="light"
              className="auth-connexion-field--compact auth-connexion-field--full"
            >
              <Users className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Ex : KABI4X2YZ"
                className="auth-connexion-input auth-connexion-input--compact uppercase"
                {...register('codeParrainage')}
              />
            </AuthField>
          )}

          <AuthField label="Mot de passe" error={errors.password?.message} variant="light" className="auth-connexion-field--compact">
            <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="6 car. min."
              className="auth-connexion-input auth-connexion-input--compact"
              {...register('password')}
            />
          </AuthField>

          <AuthField label="Confirmation" error={errors.confirmPassword?.message} variant="light" className="auth-connexion-field--compact">
            <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="Répéter"
              className="auth-connexion-input auth-connexion-input--compact"
              {...register('confirmPassword')}
            />
          </AuthField>
        </div>

        <button type="submit" disabled={loading} className="auth-connexion-submit auth-connexion-submit--compact">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Création…
            </>
          ) : (
            isCheckout ? 'Créer mon compte et payer' : 'Créer mon compte'
          )}
        </button>
      </form>

      <p className="auth-connexion-register auth-connexion-register--compact">
        Déjà inscrite ?{' '}
        <Link href={loginHref}>Se connecter</Link>
      </p>
    </div>
  );
}
