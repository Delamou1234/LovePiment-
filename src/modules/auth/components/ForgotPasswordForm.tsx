'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { AuthField } from './AuthField';

const CODE_TTL_MS = 15 * 60 * 1000;
const STORAGE_KEY = 'lovepiment-forgot-password';

const emailSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
});

const codeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{8}$/, 'Entrez les 8 chiffres du code reçu par e-mail'),
});

const codeWithEmailSchema = emailSchema.merge(codeSchema);

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
type CodeWithEmailValues = z.infer<typeof codeWithEmailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

type Step = 'choose' | 'email' | 'code' | 'password' | 'success';
type FlowMode = 'new' | 'existing';

type PersistedForgotPassword = {
  email: string;
  code?: string;
  step: 'code' | 'password';
  flowMode: FlowMode;
  verified: boolean;
  savedAt: number;
};

function loadPersistedProgress(): PersistedForgotPassword | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedForgotPassword;
    if (Date.now() - data.savedAt > CODE_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function savePersistedProgress(data: Omit<PersistedForgotPassword, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...data, savedAt: Date.now() } satisfies PersistedForgotPassword),
  );
}

function clearPersistedProgress() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

function minutesRestantes(savedAt: number): number {
  return Math.max(1, Math.ceil((savedAt + CODE_TTL_MS - Date.now()) / 60_000));
}

const STEP_LABELS = {
  choose: 'Mot de passe oublié',
  email: 'Récupérer votre accès',
  code: 'Vérifier le code',
  password: 'Nouveau mot de passe',
} as const;

