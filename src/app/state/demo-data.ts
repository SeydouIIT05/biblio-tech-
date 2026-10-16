export interface Member {
  id: string;
  n: string;
}

export interface Book {
  id: number;
  t: string;
  a: string;
  c: string;
  k: string;
  n: number;
  y?: number;
  s?: string;
  img?: string;
}

export type ReservationState = 'attente' | 'prete' | 'honoree' | 'annulee';

export interface Loan {
  id: number;
  m: string;
  b: number;
  due: number;
  ret: number | null;
  paid: number;
}

export interface Reservation {
  id: number;
  m: string;
  b: number;
  s: ReservationState;
  exp: number | null;
  req: number;
}

export interface Session {
  user: string;
  place: string;
}

export type ViewId = 'cat' | 'add' | 'emp' | 'res' | 'pen' | 'sta';

export const T = 0;
export const P = 14;
export const TARIF = 100;
export const BLOQUE = 500;

export const REFERENCE_DATE = new Date(2026, 9, 16);
export const REFERENCE_LABEL = 'vendredi 16 octobre 2026';

export const MEMBERS: Member[] = [
  { id: 'ADH-0412', n: 'Awa Koné' },
  { id: 'ADH-0287', n: 'Yao Kouassi' },
  { id: 'ADH-0533', n: 'Fatoumata Traoré' },
  { id: 'ADH-0190', n: 'Kouamé N’Guessan' },
  { id: 'ADH-0601', n: 'Aminata Diallo' },
  { id: 'ADH-0348', n: 'Ibrahim Ouattara' },
  { id: 'ADH-0276', n: 'Mariam Bamba' },
  { id: 'ADH-0455', n: 'Serge Aka' },
];

export const BOOKS: Book[] = [
  { id: 1, t: 'Une si longue lettre', a: 'Mariama Bâ', c: '843 BAA', k: 'Roman', n: 2 },
  { id: 2, t: 'Les Soleils des indépendances', a: 'Ahmadou Kourouma', c: '843 KOU-1', k: 'Roman', n: 1 },
  { id: 3, t: 'L’Aventure ambiguë', a: 'Cheikh Hamidou Kane', c: '843 KAN', k: 'Roman', n: 2 },
  { id: 4, t: 'Allah n’est pas obligé', a: 'Ahmadou Kourouma', c: '843 KOU-2', k: 'Roman', n: 1 },
  { id: 5, t: 'Petit pays', a: 'Gaël Faye', c: '843 FAY', k: 'Roman', n: 3 },
  { id: 6, t: 'Cahier d’un retour au pays natal', a: 'Aimé Césaire', c: '841 CES', k: 'Poésie', n: 1 },
  { id: 7, t: 'Introduction à l’algorithmique', a: 'Cormen, Leiserson, Rivest, Stein', c: '005 COR', k: 'Informatique', n: 2 },
  { id: 8, t: 'Clean Code', a: 'Robert C. Martin', c: '005 MAR', k: 'Informatique', n: 1 },
  { id: 9, t: 'Sapiens', a: 'Yuval Noah Harari', c: '909 HAR', k: 'Histoire', n: 2 },
  { id: 10, t: 'L’Étranger', a: 'Albert Camus', c: '843 CAM', k: 'Roman', n: 2 },
];

export const LOANS: Loan[] = [
  { id: 1, m: 'ADH-0412', b: 1, due: -9, ret: null, paid: 0 },
  { id: 2, m: 'ADH-0287', b: 4, due: -3, ret: null, paid: 0 },
  { id: 3, m: 'ADH-0533', b: 7, due: 2, ret: null, paid: 0 },
  { id: 4, m: 'ADH-0190', b: 2, due: 5, ret: null, paid: 0 },
  { id: 5, m: 'ADH-0601', b: 9, due: 9, ret: null, paid: 0 },
  { id: 6, m: 'ADH-0276', b: 3, due: 0, ret: null, paid: 0 },
  { id: 7, m: 'ADH-0412', b: 5, due: -20, ret: -12, paid: 0 },
  { id: 8, m: 'ADH-0348', b: 8, due: -15, ret: -10, paid: 1 },
  { id: 9, m: 'ADH-0455', b: 6, due: 7, ret: null, paid: 0 },
  { id: 10, m: 'ADH-0533', b: 10, due: 11, ret: null, paid: 0 },
];

export const RESERVATIONS: Reservation[] = [
  { id: 1, m: 'ADH-0601', b: 2, s: 'attente', exp: null, req: -5 },
  { id: 2, m: 'ADH-0348', b: 2, s: 'attente', exp: null, req: -4 },
  { id: 3, m: 'ADH-0533', b: 6, s: 'attente', exp: null, req: -3 },
  { id: 4, m: 'ADH-0276', b: 4, s: 'attente', exp: null, req: -2 },
];

export const CATEGORY_PALETTE = ['#252E3E', '#B4441F', '#2D6A4F', '#2F4F8F', '#8F6609', '#5A3E6B'];
