'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import {
  getPostLoginRedirect,
  getSafeRedirectForCustomer,
  isCheckoutRedirect,
} from '@/shared/lib/auth-redirect';
import { AuthField } from './AuthField';
import { authInputClass, authSubmitClass } from './auth-styles';
import { SocialLoginButtons, SocialLoginDivider } from './SocialLoginButtons';
import { PasswordInput } from '@/shared/components/PasswordInput';

const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Mot de passe : minimum 6 caractères'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  googleEnabled?: boolean;
  facebookEnabled?: boolean;
  appleEnabled?: boolean;
  isCheckout?: boolean;
  initialError?: string;
}

export function LoginForm({
  googleEnabled = false,
  facebookEnabled = false,
  appleEnabled = false,
  isCheckout = false,
  initialError,
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const defaultRedirect = isCheckoutRedirect(redirectParam) ? '/commande' : '/compte';
  const safeRedirect = getSafeRedirectForCustomer(redirectParam, defaultRedirect);
  const registerHref = `/inscription${redirectParam ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`;

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
    <div className="space-y-5">
      {isCheckout && (
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0eb] border border-[#4a5240]/15 px-3 py-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4a5240] text-[9px] font-bold text-white">
            2
          </span>
          <span className="text-[11px] font-semibold text-[#4a5240]">Connexion</span>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a5240] mb-2">
          Connexion
        </p>
        <h1 className="font-serif text-2xl font-bold text-zinc-900 leading-tight">
          {isCheckout ? 'Connectez-vous pour payer' : 'Bon retour'}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 leading-snug">
          Utilisez vos identifiants client, admin ou livreur — vous serez redirigé vers votre espace.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {(googleEnabled || facebookEnabled || appleEnabled) && (
        <>
          <SocialLoginButtons
            redirect={safeRedirect}
            googleEnabled={googleEnabled}
            facebookEnabled={facebookEnabled}
            appleEnabled={appleEnabled}
          />
          <SocialLoginDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <AuthField label="E-mail" error={errors.email?.message}>
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className={authInputClass}
            {...register('email')}
          />
        </AuthField>

        <AuthField label="Mot de passe" error={errors.password?.message}>
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <PasswordInput
            autoComplete="current-password"
            placeholder="••••••••"
            className={authInputClass}
            {...register('password')}
          />
        </AuthField>

        <div className="flex justify-end -mt-1">
          <Link
            href="/mot-de-passe-oublie"
            className="text-xs font-medium text-[#4a5240] hover:text-[#3d4534] underline-offset-2 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion…
            </>
          ) : (
            <>
              {isCheckout ? 'Continuer vers le paiement' : 'Se connecter'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Pas encore de compte client ?{' '}
        <Link
          href={registerHref}
          className="font-semibold text-[#4a5240] hover:text-[#3d4534] underline-offset-2 hover:underline"
        >
          Créer un compte
        </Link>
      </p>

      <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
        <Lock className="h-3 w-3 shrink-0" />
        Connexion sécurisée · Panier conservé
      </p>
    </div>
  );
}
