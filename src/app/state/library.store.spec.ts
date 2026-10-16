import { LibraryStore } from './library.store';

describe('LibraryStore — données de démonstration', () => {
  it('charge les jeux de la maquette', () => {
    const store = new LibraryStore();
    expect(store.members().length).toBe(8);
    expect(store.books().length).toBe(10);
    expect(store.loans().length).toBe(10);
    expect(store.reservations().length).toBe(4);
    expect(store.catalogTotals().titles).toBe(10);
    expect(store.catalogTotals().copies).toBe(17);
    expect(store.catalogTotals().available).toBe(9);
  });
});

describe('LibraryStore — dérivés', () => {
  it('compte les retards et les réservations actives', () => {
    const store = new LibraryStore();
    expect(store.overdueCount()).toBe(2);
    expect(store.activeReservationCount()).toBe(4);
  });

  it('recalcule les dérivés après une mutation', () => {
    const store = new LibraryStore();
    store.returnLoan(1);
    expect(store.overdueCount()).toBe(1);
    expect(store.unpaid('ADH-0412')).toBe(1700);
    store.payFine(1);
    expect(store.unpaid('ADH-0412')).toBe(800);
  });
});

describe('LibraryStore — prêts et retours', () => {
  it('prête un exemplaire disponible et pose le tampon', () => {
    const store = new LibraryStore();
    const error = store.createLoan('adh-0190', '843 fay');
    expect(error).toBe('');
    expect(store.loans().length).toBe(11);
    expect(store.stamp()?.title).toBe('Petit pays');
    expect(store.stamp()?.member).toBe('Kouamé N’Guessan');
  });

  it('refuse un prêt quand aucune carte ne correspond', () => {
    const store = new LibraryStore();
    expect(store.createLoan('ADH-9999', '843 FAY')).toBe(
      'Carte adhérent inconnue.',
    );
  });

  it('bloque un adhérent à 500 FCFA d’impayés', () => {
    const store = new LibraryStore();
    expect(store.createLoan('ADH-0412', '843 BAA')).toBe(
      'Prêt bloqué : 800 FCFA de pénalités impayées. Rendez-vous à l’onglet Pénalités.',
    );
  });

  it('enregistre un retour tardif avec pénalité', () => {
    const store = new LibraryStore();
    store.returnLoan(1);
    expect(store.toastMessage()).toBe(
      'Retour enregistré. Pénalité de 900 FCFA pour Awa Koné.',
    );
    expect(store.loans().find((l) => l.id === 1)?.ret).toBe(0);
  });

  it('promeut la réservation en attente la plus ancienne à la libération', () => {
    const store = new LibraryStore();
    store.returnLoan(4);
    const promoted = store.reservations().find((r) => r.id === 1);
    expect(promoted?.s).toBe('prete');
    expect(promoted?.exp).toBe(3);
    expect(store.toastMessage()).toContain(
      'Réservation de Aminata Diallo prête, à retirer avant le',
    );
  });

  it('honore la réservation prête lors de l’emprunt', () => {
    const store = new LibraryStore();
    store.returnLoan(4);
    const error = store.createLoan('ADH-0601', '843 KOU-1');
    expect(error).toBe('');
    expect(store.reservations().find((r) => r.id === 1)?.s).toBe('honoree');
  });
});

describe('LibraryStore — réservations', () => {
  it('refuse de réserver un titre disponible', () => {
    const store = new LibraryStore();
    store.reserve(1, 'ADH-0601');
    expect(store.toastMessage()).toBe(
      'Un exemplaire est disponible : enregistrez plutôt le prêt.',
    );
    expect(store.reservations().length).toBe(4);
  });

  it('refuse un doublon de réservation', () => {
    const store = new LibraryStore();
    store.reserve(2, 'ADH-0601');
    expect(store.toastMessage()).toBe(
      'Cet adhérent a déjà réservé ce livre.',
    );
    expect(store.reservations().length).toBe(4);
  });

  it('crée une réservation sinon', () => {
    const store = new LibraryStore();
    store.reserve(2, 'ADH-0276');
    expect(store.reservations().length).toBe(5);
    expect(store.toastMessage()).toBe(
      'Réservation enregistrée pour Mariam Bamba.',
    );
  });

  it('annule et promeut la suivante quand une réservation prête est annulée', () => {
    const store = new LibraryStore();
    store.returnLoan(4);
    store.cancelReservation(1);
    expect(store.reservations().find((r) => r.id === 1)?.s).toBe('annulee');
    expect(store.reservations().find((r) => r.id === 2)?.s).toBe('prete');
    expect(store.toastMessage()).toBe('Réservation annulée.');
  });
});

describe('LibraryStore — pénalités', () => {
  it('encaisse une pénalité et met à jour le total', () => {
    const store = new LibraryStore();
    expect(store.unpaid('ADH-0412')).toBe(800);
    store.payFine(7);
    expect(store.unpaid('ADH-0412')).toBe(0);
    expect(store.toastMessage()).toBe(
      '800 FCFA encaissés auprès de Awa Koné.',
    );
  });
});

describe('LibraryStore — authentification', () => {
  it('ouvre une session après connexion valide', () => {
    const store = new LibraryStore();
    expect(store.login('salimata@biblio.ci', 'secret')).toBe('');
    expect(store.session()?.user).toBe('Salimata D., comptoir 1');
    expect(store.session()?.place).toBe('Bibliothèque centrale');
    expect(store.view()).toBe('cat');
  });

  it('refuse une connexion invalide', () => {
    const store = new LibraryStore();
    expect(store.login('x', 'y')).toBe(
      'Saisissez une adresse e-mail valide.',
    );
    expect(store.session()).toBeNull();
  });

  it('ferme la session à la déconnexion', () => {
    const store = new LibraryStore();
    store.login('salimata@biblio.ci', 'secret');
    store.leave();
    expect(store.session()).toBeNull();
  });
});

describe('LibraryStore — ajout de livre', () => {
  it('ajoute un livre et expose le message d’erreur', () => {
    const store = new LibraryStore();
    expect(
      store.addBook({
        t: 'Nouveau',
        a: 'Auteur',
        c: '843 BAA',
        k: 'Roman',
        n: 1,
        y: 2020,
        s: '',
        img: '',
      }),
    ).toBe('Cette cote existe déjà dans le catalogue.');
    expect(store.books().length).toBe(10);
    expect(
      store.addBook({
        t: 'Nouveau',
        a: 'Auteur',
        c: '843 NEW',
        k: 'Roman',
        n: 2,
        y: 2021,
        s: '',
        img: '',
      }),
    ).toBe('');
    expect(store.books().length).toBe(11);
    expect(store.toastMessage()).toBe('« Nouveau » ajouté au catalogue.');
  });
});
