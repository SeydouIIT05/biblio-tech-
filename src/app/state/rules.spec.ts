import { Book, Loan, Member, Reservation } from './demo-data';
import {
  activeReservations,
  addBookError,
  avail,
  bookStatus,
  checkLoan,
  delay,
  fine,
  fmtDate,
  fr,
  loginError,
  nextWaiting,
  rank,
  signupError,
  unpaid,
} from './rules';

const member = (id: string, n: string): Member => ({ id, n });
const book = (id: number, n: number, c = '000 X'): Book => ({
  id,
  t: 'Titre',
  a: 'Auteur',
  c,
  k: 'Roman',
  n,
});
const loan = (
  id: number,
  m: string,
  b: number,
  due: number,
  ret: number | null = null,
  paid = 0,
): Loan => ({ id, m, b, due, ret, paid });
const reservation = (
  id: number,
  m: string,
  b: number,
  s: Reservation['s'] = 'attente',
  req = 0,
): Reservation => ({ id, m, b, s, exp: null, req });

describe('formats', () => {
  it('formate les FCFA en séparant les milliers', () => {
    expect(fr(2000).endsWith(' FCFA')).toBe(true);
    expect(fr(2000).replace(/\D/g, '')).toBe('2000');
  });

  it('décale la date de référence de N jours', () => {
    expect(fmtDate(0)).toContain('16');
    expect(fmtDate(14)).toContain('30');
  });
});

describe('règles de prêt', () => {
  it('calcule un retard de 9 jours', () => {
    const l = loan(1, 'ADH-0412', 1, -9);
    expect(delay(l)).toBe(9);
    expect(fine(l)).toBe(900);
  });

  it('facture 2 000 FCFA pour un prêt non rendu de 20 jours', () => {
    expect(fine(loan(1, 'ADH-0412', 1, -20))).toBe(2000);
  });

  it('borne le retard à zéro pour un retour anticipé', () => {
    expect(delay(loan(1, 'ADH-0412', 1, -9, -2))).toBe(7);
    expect(delay(loan(1, 'ADH-0412', 1, 5, 0))).toBe(0);
  });

  it('cumule les pénalités impayées du membre', () => {
    const loans = [
      loan(1, 'ADH-0412', 1, -9, -5, 0),
      loan(2, 'ADH-0412', 2, -3, -1, 1),
      loan(3, 'ADH-0412', 3, -3, -1, 0),
    ];
    expect(unpaid(loans, 'ADH-0412')).toBe(400 + 200);
  });

  it('calcule les exemplaires libres = copies − prêts − réservations prêtes', () => {
    const b = book(1, 2);
    expect(avail(b, [], [])).toBe(2);
    expect(avail(b, [loan(1, 'ADH-0412', 1, 3)], [])).toBe(1);
    expect(
      avail(b, [loan(1, 'ADH-0412', 1, 3)], [reservation(1, 'ADH-0601', 1, 'prete')]),
    ).toBe(0);
  });

  it('détermine les trois statuts', () => {
    const b = book(1, 1);
    expect(bookStatus(b, [], [])).toEqual({ t: 'Disponible', c: 'vert', i: 'check' });
    expect(bookStatus(b, [loan(1, 'ADH-0412', 1, 3)], [reservation(1, 'ADH-0601', 1)])).toEqual(
      { t: 'Réservé', c: 'ocre', i: 'bookmark' },
    );
    expect(bookStatus(b, [loan(1, 'ADH-0412', 1, 3)], [])).toEqual({
      t: 'Emprunté',
      c: 'bleu',
      i: 'swap',
    });
  });
});

describe('réservations', () => {
  it('filtre les réservations actives', () => {
    const rs = [
      reservation(1, 'A', 1, 'attente'),
      reservation(2, 'B', 1, 'prete'),
      reservation(3, 'C', 1, 'honoree'),
      reservation(4, 'D', 1, 'annulee'),
    ];
    expect(activeReservations(rs).map((r) => r.id)).toEqual([1, 2]);
  });

  it('retient la demande en attente la plus ancienne', () => {
    const rs = [reservation(1, 'A', 2, 'attente', -4), reservation(2, 'B', 2, 'attente', -5)];
    expect(nextWaiting(rs, 2)?.id).toBe(2);
  });

  it('calcule le rang d’une demande en attente', () => {
    const rs = [
      reservation(1, 'A', 2, 'attente', -5),
      reservation(2, 'B', 2, 'attente', -4),
      reservation(3, 'C', 2, 'attente', -3),
    ];
    expect(rank(rs, rs[0])).toBe(1);
    expect(rank(rs, rs[2])).toBe(3);
  });
});

