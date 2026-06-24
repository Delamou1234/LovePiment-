'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

/** Synchronise un état local quand une prop / valeur externe change (sans useEffect). */
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setState(value);
  }
  return [state, setState];
}
