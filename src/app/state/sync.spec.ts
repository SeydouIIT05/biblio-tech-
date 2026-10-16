import { LibraryBackend, RemoteState, SaveResult } from './backend';
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

/** Serveur en mémoire, avec la même règle de version que /api/state. */
class FakeServer implements LibraryBackend {
  version = 0;
  data: LibraryState | null = null;
  online = true;

  async load(): Promise<RemoteState | null> {
    return this.online ? { version: this.version, data: this.copy() } : null;
  }

  async save(version: number, data: LibraryState): Promise<SaveResult | null> {
    if (!this.online) return null;
    if (version !== this.version) return { ok: false, current: { version: this.version, data: this.copy() } };
    this.data = JSON.parse(JSON.stringify(data));
    this.version += 1;
    return { ok: true, version: this.version };
  }

  private copy(): LibraryState | null {
    return this.data && JSON.parse(JSON.stringify(this.data));
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve));

function browser(): LibraryPersistence {
  return { local: new MemoryStorage(), session: new MemoryStorage() };
}

async function open(server: FakeServer, persistence = browser()): Promise<LibraryStore> {
  const store = new LibraryStore(persistence, server);
  store.restore();
  await settle();
  return store;
}

describe('LibraryStore — synchronisation avec le serveur', () => {
  it('dépose les données de démonstration dans une base vide', async () => {
    const server = new FakeServer();
    const store = await open(server);
    expect(server.version).toBe(1);
    expect(server.data?.books.length).toBe(10);
    expect(server.data?.loans.length).toBe(10);
    expect(store.synced()).toBe(true);
  });

  it('partage une opération entre deux postes', async () => {
    const server = new FakeServer();
    const counter1 = await open(server);
    counter1.returnLoan(1);
    await settle();

    const counter2 = await open(server);
    expect(counter2.loans().find((l) => l.id === 1)?.ret).toBe(0);
  });

  it('préfère l’état du serveur à celui gardé dans le navigateur', async () => {
    const server = new FakeServer();
    const persistence = browser();
    const first = await open(server, persistence);
    first.returnLoan(1);
    await settle();
    persistence.local!.setItem(
      STORAGE_KEYS.data,
      JSON.stringify({ members: [], books: [], loans: [], reservations: [] }),
    );

    const reopened = await open(server, persistence);
    expect(reopened.books().length).toBe(10);
    expect(reopened.loans().find((l) => l.id === 1)?.ret).toBe(0);
  });

  it('se met à jour quand un autre poste a enregistré entre-temps', async () => {
    const server = new FakeServer();
    const counter1 = await open(server);
    const counter2 = await open(server);
    counter2.payFine(8);
    counter2.returnLoan(2);
    await settle();

    await counter1.pull();
    expect(counter1.loans().find((l) => l.id === 2)?.ret).toBe(0);
  });

  it('signale un conflit et reprend l’état le plus récent', async () => {
    const server = new FakeServer();
    const counter1 = await open(server);
    const counter2 = await open(server);
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

  it('continue dans le navigateur quand le serveur est injoignable', async () => {
    const server = new FakeServer();
    server.online = false;
    const persistence = browser();
    const store = await open(server, persistence);
    store.returnLoan(1);
    await settle();
    expect(store.synced()).toBe(false);
    expect(server.data).toBeNull();
    expect(new LibraryStore(persistence).loans().length).toBe(10);
    const reloaded = new LibraryStore(persistence);
    reloaded.restore();
    expect(reloaded.loans().find((l) => l.id === 1)?.ret).toBe(0);
  });

  it('réinitialise la démo ici et sur le serveur', async () => {
    const server = new FakeServer();
    const store = await open(server);
    store.returnLoan(1);
    store.addBook({ t: 'Nouveau', a: 'Auteur', c: '843 NEW', k: 'Roman', n: 1, y: 2021, s: '', img: '' });
    await settle();
    store.resetDemo();
    await settle();
    expect(store.books().length).toBe(10);
    expect(store.toastMessage()).toBe('Données de démonstration rétablies.');
    expect(server.data?.books.length).toBe(10);
    expect(server.data?.loans.find((l) => l.id === 1)?.ret).toBeNull();
  });
});
