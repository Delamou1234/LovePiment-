'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { getSafeRedirect, isAdminRedirect } from '@/shared/lib/auth-redirect';
import { AuthField } from './AuthField';
import { authInputClass, authSubmitClass } from './auth-styles';
import { SocialLoginButtons, SocialLoginDivider } from './SocialLoginButtons';

const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Mot de passe : minimum 6 caractères'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  variant?: 'customer' | 'admin';
  googleEnabled?: boolean;
  facebookEnabled?: boolean;
  appleEnabled?: boolean;
  isCheckout?: boolean;
  initialError?: string;
}

export function LoginForm({
  variant = 'customer',
  googleEnabled = false,
  facebookEnabled = false,
  appleEnabled = false,
  isCheckout = false,
  initialError,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const isAdmin = variant === 'admin' || isAdminRedirect(redirectParam);
  const defaultRedirect = isAdmin ? '/admin' : isCheckout ? '/commande' : '/compte';
  const safeRedirect = getSafeRedirect(redirectParam, defaultRedirect);
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
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          redirect: safeRedirect,
          mode: isAdmin ? 'admin' : 'customer',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Connexion impossible.');
        return;
      }

      router.push(data.redirect ?? safeRedirect);
      router.refresh();
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-5">
      {!isAdmin && isCheckout && (
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0eb] border border-[#4a5240]/15 px-3 py-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4a5240] text-[9px] font-bold text-white">
            2
          </span>
          <span className="text-[11px] font-semibold text-[#4a5240]">Connexion client</span>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a5240] mb-2">
          {isAdmin ? 'Administration' : 'Connexion'}
        </p>
        <h1 className="font-serif text-2xl font-bold text-zinc-900 leading-tight">
          {isAdmin ? 'Connexion admin' : isCheckout ? 'Connectez-vous pour payer' : 'Bon retour'}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 leading-snug">
          {isAdmin
            ? 'Accédez au back-office KabiShop.'
            : 'Entrez vos identifiants pour continuer.'}
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {!isAdmin && (googleEnabled || facebookEnabled || appleEnabled) && (
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
            placeholder={isAdmin ? 'admin@kabishop.com' : 'vous@exemple.com'}
            className={authInputClass}
            {...register('email')}
          />
        </AuthField>

        <AuthField label="Mot de passe" error={errors.password?.message}>
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={authInputClass}
            {...register('password')}
          />
        </AuthField>

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

      {!isAdmin && (
        <p className="text-center text-sm text-zinc-500">
          Pas encore de compte ?{' '}
          <Link
            href={registerHref}
            className="font-semibold text-[#4a5240] hover:text-[#3d4534] underline-offset-2 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
        <Lock className="h-3 w-3 shrink-0" />
        Connexion sécurisée · Panier conservé
      </p>
    </div>
  );
}
