import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

/** Ancienne route — tout est géré sur /admin/promotions */
export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  redirect(
    params.tab === 'flash'
      ? '/admin/promotions?tab=flash'
      : '/admin/promotions?tab=coupons',
  );
}
