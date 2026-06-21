'use client';

import { Star } from 'lucide-react';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
};

const sizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StarRating({ value, onChange, size = 'md', showValue = false }: Props) {
  const interactive = Boolean(onChange);
  const dim = sizes[size];

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'} disabled:cursor-default`}
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`${dim} ${filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
            />
          </button>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1.5 text-sm font-semibold text-zinc-700">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
