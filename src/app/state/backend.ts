import { isPlatformBrowser } from '@angular/common';
import { InjectionToken, PLATFORM_ID, Provider, inject } from '@angular/core';
import { LibraryState } from './rules';

export interface RemoteState {
  version: number;
  data: LibraryState | null;
}

export type SaveResult = { ok: true; version: number } | { ok: false; current: RemoteState };

/** Serveur qui partage l'état de la bibliothèque entre les postes. `null` = serveur injoignable. */
export interface LibraryBackend {
  load(): Promise<RemoteState | null>;
  save(version: number, data: LibraryState): Promise<SaveResult | null>;
}

export const LIBRARY_BACKEND = new InjectionToken<LibraryBackend | null>('LIBRARY_BACKEND');

function isRemoteState(value: unknown): value is RemoteState {
  const r = value as RemoteState | null;
  return Number.isInteger(r?.version) && r !== null && 'data' in r;
}

export function httpBackend(url = '/api/state'): LibraryBackend {
  return {
    async load() {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return null;
        const body: unknown = await response.json();
        return isRemoteState(body) ? body : null;
      } catch {
        return null;
      }
    },
    async save(version, data) {
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version, data }),
        });
        const body: unknown = await response.json();
        if (response.status === 409 && isRemoteState(body)) return { ok: false, current: body };
        if (!response.ok) return null;
        const saved = body as { version?: unknown };
        return Number.isInteger(saved.version) ? { ok: true, version: saved.version as number } : null;
      } catch {
        return null;
      }
    },
  };
}

export function provideLibraryBackend(): Provider {
  return {
    provide: LIBRARY_BACKEND,
    useFactory: (): LibraryBackend | null =>
      isPlatformBrowser(inject(PLATFORM_ID)) ? httpBackend() : null,
  };
}
