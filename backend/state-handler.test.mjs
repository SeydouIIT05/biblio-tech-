import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_FAILURES, handleLogin, handleLogout, handleSignup } from './auth.mjs';
import { handleState } from './state-handler.mjs';
import { createMemoryStore, createUpstashStore, storeFromEnv } from './store.mjs';

const DATA = { members: [{ id: 'ADH-0412', n: 'Awa Koné' }], books: [], loans: [], reservations: [] };
const ACCOUNT = {
  library: 'Bibliothèque municipale de Cocody',
  type: 'Municipale',
  city: 'Abidjan',
  name: 'Seydou Diabagate',
  phone: '+225 07 07 12 34 56',
  email: 'Seydou@Biblio.ci',
  password: 'motdepasse1',
};

const call = (handler, store, { method = 'POST', body, token } = {}) =>
  handler(
    new Request('http://x/api', {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    }),
    store,
  );

async function signup(store, overrides = {}) {
  const response = await call(handleSignup, store, { body: { ...ACCOUNT, ...overrides } });
  return { status: response.status, body: await response.json() };
}

const getState = (store, token) => call(handleState, store, { method: 'GET', token });
const putState = (store, token, body) => call(handleState, store, { method: 'PUT', token, body });

describe('/api/auth', () => {
  it('crée un compte et ouvre une session', async () => {
    const { status, body } = await signup(createMemoryStore());
    assert.equal(status, 201);
    assert.equal(body.user, 'Seydou Diabagate, administrateur');
    assert.equal(body.place, 'Bibliothèque municipale de Cocody');
    assert.ok(body.token.length > 30);
  });

  it('ne garde jamais le mot de passe en clair', async () => {
    const store = createMemoryStore();
    await signup(store);
    const user = JSON.parse(await store.getUser('seydou@biblio.ci'));
    assert.match(user.passwordHash, /^scrypt\$/);
    assert.ok(!JSON.stringify(user).includes(ACCOUNT.password));
  });

  it('refuse une adresse déjà utilisée, quelle que soit la casse', async () => {
    const store = createMemoryStore();
    await signup(store);
    const again = await signup(store, { email: 'seydou@biblio.ci' });
    assert.equal(again.status, 409);
    assert.equal(again.body.error, 'Un compte existe déjà avec cette adresse e-mail.');
  });

  it('valide l’inscription avec les messages du formulaire', async () => {
    const store = createMemoryStore();
    assert.equal((await signup(store, { library: ' ' })).body.error, 'Indiquez le nom de la bibliothèque.');
    assert.equal((await signup(store, { phone: '123' })).body.error, 'Numéro de téléphone invalide : 10 chiffres, avec ou sans +225.');
    assert.equal((await signup(store, { password: 'court' })).body.error, 'Mot de passe : 8 caractères minimum, dont un chiffre.');
  });

  it('connecte avec le bon mot de passe et refuse le mauvais', async () => {
    const store = createMemoryStore();
    await signup(store);
    const ok = await call(handleLogin, store, { body: { email: 'seydou@biblio.ci', password: ACCOUNT.password } });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).place, 'Bibliothèque municipale de Cocody');
    const wrong = await call(handleLogin, store, { body: { email: 'seydou@biblio.ci', password: 'mauvais99' } });
    assert.equal(wrong.status, 401);
    assert.equal((await wrong.json()).error, 'E-mail ou mot de passe incorrect.');
    const unknown = await call(handleLogin, store, { body: { email: 'inconnu@biblio.ci', password: 'x' } });
    assert.equal(unknown.status, 401);
  });

  it('bloque après trop d’échecs', async () => {
    const store = createMemoryStore();
    await signup(store);
    for (let i = 0; i < MAX_FAILURES; i++) {
      await call(handleLogin, store, { body: { email: ACCOUNT.email, password: 'mauvais99' } });
    }
    const blocked = await call(handleLogin, store, { body: { email: ACCOUNT.email, password: ACCOUNT.password } });
    assert.equal(blocked.status, 429);
  });

  it('ferme la session à la déconnexion', async () => {
    const store = createMemoryStore();
    const { body } = await signup(store);
    assert.equal((await getState(store, body.token)).status, 200);
    assert.equal((await call(handleLogout, store, { token: body.token })).status, 204);
    assert.equal((await getState(store, body.token)).status, 401);
  });

  it('fait expirer une session', async () => {
    let now = 0;
    const store = createMemoryStore(() => now);
    const { body } = await signup(store, { remember: false });
    now = 25 * 3600 * 1000;
    assert.equal((await getState(store, body.token)).status, 401);
  });
});

