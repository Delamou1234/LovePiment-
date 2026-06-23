'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useAuthSession } from '@/shared/providers/AuthSessionProvider';
import { BeautyProfileQuiz } from './BeautyProfileQuiz';
import {
  BEAUTY_PROFILE_UPDATED_EVENT,
  type BeautyProfile,
  enregistrerProfilBeauteLocal,
  lireProfilBeauteLocal,
  resumeProfilBeaute,
} from '../lib/beauty-profile';

export function BeautyProfilePage() {
  const { user, loading: authLoading } = useAuthSession();
  const [profile, setProfile] = useState<BeautyProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const refreshLocal = useCallback(() => {
    setProfile(lireProfilBeauteLocal());
  }, []);

  useEffect(() => {
    refreshLocal();
    setHydrated(true);

    const onUpdate = () => refreshLocal();
    window.addEventListener(BEAUTY_PROFILE_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(BEAUTY_PROFILE_UPDATED_EVENT, onUpdate);
  }, [refreshLocal]);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/compte/beauty-profile');
        if (!res.ok) return;
        const data = await res.json();
        const serverProfile = data.profile as BeautyProfile | null;
        if (!serverProfile || cancelled) return;

        const local = lireProfilBeauteLocal();
        const serverTime = new Date(serverProfile.completedAt).getTime();
        const localTime = local ? new Date(local.completedAt).getTime() : 0;

        if (!local || serverTime >= localTime) {
          enregistrerProfilBeauteLocal(serverProfile);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const syncToServer = async (next: BeautyProfile) => {
    if (!user) return;
    setSyncing(true);
    try {
      await fetch('/api/compte/beauty-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: next }),
      });
    } catch {
      /* local copy remains */
    } finally {
      setSyncing(false);
    }
  };

  const handleComplete = async (next: BeautyProfile) => {
    enregistrerProfilBeauteLocal(next);
    setProfile(next);
    setEditing(false);
    setSavedMsg('Profil enregistré ! Vos recommandations sont personnalisées.');
    await syncToServer(next);
    window.setTimeout(() => setSavedMsg(''), 4000);
  };

  if (!hydrated) {
    return (
      <div className="container-kabishop flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#4a5240]" />
      </div>
    );
  }

  const showQuiz = editing || !profile;
  const resume = profile ? resumeProfilBeaute(profile) : null;

  return (
    <div className="animate-fadeIn bg-[#faf7f2]">
      <section className="border-b border-[#ebe4d8]/60 bg-white">
        <div className="container-kabishop py-12 md:py-16">
          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#4a5240]">
            <Sparkles className="h-3.5 w-3.5" />
            Personnalisation
          </p>
          <h1 className="max-w-2xl text-3xl font-black text-zinc-900 md:text-4xl">
            Votre profil beauté
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-600 md:text-lg">
            Répondez à quelques questions pour recevoir des recommandations adaptées à votre peau,
            vos envies et votre budget. Accessible à tous, avec ou sans compte.
          </p>
          {!user && (
            <p className="mt-3 text-sm text-zinc-500">
              <Link href="/connexion?redirect=/profil-beaute" className="font-semibold text-[#4a5240] hover:underline">
                Connectez-vous
              </Link>{' '}
              pour sauvegarder votre profil sur tous vos appareils.
            </p>
          )}
        </div>
      </section>

      <section className="container-kabishop py-10 md:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          {savedMsg && (
            <div className="rounded-xl border border-[#c5d4b8] bg-[#f0f5eb] px-4 py-3 text-sm font-medium text-[#3d4a35]">
              {savedMsg}
            </div>
          )}

          {syncing && (
            <p className="text-center text-sm text-zinc-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Synchronisation du profil…
            </p>
          )}

          {!showQuiz && resume && (
            <div className="rounded-2xl border border-[#ebe4d8] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-zinc-900">Votre profil actuel</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Utilisé pour vos recommandations sur le site.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ebe4d8] px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#faf7f2]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refaire le quiz
                </button>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <SummaryItem label="Type de peau" value={resume.typePeau} />
                <SummaryItem label="Budget" value={resume.budget} />
                <SummaryItem label="Univers" value={resume.univers.join(', ')} />
                <SummaryItem label="Besoins" value={resume.preoccupations.join(', ')} />
                {resume.familleParfum && (
                  <SummaryItem label="Parfum" value={resume.familleParfum} />
                )}
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/produits"
                  className="inline-flex items-center rounded-full bg-[#4a5240] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3d4436]"
                >
                  Voir la boutique
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[#ebe4d8] px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#faf7f2]"
                >
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
          )}

          {showQuiz && (
            <BeautyProfileQuiz
              initialDraft={profile ?? undefined}
              onComplete={handleComplete}
              onCancel={profile ? () => setEditing(false) : undefined}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#faf7f2] p-4">
      <dt className="text-[11px] font-bold uppercase tracking-widest text-[#4a5240]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}
