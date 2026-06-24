'use client';

import { useEffect, type DependencyList } from 'react';

/** Exécute un effet après le paint initial (évite set-state-in-effect sur fetch / init). */
export function useRunAfterMount(effect: () => void | (() => void), deps: DependencyList) {
  useEffect(() => {
    let cleanup: void | (() => void);
    const id = setTimeout(() => {
      cleanup = effect();
    }, 0);
    return () => {
      clearTimeout(id);
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- même contrat que useEffect
  }, deps);
}
