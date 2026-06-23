'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/shared/providers/AuthSessionProvider';

export function SignOutButton() {
  const router = useRouter();
  const { logout } = useAuthSession();

  const handleSignOut = async () => {
    await logout('customer');
    router.push('/');
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className="gap-2 text-zinc-600"
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </Button>
  );
}
