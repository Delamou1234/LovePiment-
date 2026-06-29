import { redirect } from 'next/navigation';

/** Ancienne route — redirige vers la gestion unifiée des utilisateurs */
export default async function AdminClientsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const target = q
    ? `/admin/utilisateurs?tab=clients&q=${encodeURIComponent(q)}`
    : '/admin/utilisateurs?tab=clients';
  redirect(target);
}
