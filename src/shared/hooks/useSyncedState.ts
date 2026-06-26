'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

/** Synchronise un état local quand une prop / valeur externe change (via effet, compatible React 19). */
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setState(value);
  }, [value]);

  return [state, setState];
}
