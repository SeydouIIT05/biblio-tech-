import { isPlatformBrowser } from '@angular/common';
import { InjectionToken, PLATFORM_ID, Provider, inject } from '@angular/core';
import { LibraryState } from './rules';

export interface RemoteState {
  version: number;
  data: LibraryState | null;
}

/** Session ouverte par le serveur : jeton à renvoyer à chaque appel, identité affichée. */
export interface AccountSession {
  token: string;
  user: string;
  place: string;
}

export interface SignupRequest {
  library: string;
  type: string;
  city: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}

export type AuthResult = { ok: true; session: AccountSession } | { ok: false; error: string };
export type SaveResult = { ok: true; version: number } | { ok: false; current: RemoteState };

/** Jeton refusé par le serveur : la session a expiré ou a été fermée. */
export const UNAUTHORIZED = 'unauthorized';

/** Serveur des comptes et des données. `null` = serveur injoignable. */
export interface LibraryBackend {
  signup(input: SignupRequest, remember: boolean): Promise<AuthResult>;
  login(email: string, password: string, remember: boolean): Promise<AuthResult>;
  logout(token: string): Promise<void>;
  load(token: string): Promise<RemoteState | typeof UNAUTHORIZED | null>;
  save(token: string, version: number, data: LibraryState): Promise<SaveResult | typeof UNAUTHORIZED | null>;
}

export const LIBRARY_BACKEND = new InjectionToken<LibraryBackend | null>('LIBRARY_BACKEND');

const UNREACHABLE = 'Serveur injoignable : vérifiez la connexion puis réessayez.';

function isRemoteState(value: unknown): value is RemoteState {
  const r = value as RemoteState | null;
  return Number.isInteger(r?.version) && r !== null && 'data' in r;
}

function isAccountSession(value: unknown): value is AccountSession {
  const s = value as AccountSession | null;
  return typeof s?.token === 'string' && typeof s.user === 'string' && typeof s.place === 'string';
}

export function httpBackend(base = '/api'): LibraryBackend {
  const send = (path: string, init: RequestInit, token?: string) =>
    fetch(base + path, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const authenticate = async (path: string, body: object): Promise<AuthResult> => {
    try {
      const response = await send(path, { method: 'POST', body: JSON.stringify(body) });
      const payload: unknown = await response.json().catch(() => null);
      if (response.ok && isAccountSession(payload)) return { ok: true, session: payload };
      const error = (payload as { error?: unknown } | null)?.error;
      return { ok: false, error: typeof error === 'string' && response.status < 500 ? error : UNREACHABLE };
    } catch {
      return { ok: false, error: UNREACHABLE };
    }
  };

  return {
    signup: (input, remember) => authenticate('/auth/signup', { ...input, remember }),
    login: (email, password, remember) => authenticate('/auth/login', { email, password, remember }),
    async logout(token) {
      await send('/auth/logout', { method: 'POST' }, token).catch(() => undefined);
    },
    async load(token) {
      try {
        const response = await send('/state', { method: 'GET' }, token);
        if (response.status === 401) return UNAUTHORIZED;
        if (!response.ok) return null;
        const body: unknown = await response.json();
        return isRemoteState(body) ? body : null;
      } catch {
        return null;
      }
    },
    async save(token, version, data) {
      try {
        const response = await send('/state', { method: 'PUT', body: JSON.stringify({ version, data }) }, token);
        if (response.status === 401) return UNAUTHORIZED;
        const body: unknown = await response.json().catch(() => null);
        if (response.status === 409 && isRemoteState(body)) return { ok: false, current: body };
        if (!response.ok) return null;
        const saved = body as { version?: unknown } | null;
        return Number.isInteger(saved?.version) ? { ok: true, version: saved!.version as number } : null;
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
