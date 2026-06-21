'use client';

type OnlineIndicatorProps = {
  enLigne: boolean;
  label?: string;
  size?: 'sm' | 'md';
};

export function OnlineIndicator({ enLigne, label, size = 'sm' }: OnlineIndicatorProps) {
  const dot = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <span
        className={`${dot} rounded-full ${enLigne ? 'bg-emerald-500' : 'bg-zinc-300'}`}
        aria-hidden
      />
      {label ?? (enLigne ? 'En ligne' : 'Hors ligne')}
    </span>
  );
}
