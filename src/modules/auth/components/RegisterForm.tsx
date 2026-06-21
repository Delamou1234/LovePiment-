'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';
import { AuthField } from './AuthField';
import { authInputClass, authSubmitClass } from './auth-styles';
import { SocialLoginButtons, SocialLoginDivider } from './SocialLoginButtons';

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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  isCheckout?: boolean;
  googleEnabled?: boolean;
  facebookEnabled?: boolean;
  appleEnabled?: boolean;
}

export function RegisterForm({
  isCheckout = false,
  googleEnabled = false,
  facebookEnabled = false,
  appleEnabled = false,
}: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = getSafeRedirect(redirectParam, isCheckout ? '/commande' : '/compte');
  const loginHref = `/connexion${redirectParam ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          nom: values.nom,
          telephone: values.telephone,
          redirect: safeRedirect,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Inscription impossible.');
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
      {isCheckout && (
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0eb] border border-[#4a5240]/15 px-3 py-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4a5240] text-[9px] font-bold text-white">
            2
          </span>
          <span className="text-[11px] font-semibold text-[#4a5240]">Créez votre compte client</span>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a5240] mb-2">
          Inscription
        </p>
        <h1 className="font-serif text-2xl font-bold text-zinc-900 leading-tight">
          Créer mon compte
        </h1>
        <p className="mt-2 text-sm text-zinc-500 leading-snug">
          {isCheckout
            ? 'Quelques infos pour finaliser votre commande et suivre votre livraison.'
            : 'Rejoignez KabiShop en moins d’une minute.'}
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
        <AuthField label="Nom complet" error={errors.nom?.message}>
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoComplete="name"
            placeholder="Ex : Diallo Mamadou"
            className={authInputClass}
            {...register('nom')}
          />
        </AuthField>

        <AuthField label="Téléphone" error={errors.telephone?.message}>
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="tel"
            autoComplete="tel"
            placeholder="Ex : 620 00 00 00"
            className={authInputClass}
            {...register('telephone')}
          />
        </AuthField>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <AuthField label="Mot de passe" error={errors.password?.message}>
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="6+ car."
              className={authInputClass}
              {...register('password')}
            />
          </AuthField>

          <AuthField label="Confirmation" error={errors.confirmPassword?.message}>
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Répéter"
              className={authInputClass}
              {...register('confirmPassword')}
            />
          </AuthField>
        </div>

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Création…
            </>
          ) : (
            <>
              {isCheckout ? 'Créer mon compte et payer' : 'Créer mon compte'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Déjà inscrit ?{' '}
        <Link
          href={loginHref}
          className="font-semibold text-[#4a5240] hover:text-[#3d4534] underline-offset-2 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
