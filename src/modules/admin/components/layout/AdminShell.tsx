'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminMobileNav, AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { AdminMessagerieProvider, useAdminMessagerieContext } from './AdminMessagerieProvider';
import { ADMIN_MAIN, ADMIN_MAIN_SCROLL, ADMIN_SHELL, type AdminSessionUser } from '../admin-ui';
import { AdminStatsProvider, useAdminStats } from './AdminStatsProvider';
import { AdminStockAlertBanner } from './AdminStockAlertBanner';
import { AdminStockAlertModal } from './AdminStockAlertModal';
import { confirmLogout } from '@/shared/lib/confirm-logout';

type Props = {
  admin: AdminSessionUser;
  children: React.ReactNode;
};

function AdminShellInner({ admin, children }: Props) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { conversations, totalUnread } = useAdminMessagerieContext();
  const { stats } = useAdminStats();

  const handleLogout = async () => {
    if (!(await confirmLogout('admin'))) return;
    await fetch('/api/auth/logout?role=admin', { method: 'POST', credentials: 'include' });
    router.replace('/');
  };

  return (
    <div className={`${ADMIN_SHELL} animate-fadeIn`}>
      <AdminSidebar
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        messagerieUnread={totalUnread}
      />

      <div className={ADMIN_MAIN}>
        <AdminMobileNav
          onMenuOpen={() => setMobileMenuOpen(true)}
          messagerieUnread={totalUnread}
        />
        <AdminTopBar
          admin={admin}
          onLogout={handleLogout}
          conversations={conversations}
          messagerieUnread={totalUnread}
          stockFaible={stats?.stockFaible ?? 0}
        />
        <AdminStockAlertBanner count={stats?.stockFaible ?? 0} />
        <AdminStockAlertModal count={stats?.stockFaible ?? 0} />
        <div className={ADMIN_MAIN_SCROLL}>{children}</div>
      </div>
    </div>
  );
}

export function AdminShell({ admin, children }: Props) {
  return (
    <AdminMessagerieProvider>
      <AdminStatsProvider>
        <AdminShellInner admin={admin}>{children}</AdminShellInner>
      </AdminStatsProvider>
    </AdminMessagerieProvider>
  );
}
