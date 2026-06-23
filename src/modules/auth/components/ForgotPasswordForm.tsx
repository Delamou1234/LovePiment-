'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Hash,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { AuthField } from './AuthField';
import { authInputClass, authSubmitClass } from './auth-styles';

const emailSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
});

const codeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{8}$/, 'Entrez les 8 chiffres du code reçu par e-mail'),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Minimum 6 caractères'),
    confirmPassword: z.string().min(6, 'Confirmez votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type EmailValues = z.infer<typeof emailSchema>;
type CodeValues = z.infer<typeof codeSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

type Step = 'email' | 'code' | 'password' | 'success';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema) });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onEmailSubmit = async (values: EmailValues) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? "Impossible d'envoyer le code.");
        return;
      }

      setEmail(values.email.trim().toLowerCase());
      setInfoMsg(
        'Si un compte existe avec cet e-mail, le code a été envoyé. Vérifiez aussi les spams. Utilisez l’e-mail de votre inscription.',
      );
      setStep('code');
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const onCodeSubmit = async (values: CodeValues) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: values.code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Code incorrect.');
        return;
      }

      setCode(values.code);
      setStep('password');
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordValues) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password: values.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Réinitialisation impossible.');
        return;
      }

      setStep('success');
      setTimeout(() => router.replace('/connexion'), 2500);
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setErrorMsg('');
    codeForm.reset();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message ?? "Impossible de renvoyer le code.");
        return;
      }

      setErrorMsg('');
      setInfoMsg('Un nouveau code a été envoyé à votre adresse e-mail.');
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>Mot de passe mis à jour ! Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a5240] mb-2">
          Mot de passe oublié
        </p>
        <h1 className="font-serif text-2xl font-bold text-zinc-900 leading-tight">
          {step === 'email' && 'Récupérer votre accès'}
          {step === 'code' && 'Vérifier le code'}
          {step === 'password' && 'Nouveau mot de passe'}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 leading-snug">
          {step === 'email' &&
            'Entrez votre adresse e-mail. Si un compte existe, nous vous enverrons un code à 8 chiffres.'}
          {step === 'code' &&
            `Saisissez le code reçu à ${email}. Il expire dans 15 minutes.`}
          {step === 'password' && 'Choisissez un nouveau mot de passe sécurisé.'}
        </p>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2">
        {(['email', 'code', 'password'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step === s
                  ? 'bg-[#4a5240] text-white'
                  : ['email', 'code', 'password'].indexOf(step) > i
                    ? 'bg-[#4a5240]/20 text-[#4a5240]'
                    : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="h-px flex-1 bg-zinc-200" />}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {infoMsg}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-3.5">
          <AuthField label="E-mail" error={emailForm.formState.errors.email?.message}>
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              className={authInputClass}
              {...emailForm.register('email')}
            />
          </AuthField>

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                Envoyer le code
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <BackToLogin />
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-3.5">
          <AuthField label="Code à 8 chiffres" error={codeForm.formState.errors.code?.message}>
            <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="12345678"
              className={`${authInputClass} tracking-[0.3em] font-mono text-center`}
              {...codeForm.register('code', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
                },
              })}
            />
          </AuthField>

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Vérification…
              </>
            ) : (
              <>
                Vérifier le code
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <div className="flex flex-col items-center gap-2 text-sm text-zinc-500">
            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="font-semibold text-[#4a5240] hover:text-[#3d4534] disabled:opacity-50"
            >
              Renvoyer le code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setErrorMsg('');
                codeForm.reset();
              }}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Changer d&apos;e-mail
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3.5">
          <AuthField label="Nouveau mot de passe" error={passwordForm.formState.errors.password?.message}>
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              className={authInputClass}
              {...passwordForm.register('password')}
            />
          </AuthField>

          <AuthField
            label="Confirmer le mot de passe"
            error={passwordForm.formState.errors.confirmPassword?.message}
          >
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              className={authInputClass}
              {...passwordForm.register('confirmPassword')}
            />
          </AuthField>

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                Enregistrer le mot de passe
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <BackToLogin />
        </form>
      )}
    </div>
  );
}

function BackToLogin() {
  return (
    <p className="text-center text-sm text-zinc-500">
      <Link
        href="/connexion"
        className="inline-flex items-center gap-1 font-semibold text-[#4a5240] hover:text-[#3d4534]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour à la connexion
      </Link>
    </p>
  );
}
