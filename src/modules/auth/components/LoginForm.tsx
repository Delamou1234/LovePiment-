'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, User, Heart } from 'lucide-react';
import {
  getPostLoginRedirect,
  getSafeRedirectForCustomer,
  isCheckoutRedirect,
} from '@/shared/lib/auth-redirect';
import { seedAuthSessionAfterLogin } from '@/shared/lib/auth/auth-session-user';
import { AuthField } from './AuthField';
import { PasswordInput } from '@/shared/components/PasswordInput';
import {
  SocialLoginButtons,
  SocialLoginDivider,
} from './SocialLoginButtons';
import type { SocialAuthProviders } from '@/shared/lib/auth/social-providers';
import { hasAnySocialProvider } from '@/shared/lib/auth/social-providers';

const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Mot de passe : minimum 6 caractères'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  isCheckout?: boolean;
  initialError?: string;
  socialProviders?: SocialAuthProviders;
}

export function LoginForm({
  isCheckout = false,
  initialError,
  socialProviders,
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const defaultRedirect = isCheckoutRedirect(redirectParam) ? '/commande' : '/compte';
  const safeRedirect = getSafeRedirectForCustomer(redirectParam, defaultRedirect);
  const registerHref = `/inscription${redirectParam ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`;
  const showSocial = socialProviders && hasAnySocialProvider(socialProviders);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          redirect: redirectParam ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Connexion impossible.');
        return;
      }

      const role = data.role as 'admin' | 'customer' | 'courier' | undefined;
      if (data.user) seedAuthSessionAfterLogin(data.user);
      const target = role
        ? getPostLoginRedirect(role, redirectParam ?? data.redirect)
        : (data.redirect ?? safeRedirect);
      window.location.assign(target);
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-connexion-card">
      {isCheckout && (
        <div className="auth-connexion-checkout-badge">
          <span className="auth-connexion-checkout-step">2</span>
          <span>Connexion avant paiement</span>
        </div>
      )}

      <div className="auth-connexion-card-header">
        <div className="auth-connexion-avatar">
          <User className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.5} />
        </div>
        <h1 className="auth-connexion-title">Connexion</h1>
        <p className="auth-connexion-subtitle">
          {isCheckout ? 'Connectez-vous pour finaliser votre commande' : (
            <>
              Bienvenue de retour !
              <Heart className="inline-block h-3 w-3 text-[#e91e8c] fill-[#fce7f3] ml-1 -mt-0.5" strokeWidth={1.75} />
            </>
          )}
        </p>
      </div>

      {errorMsg && (
        <div className="auth-connexion-error">{errorMsg}</div>
      )}

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

      <form onSubmit={handleSubmit(onSubmit)} className="auth-connexion-form">
        <AuthField label="Adresse e-mail" error={errors.email?.message} variant="light">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="email"
            autoComplete="email"
            placeholder="Entrez votre adresse e-mail"
            className="auth-connexion-input"
            {...register('email')}
          />
        </AuthField>

        <AuthField label="Mot de passe" error={errors.password?.message} variant="light">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <PasswordInput
            autoComplete="current-password"
            placeholder="Entrez votre mot de passe"
            className="auth-connexion-input"
            {...register('password')}
          />
        </AuthField>

        <div className="auth-connexion-forgot">
          <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>

        <button type="submit" disabled={loading} className="auth-connexion-submit">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion…
            </>
          ) : (
            isCheckout ? 'Continuer vers le paiement' : 'Se connecter'
          )}
        </button>
      </form>

      <p className="auth-connexion-register">
        Vous n&apos;avez pas de compte ?{' '}
        <Link href={registerHref}>S&apos;inscrire</Link>
      </p>
    </div>
  );
}
