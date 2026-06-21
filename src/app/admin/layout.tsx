import { redirect } from 'next/navigation';
import { AdminShell } from '@/modules/admin/components/AdminShell';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import { getSession } from '@/shared/lib/auth/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/connexion?redirect=/admin');
  }

  const admin =
    (session.id ? await adminAuthRepository.trouverParId(session.id) : null) ??
    (await adminAuthRepository.trouverParEmail(session.email));

  if (!admin?.actif) {
    redirect('/connexion?redirect=/admin');
  }

  return (
    <AdminShell
      admin={{
        id: admin.id,
        email: admin.email,
        name: admin.nom,
        role: 'admin',
      }}
    >
      {children}
    </AdminShell>
  );
}
