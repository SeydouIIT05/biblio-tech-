// API /api/state : état de la bibliothèque du compte connecté (Authorization: Bearer <jeton>).
//   GET → 200 { version, data }               (data = null tant que la bibliothèque est vide)
//   PUT { version, data } → 200 { version }   ou 409 { version, data } si un autre poste a écrit avant
import { authenticate } from './auth.mjs';
import { endpoint, json, readBody } from './http.mjs';

const MAX_BYTES = 3_000_000;
const COLLECTIONS = ['members', 'books', 'loans', 'reservations'];

const parse = (text) => (text ? JSON.parse(text) : null);

export function isLibraryData(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    COLLECTIONS.every((key) => Array.isArray(data[key]))
  );
}

export const handleState = endpoint(['GET', 'PUT'], async (request, store) => {
  const session = await authenticate(request, store);
  if (!session) return json(401, { error: 'Session expirée : reconnectez-vous.' });

  if (request.method === 'GET') {
    const { version, json: stored } = await store.read(session.library);
    return json(200, { version, data: parse(stored) });
  }

  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BYTES) {
    return json(413, { error: 'État trop volumineux (3 Mo maximum).' });
  }
  const body = await readBody(request);
  if (!Number.isInteger(body?.version) || body.version < 0 || !isLibraryData(body.data)) {
    return json(400, { error: 'Attendu : { version, data: { members, books, loans, reservations } }.' });
  }
  const data = Object.fromEntries(COLLECTIONS.map((key) => [key, body.data[key]]));
  const serialized = JSON.stringify(data);
  if (serialized.length > MAX_BYTES) return json(413, { error: 'État trop volumineux (3 Mo maximum).' });
  const result = await store.write(session.library, body.version, serialized);
  if (result.ok) return json(200, { version: result.version });
  return json(409, { version: result.current.version, data: parse(result.current.json) });
});
