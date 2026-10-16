import { LibraryStore } from './library.store';
import { LibraryPersistence, STORAGE_KEYS } from './persistence';

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

class FullStorage extends MemoryStorage {
  override setItem(): void {
    throw new DOMException('quota', 'QuotaExceededError');
  }
}

function browser(): LibraryPersistence {
  return { local: new MemoryStorage(), session: new MemoryStorage() };
}

function reload(persistence: LibraryPersistence): LibraryStore {
  const store = new LibraryStore(persistence);
  store.restore();
  return store;
}

describe('LibraryStore — persistance navigateur', () => {
  it('attend la relecture du navigateur avant d’être prêt', () => {
    const store = new LibraryStore(browser());
    expect(store.restored()).toBe(false);
    store.restore();
    expect(store.restored()).toBe(true);
    expect(store.session()).toBeNull();
    expect(store.books().length).toBe(10);
  });

  it('est prêt immédiatement sans stockage', () => {
    expect(new LibraryStore().restored()).toBe(true);
  });

  it('garde la session et l’onglet ouvert après un rechargement', () => {
    const persistence = browser();
    const first = reload(persistence);
    first.login('salimata@biblio.ci', 'secret');
    first.setView('pen');

    const second = reload(persistence);
    expect(second.session()).toEqual({ user: 'Salimata D., comptoir 1', place: 'Bibliothèque centrale' });
    expect(second.view()).toBe('pen');
  });

  it('conserve prêts, retours, réservations, encaissements et livres ajoutés', () => {
    const persistence = browser();
    const first = reload(persistence);
    first.returnLoan(1);
    first.payFine(1);
    first.cancelReservation(4);
    first.createLoan('ADH-0190', '843 FAY');
    first.addBook({ t: 'Nouveau', a: 'Auteur', c: '843 NEW', k: 'Roman', n: 1, y: 2021, s: '', img: '' });

    const second = reload(persistence);
    expect(second.loans().find((l) => l.id === 1)).toMatchObject({ ret: 0, paid: 1 });
    expect(second.reservations().find((r) => r.id === 4)?.s).toBe('annulee');
    expect(second.loans().length).toBe(11);
    expect(second.books().length).toBe(11);
  });

  it('ne garde la session que jusqu’à la fermeture du navigateur sans « Rester connecté »', () => {
    const persistence = browser();
    reload(persistence).login('salimata@biblio.ci', 'secret', false);
    expect(persistence.local!.getItem(STORAGE_KEYS.session)).toBeNull();
    expect(persistence.session!.getItem(STORAGE_KEYS.session)).not.toBeNull();
    expect(reload(persistence).session()?.user).toBe('Salimata D., comptoir 1');

    persistence.session!.clear();
    expect(reload(persistence).session()).toBeNull();
  });

  it('oublie la session à la déconnexion mais garde les données', () => {
    const persistence = browser();
    const first = reload(persistence);
    first.login('salimata@biblio.ci', 'secret');
    first.returnLoan(1);
    first.leave();

    const second = reload(persistence);
    expect(second.session()).toBeNull();
    expect(second.loans().find((l) => l.id === 1)?.ret).toBe(0);
  });

  it('repart des données de démonstration si le stockage est illisible', () => {
    const persistence = browser();
    persistence.local!.setItem(STORAGE_KEYS.data, '{oups');
    persistence.local!.setItem(STORAGE_KEYS.session, '{"user":42}');
    const store = reload(persistence);
    expect(store.books().length).toBe(10);
    expect(store.session()).toBeNull();
  });

  it('prévient quand le stockage du navigateur est plein', () => {
    const store = reload({ local: new FullStorage(), session: new FullStorage() });
    store.returnLoan(1);
    expect(store.toastMessage()).toBe(
      'Stockage du navigateur plein : les dernières modifications ne seront pas conservées au rechargement.',
    );
  });
});
