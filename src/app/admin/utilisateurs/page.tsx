import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminUtilisateursPage } from '@/modules/admin/components/utilisateurs/AdminUtilisateursPage';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { getAdminSession } from '@/shared/lib/auth/session';

export default async function AdminUtilisateursRoute() {
  const session = await getAdminSession();
  if (!session) redirect('/connexion?redirect=/admin/utilisateurs');

  const admin =
    (session.id ? await adminAuthRepository.trouverParId(session.id) : null) ??
    (await adminAuthRepository.trouverParEmail(session.email));
  if (!admin?.actif) redirect('/connexion?redirect=/admin/utilisateurs');

  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
      <AdminUtilisateursPage currentAdminId={admin.id} />
    </Suspense>
  );
}
