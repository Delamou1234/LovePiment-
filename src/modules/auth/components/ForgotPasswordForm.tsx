'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  CheckCircle2,
  Hash,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { AuthField } from './AuthField';

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

const STEP_LABELS = {
  email: 'Récupérer votre accès',
  code: 'Vérifier le code',
  password: 'Nouveau mot de passe',
} as const;

const STEP_DESCRIPTIONS = {
  email: 'Entrez votre adresse e-mail. Si un compte existe, nous vous enverrons un code à 8 chiffres.',
  code: (email: string) => `Saisissez le code reçu à ${email}. Il expire dans 15 minutes.`,
  password: 'Choisissez un nouveau mot de passe sécurisé.',
} as const;

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
        'Si un compte existe avec cet e-mail, le code a été envoyé. Vérifiez aussi les spams.',
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
      setInfoMsg('');
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
        setErrorMsg(data.message ?? 'Impossible de renvoyer le code.');
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
      <div className="auth-connexion-card">
        <div className="auth-connexion-success">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>Mot de passe mis à jour ! Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  const activeStepIndex = ['email', 'code', 'password'].indexOf(step);

  return (
    <div className="auth-connexion-card">
      <div className="auth-connexion-card-header">
        <div className="auth-connexion-avatar">
          <KeyRound className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.5} />
        </div>
        <h1 className="auth-connexion-title">{STEP_LABELS[step]}</h1>
        <p className="auth-connexion-subtitle">
          {step === 'code' ? STEP_DESCRIPTIONS.code(email) : STEP_DESCRIPTIONS[step]}
        </p>
      </div>

      <div className="auth-connexion-steps" aria-hidden>
        {(['email', 'code', 'password'] as const).map((s, i) => (
          <div key={s} className="auth-connexion-step">
            <div
              className={`auth-connexion-step-dot ${
                activeStepIndex === i
                  ? 'is-active'
                  : activeStepIndex > i
                    ? 'is-done'
                    : ''
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="auth-connexion-step-line" />}
          </div>
        ))}
      </div>

      {errorMsg && <div className="auth-connexion-error">{errorMsg}</div>}
      {infoMsg && <div className="auth-connexion-info">{infoMsg}</div>}

      {step === 'email' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="auth-connexion-form">
          <AuthField label="Adresse e-mail" error={emailForm.formState.errors.email?.message} variant="light">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="Entrez votre adresse e-mail"
              className="auth-connexion-input"
              {...emailForm.register('email')}
            />
          </AuthField>

          <button type="submit" disabled={loading} className="auth-connexion-submit">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              'Envoyer le code'
            )}
          </button>

          <BackToLogin />
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="auth-connexion-form">
          <AuthField label="Code à 8 chiffres" error={codeForm.formState.errors.code?.message} variant="light">
            <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="12345678"
              className="auth-connexion-input auth-connexion-input-code"
              {...codeForm.register('code', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
                },
              })}
            />
          </AuthField>

          <button type="submit" disabled={loading} className="auth-connexion-submit">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Vérification…
              </>
            ) : (
              'Vérifier le code'
            )}
          </button>

          <div className="auth-connexion-secondary-actions">
            <button type="button" onClick={resendCode} disabled={loading} className="auth-connexion-link-btn">
              Renvoyer le code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setErrorMsg('');
                setInfoMsg('');
                codeForm.reset();
              }}
              className="auth-connexion-link-btn is-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Changer d&apos;e-mail
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="auth-connexion-form">
          <AuthField
            label="Nouveau mot de passe"
            error={passwordForm.formState.errors.password?.message}
            variant="light"
          >
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="Entrez votre nouveau mot de passe"
              className="auth-connexion-input"
              {...passwordForm.register('password')}
            />
          </AuthField>

          <AuthField
            label="Confirmer le mot de passe"
            error={passwordForm.formState.errors.confirmPassword?.message}
            variant="light"
          >
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
              className="auth-connexion-input"
              {...passwordForm.register('confirmPassword')}
            />
          </AuthField>

          <button type="submit" disabled={loading} className="auth-connexion-submit">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              'Enregistrer le mot de passe'
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
    <p className="auth-connexion-register">
      <Link href="/connexion" className="inline-flex items-center justify-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour à la connexion
      </Link>
    </p>
  );
}
