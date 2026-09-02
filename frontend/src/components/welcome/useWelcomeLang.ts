'use client';

import { useSyncExternalStore } from 'react';
import { isWelcomeLang, WELCOME_LANG_STORAGE_KEY, type WelcomeLang } from './welcome-copy';

const LANG_CHANGED_EVENT = 'isms-welcome-lang-changed';

let current: WelcomeLang | null = null;

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== WELCOME_LANG_STORAGE_KEY) return;
    current = null;
    onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LANG_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LANG_CHANGED_EVENT, onStoreChange);
  };
}

function getSnapshot(): WelcomeLang {
  if (current === null) {
    try {
      const stored = window.localStorage.getItem(WELCOME_LANG_STORAGE_KEY);
      current = isWelcomeLang(stored) ? stored : 'en';
    } catch {
      current = 'en';
    }
  }
  return current;
}

function getServerSnapshot(): WelcomeLang {
  return 'en';
}

export function setWelcomeLang(next: WelcomeLang) {
  if (typeof window === 'undefined') return;
  current = next;
  try {
    window.localStorage.setItem(WELCOME_LANG_STORAGE_KEY, next);
  } catch {
    // Storage blocked; the choice applies to this view but is not remembered.
  }
  window.dispatchEvent(new Event(LANG_CHANGED_EVENT));
}

export function useWelcomeLang(): WelcomeLang {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
