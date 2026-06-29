'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Shield, Truck, Users } from 'lucide-react';
import { AdminClientsPage } from '@/modules/admin/components/clients/AdminClientsPage';
import { AdminAdminsPanel } from './AdminAdminsPanel';
import { AdminLivreursPanel } from './AdminLivreursPanel';

type Tab = 'clients' | 'livreurs' | 'admins';

type Overview = {
  clients: number;
  livreurs: number;
  admins: number;
  adminsActifs: number;
};

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'livreurs', label: 'Livreurs', icon: Truck },
  { id: 'admins', label: 'Administrateurs', icon: Shield },
];

type Props = {
  currentAdminId: string;
};

export function AdminUtilisateursPage({ currentAdminId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: Tab =
    tabParam === 'livreurs' || tabParam === 'admins' ? tabParam : 'clients';

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/utilisateurs/overview');
      if (res.ok) setOverview(await res.json());
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useRunAfterMount(() => void loadOverview(), [loadOverview]);

  const setTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'clients') params.delete('tab');
    else params.set('tab', tab);
    const q = params.toString();
    router.replace(q ? `/admin/utilisateurs?${q}` : '/admin/utilisateurs', { scroll: false });
  };

  const stats = useMemo(
    () => [
      { label: 'Clients', value: overview?.clients ?? 0 },
      { label: 'Livreurs', value: overview?.livreurs ?? 0 },
      { label: 'Admins actifs', value: overview?.adminsActifs ?? 0 },
    ],
    [overview],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
          <Users className="h-6 w-6" />
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Clients boutique, livreurs et comptes administrateurs.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="admin-users-stat">
            {loadingOverview ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            ) : (
              <p className="admin-users-stat-value">{value}</p>
            )}
            <p className="admin-users-stat-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="admin-users-tabs" role="tablist" aria-label="Types d'utilisateurs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setTab(id)}
            className={`admin-users-tab${activeTab === id ? ' is-active' : ''}`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'clients' && <AdminClientsPage embedded />}
        {activeTab === 'livreurs' && <AdminLivreursPanel />}
        {activeTab === 'admins' && <AdminAdminsPanel currentAdminId={currentAdminId} />}
      </div>
    </div>
  );
}