const STEP_DESCRIPTIONS = {
  choose:
    'Avez-vous déjà reçu un code par e-mail ? Il reste valable 15 minutes après envoi.',
  email: 'Entrez votre adresse e-mail. Si un compte existe, nous vous enverrons un code à 8 chiffres.',
  code: (email: string) => `Saisissez le code reçu à ${email}. Il expire dans 15 minutes.`,
  codeExisting:
    'Entrez votre e-mail et le code à 8 chiffres reçu. Le code expire 15 minutes après envoi.',
  password: 'Choisissez un nouveau mot de passe sécurisé.',
} as const;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [flowMode, setFlowMode] = useState<FlowMode>('new');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [pendingResume, setPendingResume] = useState<PersistedForgotPassword | null>(null);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeWithEmailValues>({
    resolver: zodResolver(codeWithEmailSchema),
    defaultValues: { email: '', code: '' },
  });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });
  const autoVerifyKeyRef = useRef<string | null>(null);
  const watchedCode = codeForm.watch('code');
  const watchedEmail = codeForm.watch('email');

  useEffect(() => {
    const saved = loadPersistedProgress();
    if (!saved) return;

    setPendingResume(saved);
    setEmail(saved.email);
    emailForm.setValue('email', saved.email);
    codeForm.setValue('email', saved.email);
    if (saved.code) codeForm.setValue('code', saved.code);
    setFlowMode(saved.flowMode);

    if (saved.verified && saved.code) {
      setCode(saved.code);
      setInfoMsg(
        `Reprise possible : votre code pour ${saved.email} est encore valable environ ${minutesRestantes(saved.savedAt)} min.`,
      );
    } else if (saved.step === 'code') {
      setInfoMsg(
        `Un code a peut-être été envoyé à ${saved.email}. Il reste environ ${minutesRestantes(saved.savedAt)} min pour l'utiliser.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement initial sessionStorage
  }, []);

  useEffect(() => {
    if (step === 'code' && flowMode === 'new' && email) {
      codeForm.setValue('email', email);
    }
  }, [step, flowMode, email, codeForm]);

  const goToChoose = () => {
    setStep('choose');
    setErrorMsg('');
    setInfoMsg(
      pendingResume
        ? pendingResume.verified && pendingResume.code
          ? `Reprise possible : votre code pour ${pendingResume.email} est encore valable environ ${minutesRestantes(pendingResume.savedAt)} min.`
          : `Un code a peut-être été envoyé à ${pendingResume.email}. Il reste environ ${minutesRestantes(pendingResume.savedAt)} min pour l'utiliser.`
        : '',
    );
  };

  const startNewCodeFlow = () => {
    setFlowMode('new');
    setErrorMsg('');
    setInfoMsg('');
    if (pendingResume?.email) {
      emailForm.setValue('email', pendingResume.email);
    }
    setStep('email');
  };

  const startExistingCodeFlow = () => {
    setFlowMode('existing');
    setErrorMsg('');
    setInfoMsg('');
    if (pendingResume?.email) {
      codeForm.setValue('email', pendingResume.email);
      setEmail(pendingResume.email);
    }
    setStep('code');
  };

  const resumePasswordStep = () => {
    if (!pendingResume?.verified || !pendingResume.code) return;
    setEmail(pendingResume.email);
    setCode(pendingResume.code);
    setFlowMode(pendingResume.flowMode);
    setErrorMsg('');
    setInfoMsg('');
    setStep('password');
  };

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

      const normalizedEmail = values.email.trim().toLowerCase();
      setEmail(normalizedEmail);
      setFlowMode('new');
      savePersistedProgress({
        email: normalizedEmail,
        step: 'code',
        flowMode: 'new',
        verified: false,
      });
      setPendingResume(loadPersistedProgress());
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

  const onCodeSubmit = useCallback(async (values: CodeWithEmailValues) => {
    setLoading(true);
    setErrorMsg('');

    const targetEmail =
      flowMode === 'existing' ? values.email.trim().toLowerCase() : email;

    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: values.code }),
      });

      const data = await res.json();
      if (!res.ok) {
        autoVerifyKeyRef.current = null;
        setErrorMsg(data.message ?? 'Code incorrect.');
        return;
      }

      setEmail(targetEmail);
      setCode(values.code);
      setInfoMsg('');
      savePersistedProgress({
        email: targetEmail,
        code: values.code,
        step: 'password',
        flowMode,
        verified: true,
      });
      setPendingResume(loadPersistedProgress());
      setStep('password');
    } catch {
      autoVerifyKeyRef.current = null;
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [email, flowMode]);

  useEffect(() => {
    if (step !== 'code' || loading) return;

    const code = (watchedCode ?? '').replace(/\D/g, '');
    if (code.length !== 8) {
      autoVerifyKeyRef.current = null;
      return;
    }

    if (flowMode === 'existing') {
      const emailVal = watchedEmail?.trim() ?? '';
      if (!emailSchema.safeParse({ email: emailVal }).success) return;
    }

    const verifyKey = `${flowMode === 'existing' ? watchedEmail?.trim().toLowerCase() : email}:${code}`;
    if (autoVerifyKeyRef.current === verifyKey) return;
    autoVerifyKeyRef.current = verifyKey;

    void codeForm.handleSubmit(onCodeSubmit)();
  }, [watchedCode, watchedEmail, step, loading, flowMode, email, codeForm, onCodeSubmit]);

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

      clearPersistedProgress();
      setPendingResume(null);
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
    autoVerifyKeyRef.current = null;
    codeForm.setValue('code', '');

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

      savePersistedProgress({
        email,
        step: 'code',
        flowMode: 'new',
        verified: false,
      });
      setPendingResume(loadPersistedProgress());
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
  const showEmailOnCodeStep = flowMode === 'existing';

  return (
    <div className="auth-connexion-card">
      <div className="auth-connexion-card-header">
        <div className="auth-connexion-avatar">
          <KeyRound className="h-7 w-7 text-[#e91e8c]" strokeWidth={1.5} />
        </div>
        <h1 className="auth-connexion-title">{STEP_LABELS[step]}</h1>
        <p className="auth-connexion-subtitle">
          {step === 'code'
            ? showEmailOnCodeStep
              ? STEP_DESCRIPTIONS.codeExisting
              : STEP_DESCRIPTIONS.code(email)
            : STEP_DESCRIPTIONS[step]}
        </p>
      </div>

      {step !== 'choose' && (
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
      )}

      {errorMsg && <div className="auth-connexion-error">{errorMsg}</div>}
      {infoMsg && <div className="auth-connexion-info">{infoMsg}</div>}

      {step === 'choose' && (
        <div className="auth-connexion-form">
          {pendingResume?.verified && pendingResume.code && (
            <button
              type="button"
              onClick={resumePasswordStep}
              className="auth-connexion-submit"
            >
              <RefreshCw className="h-4 w-4" />
              Continuer — définir mon mot de passe
            </button>
          )}

          <button type="button" onClick={startExistingCodeFlow} className="auth-connexion-submit">
            <Hash className="h-4 w-4" />
            Oui, j&apos;ai déjà un code
          </button>

          <button
            type="button"
            onClick={startNewCodeFlow}
            className="auth-forgot-choose-alt"
          >
            <Mail className="h-4 w-4" />
            Non, envoyer un code par e-mail
          </button>

          <BackToLogin />
        </div>
      )}

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

          <div className="auth-connexion-secondary-actions">
            <button type="button" onClick={goToChoose} className="auth-connexion-link-btn is-muted">
              <ArrowLeft className="h-3.5 w-3.5" />
              J&apos;ai déjà un code / autre option
            </button>
          </div>

          <BackToLogin />
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="auth-connexion-form">
          {showEmailOnCodeStep && (
            <AuthField label="Adresse e-mail" error={codeForm.formState.errors.email?.message} variant="light">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Entrez votre adresse e-mail"
                className="auth-connexion-input"
                {...codeForm.register('email')}
              />
            </AuthField>
          )}

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
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  e.target.value = val;
                  codeForm.setValue('code', val, { shouldDirty: true });
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
          <p className="auth-connexion-hint">La vérification se lance automatiquement après les 8 chiffres.</p>

          <div className="auth-connexion-secondary-actions">
            {flowMode === 'new' && (
              <button type="button" onClick={resendCode} disabled={loading} className="auth-connexion-link-btn">
                Renvoyer le code
              </button>
            )}
            <button type="button" onClick={goToChoose} className="auth-connexion-link-btn is-muted">
              <ArrowLeft className="h-3.5 w-3.5" />
              Autre option
            </button>
            {flowMode === 'new' && (
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMsg('');
                  setInfoMsg('');
                  codeForm.setValue('code', '');
                }}
                className="auth-connexion-link-btn is-muted"
              >
                Changer d&apos;e-mail
              </button>
            )}
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

          <div className="auth-connexion-secondary-actions">
            <button type="button" onClick={goToChoose} className="auth-connexion-link-btn is-muted">
              <ArrowLeft className="h-3.5 w-3.5" />
              Autre option
            </button>
          </div>

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
