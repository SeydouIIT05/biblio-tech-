import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleState } from './state-handler.mjs';
import { createMemoryStore, createUpstashStore, storeFromEnv } from './store.mjs';

const DATA = { members: [{ id: 'ADH-0412', n: 'Awa Koné' }], books: [], loans: [], reservations: [] };

const get = (store) => handleState(new Request('http://x/api/state'), store);
const put = (store, body) =>
  handleState(
    new Request('http://x/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    store,
  );

describe('/api/state', () => {
  it('renvoie un état vide en version 0 au premier appel', async () => {
    const response = await get(createMemoryStore());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { version: 0, data: null });
  });

  it('enregistre un état puis le relit avec la version suivante', async () => {
    const store = createMemoryStore();
    const saved = await put(store, { version: 0, data: DATA });
    assert.equal(saved.status, 200);
    assert.deepEqual(await saved.json(), { version: 1 });
    assert.deepEqual(await (await get(store)).json(), { version: 1, data: DATA });
  });

  it('refuse une écriture faite sur une version périmée et renvoie l’état à jour', async () => {
    const store = createMemoryStore();
    await put(store, { version: 0, data: DATA });
    const stale = await put(store, { version: 0, data: { ...DATA, books: [{ id: 1 }] } });
    assert.equal(stale.status, 409);
    assert.deepEqual(await stale.json(), { version: 1, data: DATA });
  });

  it('ne garde que les quatre collections attendues', async () => {
    const store = createMemoryStore();
    await put(store, { version: 0, data: { ...DATA, session: { user: 'x' } } });
    assert.deepEqual((await (await get(store)).json()).data, DATA);
  });

  it('rejette un corps invalide', async () => {
    const store = createMemoryStore();
    assert.equal((await put(store, '{oups')).status, 400);
    assert.equal((await put(store, { version: 0, data: { books: [] } })).status, 400);
    assert.equal((await put(store, { version: -1, data: DATA })).status, 400);
  });

  it('répond 503 quand aucune base n’est reliée', async () => {
    assert.equal((await get(null)).status, 503);
  });

  it('répond 405 aux autres méthodes', async () => {
    const response = await handleState(new Request('http://x/api/state', { method: 'DELETE' }), createMemoryStore());
    assert.equal(response.status, 405);
  });

  it('répond 502 quand la base ne répond pas', async () => {
    const broken = { read: async () => { throw new Error('down'); }, write: async () => { throw new Error('down'); } };
    const original = console.error;
    console.error = () => {};
    try {
      assert.equal((await get(broken)).status, 502);
    } finally {
      console.error = original;
    }
  });
});

describe('store Upstash', () => {
  const upstash = (results) => {
    const calls = [];
    const fetch = async (url, init) => {
      calls.push({ url, auth: init.headers.Authorization, args: JSON.parse(init.body) });
      return new Response(JSON.stringify({ result: results.shift() }));
    };
    return { calls, store: createUpstashStore({ url: 'https://redis.example', token: 't0k', fetch }) };
  };

  it('lit la version et l’état en une commande', async () => {
    const { calls, store } = upstash([['3', '{"a":1}']]);
    assert.deepEqual(await store.read(), { version: 3, json: '{"a":1}' });
    assert.equal(calls[0].auth, 'Bearer t0k');
    assert.deepEqual(calls[0].args, ['MGET', 'bibliotech:version', 'bibliotech:state']);
  });

  it('considère une base vide comme la version 0', async () => {
    const { store } = upstash([[null, null]]);
    assert.deepEqual(await store.read(), { version: 0, json: null });
  });

  it('écrit de façon atomique et distingue succès et conflit', async () => {
    const { calls, store } = upstash([[4], [4, '{"b":2}']]);
    assert.deepEqual(await store.write(3, '{"a":1}'), { ok: true, version: 4 });
    assert.equal(calls[0].args[0], 'EVAL');
    assert.deepEqual(calls[0].args.slice(2), ['2', 'bibliotech:version', 'bibliotech:state', '3', '{"a":1}']);
    assert.deepEqual(await store.write(3, '{"a":1}'), { ok: false, current: { version: 4, json: '{"b":2}' } });
  });

  it('choisit le stockage d’après les variables d’environnement', () => {
    assert.equal(storeFromEnv({}), null);
    assert.ok(storeFromEnv({ KV_REST_API_URL: 'https://r', KV_REST_API_TOKEN: 't' }));
    assert.ok(storeFromEnv({ UPSTASH_REDIS_REST_URL: 'https://r', UPSTASH_REDIS_REST_TOKEN: 't' }));
    assert.ok(storeFromEnv({ BIBLIOTECH_MEMORY_STORE: '1' }));
  });
});
