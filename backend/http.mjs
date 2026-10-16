export const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function readBody(request) {
  try {
    const body = await request.json();
    return body !== null && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

/**
 * Point d'entrée commun des fonctions : base absente → 503, méthode refusée → 405, panne → 502.
 * @param {string[]} methods
 * @param {(request: Request, store: import('./store.mjs').Store) => Promise<Response>} handler
 */
export function endpoint(methods, handler) {
  return async (request, store) => {
    if (!methods.includes(request.method)) {
      return new Response(null, { status: 405, headers: { Allow: methods.join(', ') } });
    }
    if (!store) return json(503, { error: 'Aucune base de données n’est reliée au projet.' });
    try {
      return await handler(request, store);
    } catch (error) {
      console.error(error);
      return json(502, { error: 'Base de données injoignable.' });
    }
  };
}
