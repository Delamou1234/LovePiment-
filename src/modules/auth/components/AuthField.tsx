export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="relative">{children}</div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
