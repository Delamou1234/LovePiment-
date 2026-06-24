'use client';

import { useCallback, useState } from 'react';

/** Panneau / menu ouvert uniquement sur le pathname courant (fermeture auto à la navigation). */
export function usePathBoundOpen(pathname: string) {
  const [state, setState] = useState({ open: false, path: pathname });
  const isOpen = state.open && state.path === pathname;
  const setOpen = useCallback(
    (open: boolean) => setState({ open, path: pathname }),
    [pathname],
  );
  return [isOpen, setOpen] as const;
}