describe('validations', () => {
  it('refuse une connexion invalide puis accepte la valide', () => {
    expect(loginError('nope', 'secret')).toBe(
      'Saisissez une adresse e-mail valide.',
    );
    expect(loginError('a@b.fr', 'court')).toBe(
      'Le mot de passe doit contenir au moins 6 caractères.',
    );
    expect(loginError('a@b.fr', 'secret')).toBe('');
  });

  it('valide le formulaire d’inscription dans l’ordre', () => {
    const base = {
      b: 'Biblio',
      n: 'Awa',
      t: '+2250700000000',
      e: 'awa@biblio.ci',
      p: 'Motdepasse1',
      c: 'Motdepasse1',
      k: true,
    };
    expect(signupError({ ...base, b: '' })).toBe(
      'Indiquez le nom de la bibliothèque.',
    );
    expect(signupError({ ...base, n: ' ' })).toBe('Indiquez votre nom complet.');
    expect(signupError({ ...base, t: '123' })).toBe(
      'Numéro de téléphone invalide : 10 chiffres, avec ou sans +225.',
    );
    expect(signupError({ ...base, e: 'x' })).toBe(
      'Saisissez une adresse e-mail valide.',
    );
    expect(signupError({ ...base, p: 'abc', c: 'abc' })).toBe(
      'Mot de passe : 8 caractères minimum, dont un chiffre.',
    );
    expect(signupError({ ...base, c: 'autre' })).toBe(
      'Les deux mots de passe ne correspondent pas.',
    );
    expect(signupError({ ...base, k: false })).toBe(
      'Acceptez les conditions d’utilisation pour continuer.',
    );
    expect(signupError(base)).toBe('');
  });

  it('valide l’ajout d’un livre dans l’ordre', () => {
    const input = {
      t: 'Titre',
      a: 'Auteur',
      c: '123 ABC',
      k: 'Roman',
      n: 1,
      y: 2020,
      s: '',
      img: '',
    };
    expect(addBookError({ ...input, t: '' }, [])).toBe('Indiquez le titre.');
    expect(addBookError({ ...input, a: '' }, [])).toBe('Indiquez l’auteur.');
    expect(addBookError({ ...input, c: '' }, [])).toBe('Indiquez la cote.');
    expect(addBookError(input, [book(1, 1, '123 ABC')])).toBe(
      'Cette cote existe déjà dans le catalogue.',
    );
    expect(addBookError({ ...input, k: '' }, [])).toBe('Indiquez la catégorie.');
    expect(addBookError({ ...input, n: 0 }, [])).toBe(
      'Le nombre d’exemplaires doit être d’au moins 1.',
    );
    expect(addBookError(input, [])).toBe('');
  });
});

describe('checkLoan', () => {
  const state = {
    members: [member('ADH-0412', 'Awa Koné')],
    books: [book(1, 1, '843 BAA'), book(2, 1, '843 KOU')],
    loans: [] as Loan[],
    reservations: [] as Reservation[],
  };

  it('refuse une carte inconnue', () => {
    expect(checkLoan(state, 'ADH-9999', '843 BAA').error).toBe(
      'Carte adhérent inconnue.',
    );
  });

  it('refuse une cote inconnue', () => {
    expect(checkLoan(state, 'ADH-0412', '000 X').error).toBe(
      'Cote introuvable dans le catalogue.',
    );
  });

  it('bloque un adhérent à 500 FCFA d’impayés', () => {
    const blocked = {
      ...state,
      loans: [loan(1, 'ADH-0412', 1, -8, -3, 0)],
    };
    expect(checkLoan(blocked, 'ADH-0412', '843 KOU').error).toBe(
      'Prêt bloqué : 500 FCFA de pénalités impayées. Rendez-vous à l’onglet Pénalités.',
    );
  });

  it('refuse un livre sans exemplaire disponible', () => {
    const full = { ...state, loans: [loan(1, 'ADH-0412', 2, 3)] };
    expect(checkLoan(full, 'ADH-0412', '843 KOU').error).toBe(
      'Aucun exemplaire disponible. Enregistrez une réservation depuis le catalogue.',
    );
  });

  it('honore une réservation prête même sans exemplaire libre', () => {
    const reserved = {
      ...state,
      loans: [loan(1, 'ADH-0412', 2, 3)],
      reservations: [reservation(1, 'ADH-0412', 2, 'prete')],
    };
    const check = checkLoan(reserved, 'adh-0412', '843 kou');
    expect(check.error).toBeUndefined();
    expect(check.own?.id).toBe(1);
    expect(check.book?.id).toBe(2);
  });
});
