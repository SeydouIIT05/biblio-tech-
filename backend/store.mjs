// Stockage de l'état de la bibliothèque : Upstash Redis en production, mémoire en développement.
// Chaque écriture porte le numéro de version lu : si un autre poste a écrit entre-temps,
// l'écriture est refusée et l'état le plus récent est renvoyé.

const VERSION_KEY = 'bibliotech:version';
const STATE_KEY = 'bibliotech:state';

// KEYS[1] = version, KEYS[2] = état ; ARGV[1] = version attendue, ARGV[2] = nouvel état (JSON).
const COMPARE_AND_SET = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current ~= tonumber(ARGV[1]) then
  return {current, redis.call('GET', KEYS[2]) or ''}
end
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], current + 1)
return {current + 1}
`;

/** @typedef {{ version: number, json: string | null }} StoredState */
/** @typedef {{ ok: true, version: number } | { ok: false, current: StoredState }} WriteResult */
/** @typedef {{ read(): Promise<StoredState>, write(expected: number, json: string): Promise<WriteResult> }} StateStore */

/** @returns {StateStore} */
export function createMemoryStore() {
  let version = 0;
  let json = null;
  return {
    async read() {
      return { version, json };
    },
    async write(expected, next) {
      if (expected !== version) return { ok: false, current: { version, json } };
      json = next;
      version += 1;
      return { ok: true, version };
    },
  };
}

/** @returns {StateStore} */
export function createUpstashStore({ url, token, fetch = globalThis.fetch }) {
  const command = async (args) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const body = await response.json();
    if (!response.ok || body.error) throw new Error(`Upstash: ${body.error ?? response.status}`);
    return body.result;
  };
  return {
    async read() {
      const [version, json] = await command(['MGET', VERSION_KEY, STATE_KEY]);
      return { version: Number(version ?? 0), json: json ?? null };
    },
    async write(expected, next) {
      const [version, json] = await command([
        'EVAL', COMPARE_AND_SET, '2', VERSION_KEY, STATE_KEY, String(expected), next,
      ]);
      if (json === undefined) return { ok: true, version: Number(version) };
      return { ok: false, current: { version: Number(version), json: json || null } };
    },
  };
}

/**
 * Upstash via la Marketplace Vercel expose KV_REST_API_* ; un compte Upstash direct, UPSTASH_REDIS_REST_*.
 * @returns {StateStore | null} null quand aucune base n'est reliée au projet.
 */
export function storeFromEnv(env) {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return createUpstashStore({ url, token });
  if (env.BIBLIOTECH_MEMORY_STORE === '1') return createMemoryStore();
  return null;
}
