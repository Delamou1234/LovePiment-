'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import {
  BUDGET_OPTIONS,
  PARFUM_OPTIONS,
  PREOCCUPATION_OPTIONS,
  TYPE_PEAU_OPTIONS,
  UNIVERS_OPTIONS,
  type BeautyProfile,
  type BeautyProfileDraft,
  type BudgetBeaute,
  type FamilleParfum,
  type Preoccupation,
  type TypePeau,
  type UniversBeaute,
  isBeautyProfileComplete,
} from '../lib/beauty-profile';

const STEPS = ['Peau', 'Besoins', 'Univers', 'Parfum', 'Budget'] as const;

type Props = {
  initialDraft?: BeautyProfileDraft;
  onComplete: (profile: BeautyProfile) => void;
  onCancel?: () => void;
};

function toggleItem<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function BeautyProfileQuiz({ initialDraft, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BeautyProfileDraft>({
    typePeau: initialDraft?.typePeau,
    preoccupations: initialDraft?.preoccupations ?? [],
    univers: initialDraft?.univers ?? [],
    familleParfum: initialDraft?.familleParfum ?? null,
    budget: initialDraft?.budget,
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const canContinue = () => {
    if (step === 0) return Boolean(draft.typePeau);
    if (step === 1) return (draft.preoccupations?.length ?? 0) > 0;
    if (step === 2) return (draft.univers?.length ?? 0) > 0;
    if (step === 3) return true;
    if (step === 4) return Boolean(draft.budget);
    return false;
  };

  const finish = () => {
    const candidate = {
      ...draft,
      completedAt: new Date().toISOString(),
    };
    if (!isBeautyProfileComplete(candidate)) return;
    onComplete(candidate);
  };

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    finish();
  };

  return (
    <div className="rounded-2xl border border-[#ebe4d8] bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest text-[#4a5240]">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Quiz beauté
          </span>
          <span>
            Étape {step + 1}/{STEPS.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#f0ebe3]">
          <div
            className="h-full rounded-full bg-[#4a5240] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-lg font-black text-zinc-900">{questionTitle(step)}</p>
        <p className="text-sm text-zinc-500">{questionHint(step)}</p>
      </div>

      <div className="min-h-[220px] space-y-3">
        {step === 0 && (
          <OptionGrid
            options={TYPE_PEAU_OPTIONS}
            selected={draft.typePeau}
            onSelect={(id) => setDraft((d) => ({ ...d, typePeau: id as TypePeau }))}
          />
        )}

        {step === 1 && (
          <MultiOptionGrid
            options={PREOCCUPATION_OPTIONS}
            selected={draft.preoccupations ?? []}
            onToggle={(id) =>
              setDraft((d) => ({
                ...d,
                preoccupations: toggleItem(d.preoccupations ?? [], id as Preoccupation),
              }))
            }
          />
        )}

        {step === 2 && (
          <MultiOptionGrid
            options={UNIVERS_OPTIONS}
            selected={draft.univers ?? []}
            onToggle={(id) =>
              setDraft((d) => ({
                ...d,
                univers: toggleItem(d.univers ?? [], id as UniversBeaute),
              }))
            }
          />
        )}

        {step === 3 && (
          <div className="space-y-3">
            <OptionGrid
              options={PARFUM_OPTIONS}
              selected={draft.familleParfum ?? undefined}
              onSelect={(id) =>
                setDraft((d) => ({ ...d, familleParfum: id as FamilleParfum }))
              }
            />
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, familleParfum: null }))}
              className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-[#4a5240] hover:underline"
            >
              Je ne sais pas / pas de préférence
            </button>
          </div>
        )}

        {step === 4 && (
          <OptionGrid
            options={BUDGET_OPTIONS}
            selected={draft.budget}
            onSelect={(id) => setDraft((d) => ({ ...d, budget: id as BudgetBeaute }))}
          />
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe4d8]/80 pt-5">
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#ebe4d8] px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-[#faf7f2]"
            >
              Annuler
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ebe4d8] px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#faf7f2]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={!canContinue()}
          onClick={goNext}
          className="inline-flex items-center gap-2 rounded-full bg-[#4a5240] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3d4436] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === STEPS.length - 1 ? 'Voir mes recommandations' : 'Continuer'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function questionTitle(step: number) {
  switch (step) {
    case 0:
      return 'Quel est votre type de peau ?';
    case 1:
      return 'Quels sont vos besoins principaux ?';
    case 2:
      return 'Quels univers vous intéressent ?';
    case 3:
      return 'Quelle famille de parfum préférez-vous ?';
    default:
      return 'Quel est votre budget habituel ?';
  }
}

function questionHint(step: number) {
  switch (step) {
    case 1:
      return 'Choisissez une ou plusieurs réponses.';
    case 2:
      return 'Sélectionnez tout ce qui vous correspond.';
    case 3:
      return 'Optionnel — vous pouvez passer cette étape.';
    default:
      return 'Une seule réponse suffit.';
  }
}

type SimpleOption = { id: string; label: string; desc?: string };

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: readonly SimpleOption[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`rounded-xl border p-4 text-left transition ${
              active
                ? 'border-[#4a5240] bg-[#f5f2eb] ring-1 ring-[#4a5240]/20'
                : 'border-[#ebe4d8] bg-white hover:border-[#d8d0c4]'
            }`}
          >
            <p className="font-semibold text-zinc-900">{option.label}</p>
            {option.desc && <p className="mt-1 text-sm text-zinc-500">{option.desc}</p>}
          </button>
        );
      })}
    </div>
  );
}

function MultiOptionGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly SimpleOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
              active
                ? 'border-[#4a5240] bg-[#f5f2eb] ring-1 ring-[#4a5240]/20'
                : 'border-[#ebe4d8] bg-white hover:border-[#d8d0c4]'
            }`}
          >
            <span className="font-semibold text-zinc-900">{option.label}</span>
            {active && <Check className="h-4 w-4 shrink-0 text-[#4a5240]" />}
          </button>
        );
      })}
    </div>
  );
}
