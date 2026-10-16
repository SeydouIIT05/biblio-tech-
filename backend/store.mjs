// Stockage du backend : Upstash Redis en production, mémoire en développement et en test.
// - l'état de chaque bibliothèque, avec un numéro de version : une écriture faite sur une
//   version périmée est refusée et l'état le plus récent est renvoyé ;
// - les comptes (un par adresse e-mail), les sessions (avec expiration) et les échecs de connexion.

const libraryKeys = (library) => [`bibliotech:lib:${library}:version`, `bibliotech:lib:${library}:state`];
const userKey = (email) => `bibliotech:user:${email}`;
const sessionKey = (tokenHash) => `bibliotech:session:${tokenHash}`;
const failureKey = (email) => `bibliotech:fail:${email}`;

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

// KEYS[1] = compteur d'échecs ; ARGV[1] = durée de la fenêtre en secondes.
const COUNT_FAILURE = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count
`;

/**
 * @typedef {{ version: number, json: string | null }} StoredState
 * @typedef {{ ok: true, version: number } | { ok: false, current: StoredState }} WriteResult
 * @typedef {{
 *   read(library: string): Promise<StoredState>,
 *   write(library: string, expected: number, json: string): Promise<WriteResult>,
 *   createUser(email: string, json: string): Promise<boolean>,
 *   getUser(email: string): Promise<string | null>,
 *   setSession(tokenHash: string, json: string, ttlSeconds: number): Promise<void>,
 *   getSession(tokenHash: string): Promise<string | null>,
 *   deleteSession(tokenHash: string): Promise<void>,
 *   failures(email: string): Promise<number>,
 *   addFailure(email: string, windowSeconds: number): Promise<number>,
 *   clearFailures(email: string): Promise<void>,
 * }} Store
 */

/** @returns {Store} */
export function createMemoryStore(now = () => Date.now()) {
  const values = new Map();
  const get = (key) => {
    const entry = values.get(key);
    if (!entry) return null;
    if (entry.expires && entry.expires <= now()) {
      values.delete(key);
      return null;
    }
    return entry.value;
  };
  const set = (key, value, ttlSeconds) =>
    values.set(key, { value, expires: ttlSeconds ? now() + ttlSeconds * 1000 : 0 });

  return {
    async read(library) {
      const [versionKey, stateKey] = libraryKeys(library);
      return { version: Number(get(versionKey) ?? 0), json: get(stateKey) };
    },
    async write(library, expected, json) {
      const [versionKey, stateKey] = libraryKeys(library);
      const version = Number(get(versionKey) ?? 0);
      if (expected !== version) return { ok: false, current: { version, json: get(stateKey) } };
      set(stateKey, json);
      set(versionKey, String(version + 1));
      return { ok: true, version: version + 1 };
    },
    async createUser(email, json) {
      if (get(userKey(email)) !== null) return false;
      set(userKey(email), json);
      return true;
    },
    async getUser(email) {
      return get(userKey(email));
    },
    async setSession(tokenHash, json, ttlSeconds) {
      set(sessionKey(tokenHash), json, ttlSeconds);
    },
    async getSession(tokenHash) {
      return get(sessionKey(tokenHash));
    },
    async deleteSession(tokenHash) {
      values.delete(sessionKey(tokenHash));
    },
    async failures(email) {
      return Number(get(failureKey(email)) ?? 0);
    },
    async addFailure(email, windowSeconds) {
      const key = failureKey(email);
      const entry = get(key) === null ? null : values.get(key);
      const count = Number(entry?.value ?? 0) + 1;
      values.set(key, { value: String(count), expires: entry?.expires || now() + windowSeconds * 1000 });
      return count;
    },
    async clearFailures(email) {
      values.delete(failureKey(email));
    },
  };
}

/** @returns {Store} */
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
    async read(library) {
      const [version, json] = await command(['MGET', ...libraryKeys(library)]);
      return { version: Number(version ?? 0), json: json ?? null };
    },
    async write(library, expected, next) {
      const [version, json] = await command([
        'EVAL', COMPARE_AND_SET, '2', ...libraryKeys(library), String(expected), next,
      ]);
      if (json === undefined) return { ok: true, version: Number(version) };
      return { ok: false, current: { version: Number(version), json: json || null } };
    },
    async createUser(email, json) {
      return (await command(['SET', userKey(email), json, 'NX'])) === 'OK';
    },
    async getUser(email) {
      return command(['GET', userKey(email)]);
    },
    async setSession(tokenHash, json, ttlSeconds) {
      await command(['SET', sessionKey(tokenHash), json, 'EX', String(ttlSeconds)]);
    },
    async getSession(tokenHash) {
      return command(['GET', sessionKey(tokenHash)]);
    },
    async deleteSession(tokenHash) {
      await command(['DEL', sessionKey(tokenHash)]);
    },
    async failures(email) {
      return Number((await command(['GET', failureKey(email)])) ?? 0);
    },
    async addFailure(email, windowSeconds) {
      return Number(await command(['EVAL', COUNT_FAILURE, '1', failureKey(email), String(windowSeconds)]));
    },
    async clearFailures(email) {
      await command(['DEL', failureKey(email)]);
    },
  };
}

/**
 * Upstash via la Marketplace Vercel expose KV_REST_API_* ; un compte Upstash direct, UPSTASH_REDIS_REST_*.
 * @returns {Store | null} null quand aucune base n'est reliée au projet.
 */
export function storeFromEnv(env) {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return createUpstashStore({ url, token });
  if (env.BIBLIOTECH_MEMORY_STORE === '1') return createMemoryStore();
  return null;
}
