import {
  AccountSession,
  AuthResult,
  LibraryBackend,
  RemoteState,
  SaveResult,
  SignupRequest,
  UNAUTHORIZED,
} from './backend';
import { LibraryStore } from './library.store';
import { LibraryPersistence, STORAGE_KEYS } from './persistence';
import { LibraryState } from './rules';

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, String(value));
  }
}

interface Library {
  version: number;
  data: LibraryState | null;
}

/** Serveur en mémoire, avec les mêmes règles que /api/auth et /api/state. */
class FakeServer implements LibraryBackend {
  online = true;
  readonly libraries = new Map<string, Library>();
  private readonly accounts = new Map<string, { password: string; name: string; library: string }>();
  private readonly sessions = new Map<string, string>();
  private next = 0;

  async signup(input: SignupRequest): Promise<AuthResult> {
    if (!this.online) return { ok: false, error: 'Serveur injoignable : vérifiez la connexion puis réessayez.' };
    const email = input.email.toLowerCase();
    if (this.accounts.has(email)) return { ok: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
    this.accounts.set(email, { password: input.password, name: input.name, library: input.library });
    this.libraries.set(input.library, { version: 0, data: null });
    return { ok: true, session: this.open(email) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    if (!this.online) return { ok: false, error: 'Serveur injoignable : vérifiez la connexion puis réessayez.' };
    const account = this.accounts.get(email.toLowerCase());
    if (!account || account.password !== password) return { ok: false, error: 'E-mail ou mot de passe incorrect.' };
    return { ok: true, session: this.open(email.toLowerCase()) };
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async load(token: string): Promise<RemoteState | typeof UNAUTHORIZED | null> {
    if (!this.online) return null;
    const library = this.library(token);
    if (!library) return UNAUTHORIZED;
    return { version: library.version, data: library.data && structuredClone(library.data) };
  }

  async save(token: string, version: number, data: LibraryState): Promise<SaveResult | typeof UNAUTHORIZED | null> {
    if (!this.online) return null;
    const library = this.library(token);
    if (!library) return UNAUTHORIZED;
    if (version !== library.version) {
      return { ok: false, current: { version: library.version, data: library.data && structuredClone(library.data) } };
    }
    library.data = structuredClone(data);
    library.version += 1;
    return { ok: true, version: library.version };
  }

  expireAll(): void {
    this.sessions.clear();
  }

  private open(email: string): AccountSession {
    const token = `jeton-${++this.next}`;
    this.sessions.set(token, email);
    const account = this.accounts.get(email)!;
    return { token, user: `${account.name}, administrateur`, place: account.library };
  }

  private library(token: string): Library | undefined {
    const email = this.sessions.get(token);
    return email ? this.libraries.get(this.accounts.get(email)!.library) : undefined;
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve));

const SIGNUP = {
  b: 'Bibliothèque de Cocody',
  y: 'Municipale',
  v: 'Abidjan',
  n: 'Seydou Diabagate',
  t: '0707123456',
  e: 'seydou@biblio.ci',
  p: 'motdepasse1',
  c: 'motdepasse1',
  k: true,
};

function browser(): LibraryPersistence {
  return { local: new MemoryStorage(), session: new MemoryStorage() };
}

function open(server: FakeServer, persistence = browser()): LibraryStore {
  const store = new LibraryStore(persistence, server);
  store.restore();
  return store;
}

async function registered(server: FakeServer): Promise<LibraryStore> {
  const store = open(server);
  expect(await store.signup(SIGNUP)).toBe('');
  return store;
}

describe('LibraryStore — comptes et synchronisation avec le serveur', () => {
  it('crée le compte et dépose les données de démonstration dans sa bibliothèque', async () => {
    const server = new FakeServer();
    const store = await registered(server);
    expect(store.session()).toEqual({ user: 'Seydou Diabagate, administrateur', place: 'Bibliothèque de Cocody' });
    const library = server.libraries.get('Bibliothèque de Cocody')!;
    expect(library.version).toBe(1);
    expect(library.data?.books.length).toBe(10);
  });

  it('affiche l’erreur du serveur et n’ouvre pas de session', async () => {
    const server = new FakeServer();
    await registered(server);
    const other = open(server);
    expect(await other.login('seydou@biblio.ci', 'mauvais')).toBe('E-mail ou mot de passe incorrect.');
    expect(other.session()).toBeNull();
    expect(await other.signup(SIGNUP)).toBe('Un compte existe déjà avec cette adresse e-mail.');
  });

  it('prévient quand le serveur est injoignable', async () => {
    const server = new FakeServer();
    server.online = false;
    expect(await open(server).login('seydou@biblio.ci', 'motdepasse1')).toBe(
      'Serveur injoignable : vérifiez la connexion puis réessayez.',
    );
  });

  it('charge la bibliothèque du compte à la connexion, sur un autre poste', async () => {
    const server = new FakeServer();
    const counter1 = await registered(server);
    counter1.returnLoan(1);
    await settle();

    const counter2 = open(server);
    expect(await counter2.login('seydou@biblio.ci', 'motdepasse1')).toBe('');
    expect(counter2.loans().find((l) => l.id === 1)?.ret).toBe(0);
  });

  it('sépare les données de deux comptes', async () => {
    const server = new FakeServer();
    const mine = await registered(server);
    mine.returnLoan(1);
    await settle();

    const prof = open(server);
    await prof.signup({ ...SIGNUP, b: 'Bibliothèque du lycée', e: 'prof@ecole.ci' });
    expect(prof.loans().find((l) => l.id === 1)?.ret).toBeNull();
  });

  it('garde la session au rechargement grâce au jeton', async () => {
    const server = new FakeServer();
    const persistence = browser();
    const store = open(server, persistence);
    await store.signup(SIGNUP);
    store.setView('pen');

    const reloaded = open(server, persistence);
    await settle();
    expect(reloaded.session()?.user).toBe('Seydou Diabagate, administrateur');
    expect(reloaded.view()).toBe('pen');
  });

  it('déconnecte avec un message quand la session a expiré', async () => {
    const server = new FakeServer();
    const store = await registered(server);
    server.expireAll();
    await store.pull();
    expect(store.session()).toBeNull();
    expect(store.consumeAuthNotice()).toBe('Votre session a expiré : reconnectez-vous.');
    expect(store.consumeAuthNotice()).toBe('');
  });

  it('ne laisse aucune donnée du compte sur le poste après la déconnexion', async () => {
    const server = new FakeServer();
    const persistence = browser();
    const store = open(server, persistence);
    await store.signup(SIGNUP);
    store.returnLoan(1);
    await settle();
    store.leave();
    expect(persistence.local!.getItem(STORAGE_KEYS.data)).toBeNull();
    expect(persistence.local!.getItem(STORAGE_KEYS.session)).toBeNull();
    expect(store.loans().find((l) => l.id === 1)?.ret).toBeNull();
  });

  it('se met à jour quand un autre poste a enregistré entre-temps', async () => {
    const server = new FakeServer();
    const counter1 = await registered(server);
    const counter2 = open(server);
    await counter2.login('seydou@biblio.ci', 'motdepasse1');
    counter2.returnLoan(2);
    await settle();

    await counter1.pull();
    expect(counter1.loans().find((l) => l.id === 2)?.ret).toBe(0);
  });

  it('signale un conflit et reprend l’état le plus récent', async () => {
    const server = new FakeServer();
    const counter1 = await registered(server);
    const counter2 = open(server);
    await counter2.login('seydou@biblio.ci', 'motdepasse1');
    counter2.returnLoan(2);
    await settle();

    counter1.returnLoan(1);
    await settle();
    expect(counter1.toastMessage()).toBe(
      'Un autre poste vient de modifier les données : l’affichage est à jour, refaites votre dernière opération si besoin.',
    );
    expect(counter1.loans().find((l) => l.id === 2)?.ret).toBe(0);
    expect(counter1.loans().find((l) => l.id === 1)?.ret).toBeNull();
  });

  it('réinitialise la démo ici et sur le serveur', async () => {
    const server = new FakeServer();
    const store = await registered(server);
    store.returnLoan(1);
    store.addBook({ t: 'Nouveau', a: 'Auteur', c: '843 NEW', k: 'Roman', n: 1, y: 2021, s: '', img: '' });
    await settle();
    store.resetDemo();
    await settle();
    const library = server.libraries.get('Bibliothèque de Cocody')!;
    expect(store.books().length).toBe(10);
    expect(library.data?.books.length).toBe(10);
    expect(library.data?.loans.find((l) => l.id === 1)?.ret).toBeNull();
  });
});
