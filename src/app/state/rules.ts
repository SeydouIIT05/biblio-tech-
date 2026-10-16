import {
  BLOQUE,
  Book,
  Loan,
  Member,
  P,
  Reservation,
  T,
  TARIF,
} from './demo-data';

export interface LibraryState {
  members: Member[];
  books: Book[];
  loans: Loan[];
  reservations: Reservation[];
}

export function fmtDate(offset: number): string {
  return new Date(2026, 9, 16 + offset).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function fr(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export function findMember(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function findBook(books: Book[], id: number): Book | undefined {
  return books.find((b) => b.id === id);
}

export function findBookByCote(books: Book[], cote: string): Book | undefined {
  const needle = cote.trim().toLowerCase();
  return books.find((b) => b.c.toLowerCase() === needle);
}

export function outCount(loans: Loan[], bookId: number): number {
  return loans.filter((l) => l.b === bookId && l.ret === null).length;
}

export function heldCount(reservations: Reservation[], bookId: number): number {
  return reservations.filter((r) => r.b === bookId && r.s === 'prete').length;
}

export function avail(
  book: Book,
  loans: Loan[],
  reservations: Reservation[],
): number {
  return book.n - outCount(loans, book.id) - heldCount(reservations, book.id);
}

export function delay(loan: Loan): number {
  return Math.max(0, (loan.ret ?? T) - loan.due);
}

export function fine(loan: Loan): number {
  return delay(loan) * TARIF;
}

export function unpaid(loans: Loan[], memberId: string): number {
  return loans
    .filter((l) => l.m === memberId && l.ret !== null && !l.paid)
    .reduce((sum, l) => sum + fine(l), 0);
}

export interface Status {
  t: string;
  c: string;
  /** Identifiant du pictogramme dans le sprite SVG de app.html. */
  i: string;
}

export function bookStatus(
  book: Book,
  loans: Loan[],
  reservations: Reservation[],
): Status {
  if (avail(book, loans, reservations) > 0) return { t: 'Disponible', c: 'vert', i: 'check' };
  if (reservations.some((r) => r.b === book.id && r.s === 'attente'))
    return { t: 'Réservé', c: 'ocre', i: 'bookmark' };
  return { t: 'Emprunté', c: 'bleu', i: 'swap' };
}

export function activeReservations(reservations: Reservation[]): Reservation[] {
  return reservations.filter((r) => r.s === 'attente' || r.s === 'prete');
}

export function nextWaiting(
  reservations: Reservation[],
  bookId: number,
): Reservation | undefined {
  return reservations
    .filter((r) => r.b === bookId && r.s === 'attente')
    .sort((a, b) => a.req - b.req)[0];
}

export function rank(reservations: Reservation[], reservation: Reservation): number {
  return reservations.filter(
    (r) => r.b === reservation.b && r.s === 'attente' && r.req <= reservation.req,
  ).length;
}

export function promotionDays(): number {
  return T + 3;
}

export function loanDuration(): number {
  return P;
}

export function blockThreshold(): number {
  return BLOQUE;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function loginError(email: string, password: string): string {
  if (!isEmail(email)) return 'Saisissez une adresse e-mail valide.';
  if (password.length < 6)
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  return '';
}

export interface SignupInput {
  b: string;
  n: string;
  t: string;
  e: string;
  p: string;
  c: string;
  k: boolean;
}

export function signupError(input: SignupInput): string {
  if (!input.b.trim()) return 'Indiquez le nom de la bibliothèque.';
  if (!input.n.trim()) return 'Indiquez votre nom complet.';
  if (!/^(\+225)?\d{10}$/.test(input.t.replace(/\s/g, '')))
    return 'Numéro de téléphone invalide : 10 chiffres, avec ou sans +225.';
  if (!isEmail(input.e.trim()))
    return 'Saisissez une adresse e-mail valide.';
  if (input.p.length < 8 || !/\d/.test(input.p))
    return 'Mot de passe : 8 caractères minimum, dont un chiffre.';
  if (input.p !== input.c)
    return 'Les deux mots de passe ne correspondent pas.';
  if (!input.k) return 'Acceptez les conditions d’utilisation pour continuer.';
  return '';
}

export interface AddBookInput {
  t: string;
  a: string;
  c: string;
  k: string;
  n: number;
  y: number;
  s: string;
  img: string;
}

export function addBookError(input: AddBookInput, books: Book[]): string {
  if (!input.t) return 'Indiquez le titre.';
  if (!input.a) return 'Indiquez l’auteur.';
  if (!input.c) return 'Indiquez la cote.';
  if (books.some((b) => b.c.toLowerCase() === input.c.toLowerCase()))
    return 'Cette cote existe déjà dans le catalogue.';
  if (!input.k) return 'Indiquez la catégorie.';
  if (!(input.n >= 1))
    return 'Le nombre d’exemplaires doit être d’au moins 1.';
  return '';
}

export interface LoanCheck {
  error?: string;
  member?: Member;
  book?: Book;
  own?: Reservation;
}

export function checkLoan(
  state: LibraryState,
  card: string,
  cote: string,
): LoanCheck {
  const member = findMember(state.members, card.trim().toUpperCase());
  const book = findBookByCote(state.books, cote);
  if (!member) return { error: 'Carte adhérent inconnue.' };
  if (!book) return { error: 'Cote introuvable dans le catalogue.' };
  const due = unpaid(state.loans, member.id);
  if (due >= BLOQUE)
    return {
      error: `Prêt bloqué : ${fr(due)} de pénalités impayées. Rendez-vous à l’onglet Pénalités.`,
    };
  const own = state.reservations.find(
    (r) => r.b === book.id && r.m === member.id && r.s === 'prete',
  );
  if (!own && avail(book, state.loans, state.reservations) <= 0)
    return {
      error:
        'Aucun exemplaire disponible. Enregistrez une réservation depuis le catalogue.',
    };
  return { member, book, own };
}
