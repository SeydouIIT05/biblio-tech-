// API /api/state : lecture et écriture de l'état partagé de la bibliothèque.
//   GET → 200 { version, data }           (data = null tant que personne n'a rien enregistré)
//   PUT { version, data } → 200 { version }   ou 409 { version, data } si un autre poste a écrit avant

const MAX_BYTES = 3_000_000;
const COLLECTIONS = ['members', 'books', 'loans', 'reservations'];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const parse = (text) => (text ? JSON.parse(text) : null);

export function isLibraryData(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    COLLECTIONS.every((key) => Array.isArray(data[key]))
  );
}

/**
 * @param {Request} request
 * @param {import('./store.mjs').StateStore | null} store
 */
export async function handleState(request, store) {
  if (!store) return json(503, { error: 'Aucune base de données n’est reliée au projet.' });
  try {
    return await route(request, store);
  } catch (error) {
    console.error(error);
    return json(502, { error: 'Base de données injoignable.' });
  }
}

async function route(request, store) {
  if (request.method === 'GET') {
    const { version, json: stored } = await store.read();
    return json(200, { version, data: parse(stored) });
  }

  if (request.method === 'PUT') {
    const text = await request.text();
    if (text.length > MAX_BYTES) return json(413, { error: 'État trop volumineux (3 Mo maximum).' });
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return json(400, { error: 'JSON invalide.' });
    }
    if (!Number.isInteger(body?.version) || body.version < 0 || !isLibraryData(body.data)) {
      return json(400, { error: 'Attendu : { version, data: { members, books, loans, reservations } }.' });
    }
    const data = Object.fromEntries(COLLECTIONS.map((key) => [key, body.data[key]]));
    const result = await store.write(body.version, JSON.stringify(data));
    if (result.ok) return json(200, { version: result.version });
    return json(409, { version: result.current.version, data: parse(result.current.json) });
  }

  return new Response(null, { status: 405, headers: { Allow: 'GET, PUT' } });
}
