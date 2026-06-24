export function AuthField({
  label,
  error,
  children,
  variant = 'default',
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  variant?: 'default' | 'light';
  className?: string;
}) {
  const labelClass =
    variant === 'light'
      ? 'block text-sm font-medium text-zinc-700'
      : 'block text-[11px] font-bold uppercase tracking-wider text-zinc-500';

  const rootClass = className ? `space-y-1 ${className}` : 'space-y-1.5';

  return (
    <div className={rootClass}>
      <label className={labelClass}>
        {label}
      </label>
      <div className="relative">{children}</div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
