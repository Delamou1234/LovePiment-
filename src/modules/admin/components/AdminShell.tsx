'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminMobileNav, AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { AdminMessagerieProvider, useAdminMessagerieContext } from './AdminMessagerieProvider';
import { ADMIN_MAIN, ADMIN_MAIN_SCROLL, ADMIN_SHELL, type AdminSessionUser } from './admin-ui';

type Props = {
  admin: AdminSessionUser;
  children: React.ReactNode;
};

function AdminShellInner({ admin, children }: Props) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { conversations, totalUnread } = useAdminMessagerieContext();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  return (
    <div className={`${ADMIN_SHELL} animate-fadeIn`}>
      <AdminSidebar
        admin={admin}
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
        />
        <div className={ADMIN_MAIN_SCROLL}>{children}</div>
      </div>
    </div>
  );
}

export function AdminShell({ admin, children }: Props) {
  return (
    <AdminMessagerieProvider>
      <AdminShellInner admin={admin}>{children}</AdminShellInner>
    </AdminMessagerieProvider>
  );
}