describe('/api/state', () => {
  it('exige une session', async () => {
    const store = createMemoryStore();
    assert.equal((await getState(store)).status, 401);
    assert.equal((await getState(store, 'jeton-inventé')).status, 401);
  });

  it('renvoie une bibliothèque vide en version 0, puis l’état enregistré', async () => {
    const store = createMemoryStore();
    const { body } = await signup(store);
    assert.deepEqual(await (await getState(store, body.token)).json(), { version: 0, data: null });
    const saved = await putState(store, body.token, { version: 0, data: DATA });
    assert.deepEqual(await saved.json(), { version: 1 });
    assert.deepEqual(await (await getState(store, body.token)).json(), { version: 1, data: DATA });
  });

  it('sépare les données de chaque bibliothèque', async () => {
    const store = createMemoryStore();
    const a = (await signup(store)).body;
    const b = (await signup(store, { email: 'prof@ecole.ci', library: 'Bibliothèque du lycée' })).body;
    await putState(store, a.token, { version: 0, data: DATA });
    assert.deepEqual(await (await getState(store, b.token)).json(), { version: 0, data: null });
  });

  it('refuse une écriture faite sur une version périmée et renvoie l’état à jour', async () => {
    const store = createMemoryStore();
    const { token } = (await signup(store)).body;
    await putState(store, token, { version: 0, data: DATA });
    const stale = await putState(store, token, { version: 0, data: { ...DATA, books: [{ id: 1 }] } });
    assert.equal(stale.status, 409);
    assert.deepEqual(await stale.json(), { version: 1, data: DATA });
  });

  it('ne garde que les quatre collections attendues', async () => {
    const store = createMemoryStore();
    const { token } = (await signup(store)).body;
    await putState(store, token, { version: 0, data: { ...DATA, session: { user: 'x' } } });
    assert.deepEqual((await (await getState(store, token)).json()).data, DATA);
  });

  it('rejette un corps invalide', async () => {
    const store = createMemoryStore();
    const { token } = (await signup(store)).body;
    assert.equal((await putState(store, token, '{oups')).status, 400);
    assert.equal((await putState(store, token, { version: 0, data: { books: [] } })).status, 400);
    assert.equal((await putState(store, token, { version: -1, data: DATA })).status, 400);
  });

  it('répond 503 sans base, 405 aux autres méthodes, 502 quand la base ne répond pas', async () => {
    assert.equal((await getState(null)).status, 503);
    assert.equal((await call(handleState, createMemoryStore(), { method: 'DELETE' })).status, 405);
    const broken = new Proxy({}, { get: () => async () => { throw new Error('down'); } });
    const original = console.error;
    console.error = () => {};
    try {
      assert.equal((await getState(broken, 'x')).status, 502);
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

  it('lit la version et l’état d’une bibliothèque en une commande', async () => {
    const { calls, store } = upstash([['3', '{"a":1}']]);
    assert.deepEqual(await store.read('lib1'), { version: 3, json: '{"a":1}' });
    assert.equal(calls[0].auth, 'Bearer t0k');
    assert.deepEqual(calls[0].args, ['MGET', 'bibliotech:lib:lib1:version', 'bibliotech:lib:lib1:state']);
  });

  it('considère une bibliothèque vide comme la version 0', async () => {
    const { store } = upstash([[null, null]]);
    assert.deepEqual(await store.read('lib1'), { version: 0, json: null });
  });

  it('écrit de façon atomique et distingue succès et conflit', async () => {
    const { calls, store } = upstash([[4], [4, '{"b":2}']]);
    assert.deepEqual(await store.write('lib1', 3, '{"a":1}'), { ok: true, version: 4 });
    assert.equal(calls[0].args[0], 'EVAL');
    assert.deepEqual(calls[0].args.slice(2), ['2', 'bibliotech:lib:lib1:version', 'bibliotech:lib:lib1:state', '3', '{"a":1}']);
    assert.deepEqual(await store.write('lib1', 3, '{"a":1}'), { ok: false, current: { version: 4, json: '{"b":2}' } });
  });

  it('crée un compte sans écraser un compte existant et pose une session qui expire', async () => {
    const { calls, store } = upstash(['OK', null, 'OK']);
    assert.equal(await store.createUser('a@b.ci', '{}'), true);
    assert.equal(await store.createUser('a@b.ci', '{}'), false);
    assert.deepEqual(calls[0].args, ['SET', 'bibliotech:user:a@b.ci', '{}', 'NX']);
    await store.setSession('h', '{}', 60);
    assert.deepEqual(calls[2].args, ['SET', 'bibliotech:session:h', '{}', 'EX', '60']);
  });

  it('choisit le stockage d’après les variables d’environnement', () => {
    assert.equal(storeFromEnv({}), null);
    assert.ok(storeFromEnv({ KV_REST_API_URL: 'https://r', KV_REST_API_TOKEN: 't' }));
    assert.ok(storeFromEnv({ UPSTASH_REDIS_REST_URL: 'https://r', UPSTASH_REDIS_REST_TOKEN: 't' }));
    assert.ok(storeFromEnv({ BIBLIOTECH_MEMORY_STORE: '1' }));
  });
});
