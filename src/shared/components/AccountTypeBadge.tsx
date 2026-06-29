import type { AccountType } from '@/shared/lib/account-type';

type Props = {
  label: string;
  type?: AccountType;
  className?: string;
};

export function AccountTypeBadge({ label, type = 'client', className = '' }: Props) {
  return (
    <span
      className={`lp-account-type-badge lp-account-type-badge--${type} ${className}`.trim()}
      title={`Compte ${label}`}
    >
      {label}
    </span>
  );
}
