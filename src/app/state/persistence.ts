import { isPlatformBrowser } from '@angular/common';
import { InjectionToken, PLATFORM_ID, Provider, inject } from '@angular/core';

export interface LibraryPersistence {
  /** Données du comptoir et sessions ouvertes avec « Rester connecté ». */
  local: Storage | null;
  /** Sessions qui se ferment avec le navigateur. */
  session: Storage | null;
}

export const LIBRARY_PERSISTENCE = new InjectionToken<LibraryPersistence>('LIBRARY_PERSISTENCE');

export const STORAGE_KEYS = {
  data: 'bibliotech:data:v1',
  session: 'bibliotech:session:v1',
} as const;

function usable(get: () => Storage): Storage | null {
  try {
    const storage = get();
    storage.getItem(STORAGE_KEYS.data);
    return storage;
  } catch {
    return null;
  }
}

export function provideLibraryPersistence(): Provider {
  return {
    provide: LIBRARY_PERSISTENCE,
    useFactory: (): LibraryPersistence =>
      isPlatformBrowser(inject(PLATFORM_ID))
        ? { local: usable(() => localStorage), session: usable(() => sessionStorage) }
        : { local: null, session: null },
  };
}

export function readJson(storage: Storage | null, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJson(storage: Storage | null, key: string, value: unknown): boolean {
  if (!storage) return true;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(storage: Storage | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Stockage indisponible : rien à effacer.
  }
}
