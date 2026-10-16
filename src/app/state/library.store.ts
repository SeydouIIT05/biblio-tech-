import { Inject, Injectable, Optional, Signal, WritableSignal, computed, signal } from '@angular/core';
import {
  LIBRARY_PERSISTENCE,
  LibraryPersistence,
  STORAGE_KEYS,
  readJson,
  removeKey,
  writeJson,
} from './persistence';
import {
  Book,
  Loan,
  Member,
  Reservation,
  Session,
  ViewId,
  BOOKS,
  LOANS,
  MEMBERS,
  P,
  RESERVATIONS,
  T,
} from './demo-data';
import {
  AddBookInput,
  LibraryState,
  SignupInput,
  activeReservations,
  addBookError,
  avail,
  checkLoan,
  delay,
  findBook,
  findMember,
  fine,
  fmtDate,
  fr,
  loginError,
  nextWaiting,
  signupError,
  unpaid,
} from './rules';

export interface Stamp {
  date: string;
  title: string;
  member: string;
}

const PROMOTION_OFFSET = T + 3;
const TOAST_DURATION = 4200;
const VIEWS: ViewId[] = ['cat', 'add', 'emp', 'res', 'pen', 'sta'];
const STORAGE_FULL =
  'Stockage du navigateur plein : les dernières modifications ne seront pas conservées au rechargement.';

interface SavedSession extends Session {
  view: ViewId;
}

function isSavedSession(value: unknown): value is SavedSession {
  const s = value as SavedSession | null;
  return typeof s?.user === 'string' && typeof s.place === 'string';
}

function isLibraryState(value: unknown): value is LibraryState {
  const d = value as LibraryState | null;
  return (
    Array.isArray(d?.members) &&
    Array.isArray(d.books) &&
    Array.isArray(d.loans) &&
    Array.isArray(d.reservations)
  );
}

@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly persistence: LibraryPersistence | null;
  private readonly _restored: WritableSignal<boolean>;
  private remember = true;

  /** Faux tant que l'état enregistré dans le navigateur n'a pas été relu. */
  readonly restored: Signal<boolean>;

  private readonly _members = signal<Member[]>(MEMBERS.map((m) => ({ ...m })));
  private readonly _books = signal<Book[]>(BOOKS.map((b) => ({ ...b })));
  private readonly _loans = signal<Loan[]>(LOANS.map((l) => ({ ...l })));
  private readonly _reservations = signal<Reservation[]>(
    RESERVATIONS.map((r) => ({ ...r })),
  );

  private readonly _session = signal<Session | null>(null);
  private readonly _view = signal<ViewId>('cat');
  private readonly _selectedBookId = signal<number | null>(null);
  private readonly _toastMessage = signal('');
  private readonly _toastVisible = signal(false);
  private readonly _loanMessage = signal('');
  private readonly _addMessage = signal('');
  private readonly _stamp = signal<Stamp | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  readonly members = this._members.asReadonly();
  readonly books = this._books.asReadonly();
  readonly loans = this._loans.asReadonly();
  readonly reservations = this._reservations.asReadonly();
  readonly session = this._session.asReadonly();
  readonly view = this._view.asReadonly();
  readonly selectedBookId = this._selectedBookId.asReadonly();
  readonly toastMessage = this._toastMessage.asReadonly();
  readonly toastVisible = this._toastVisible.asReadonly();
  readonly loanMessage = this._loanMessage.asReadonly();
  readonly addMessage = this._addMessage.asReadonly();
  readonly stamp = this._stamp.asReadonly();

  readonly selectedBook = computed<Book | null>(() => {
    const id = this._selectedBookId();
    return id == null ? null : findBook(this._books(), id) ?? null;
  });

  readonly overdueCount = computed(
    () => this._loans().filter((l) => l.ret === null && l.due < T).length,
  );

  readonly activeReservationCount = computed(
    () => activeReservations(this._reservations()).length,
  );

  readonly catalogTotals = computed(() => {
    const books = this._books();
    const loans = this._loans();
    const reservations = this._reservations();
    return {
      titles: books.length,
      copies: books.reduce((s, b) => s + b.n, 0),
      available: books.reduce((s, b) => s + Math.max(0, avail(b, loans, reservations)), 0),
    };
  });

  constructor(
    @Optional() @Inject(LIBRARY_PERSISTENCE) persistence: LibraryPersistence | null = null,
  ) {
    this.persistence = persistence;
    this._restored = signal(persistence === null);
    this.restored = this._restored.asReadonly();
  }

  /** Relit les données, la session et la vue enregistrées par le navigateur. */
  restore(): void {
    if (this._restored() || !this.persistence) return;
    const { local, session } = this.persistence;
    const data = readJson(local, STORAGE_KEYS.data);
    if (isLibraryState(data)) {
      this._members.set(data.members);
      this._books.set(data.books);
      this._loans.set(data.loans);
      this._reservations.set(data.reservations);
    }
    const kept = readJson(local, STORAGE_KEYS.session);
    const saved = isSavedSession(kept) ? kept : readJson(session, STORAGE_KEYS.session);
    if (isSavedSession(saved)) {
      this.remember = saved === kept;
      this._session.set({ user: saved.user, place: saved.place });
      if (VIEWS.includes(saved.view)) this._view.set(saved.view);
    }
    this._restored.set(true);
  }

  private saveData(): void {
    if (!this.persistence || !this._restored()) return;
    if (!writeJson(this.persistence.local, STORAGE_KEYS.data, this.snapshot())) {
      this.showToast(STORAGE_FULL);
    }
  }

  private saveSession(): void {
    if (!this.persistence || !this._restored()) return;
    const { local, session } = this.persistence;
    removeKey(local, STORAGE_KEYS.session);
    removeKey(session, STORAGE_KEYS.session);
    const current = this._session();
    if (!current) return;
    const saved: SavedSession = { ...current, view: this._view() };
    writeJson(this.remember ? local : session, STORAGE_KEYS.session, saved);
  }

  snapshot(): LibraryState {
    return {
      members: this._members(),
      books: this._books(),
      loans: this._loans(),
      reservations: this._reservations(),
    };
  }

  showToast(message: string): void {
    this._toastMessage.set(message);
    this._toastVisible.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this._toastVisible.set(false), TOAST_DURATION);
  }

  setView(view: ViewId): void {
    this._view.set(view);
    this._selectedBookId.set(null);
    this.saveSession();
  }

  selectBook(id: number): void {
    this._selectedBookId.set(id);
  }

  closeBook(): void {
    this._selectedBookId.set(null);
  }

  enter(user: string, place: string, remember = true): void {
    this.remember = remember;
    this._session.set({ user, place });
    this._view.set('cat');
    this._selectedBookId.set(null);
    this.saveSession();
  }

  leave(): void {
    this._session.set(null);
    this._selectedBookId.set(null);
    this.saveSession();
  }

  login(email: string, password: string, remember = true): string {
    const error = loginError(email, password);
    if (error) return error;
    this.enter('Salimata D., comptoir 1', 'Bibliothèque centrale', remember);
    return '';
  }

  signup(input: SignupInput): string {
    const error = signupError(input);
    if (error) return error;
    this.enter(input.n.trim() + ', administrateur', input.b.trim());
    return '';
  }

  addBook(input: AddBookInput): string {
    const error = addBookError(input, this._books());
    this._addMessage.set(error);
    if (error) return error;
    const books = this._books();
    this._books.set([
      ...books,
      {
        id: books.length + 1,
        t: input.t,
        a: input.a,
        c: input.c,
        k: input.k,
        n: input.n,
        y: input.y,
        s: input.s,
        img: input.img,
      },
    ]);
    this.showToast(`« ${input.t} » ajouté au catalogue.`);
    this.saveData();
    return '';
  }

  createLoan(card: string, cote: string): string {
    const check = checkLoan(this.snapshot(), card, cote);
    if (check.error) {
      this._loanMessage.set(check.error);
      return check.error;
    }
    const member = check.member!;
    const book = check.book!;
    if (check.own) {
      const ownId = check.own.id;
      this._reservations.update((rs) =>
        rs.map((r) => (r.id === ownId ? { ...r, s: 'honoree' } : r)),
      );
    }
    const loans = this._loans();
    this._loans.set([
      ...loans,
      { id: loans.length + 1, m: member.id, b: book.id, due: T + P, ret: null, paid: 0 },
    ]);
    this._stamp.set({ date: fmtDate(T + P), title: book.t, member: member.n });
    this._loanMessage.set('');
    this.saveData();
    return '';
  }

  returnLoan(id: number): void {
    const loans = this._loans();
    const loan = loans.find((l) => l.id === id);
    if (!loan) return;
    this._loans.update((ls) => ls.map((l) => (l.id === id ? { ...l, ret: T } : l)));
    let message = delay(loan)
      ? `Retour enregistré. Pénalité de ${fr(fine(loan))} pour ${this.memberName(loan.m)}.`
      : 'Retour enregistré, sans retard.';
    const promoted = this.promote(loan.b);
    if (promoted) {
      message += ` Réservation de ${this.memberName(promoted.m)} prête, à retirer avant le ${fmtDate(promoted.exp!)}.`;
    }
    this.showToast(message);
    this.saveData();
  }

  private promote(bookId: number): Reservation | undefined {
    const state = this.snapshot();
    const waiting = nextWaiting(state.reservations, bookId);
    const book = findBook(state.books, bookId);
    if (
      waiting &&
      book &&
      avail(book, state.loans, state.reservations) > 0
    ) {
      const promoted: Reservation = { ...waiting, s: 'prete', exp: PROMOTION_OFFSET };
      this._reservations.update((rs) =>
        rs.map((r) => (r.id === waiting.id ? promoted : r)),
      );
      return promoted;
    }
    return undefined;
  }

  cancelReservation(id: number): void {
    const reservation = this._reservations().find((r) => r.id === id);
    if (!reservation) return;
    const wasReady = reservation.s === 'prete';
    this._reservations.update((rs) =>
      rs.map((r) => (r.id === id ? { ...r, s: 'annulee' } : r)),
    );
    if (wasReady) this.promote(reservation.b);
    this.showToast('Réservation annulée.');
    this.saveData();
  }

  reserve(bookId: number, memberId: string): void {
    const state = this.snapshot();
    const book = findBook(state.books, bookId);
    if (!book) return;
    if (avail(book, state.loans, state.reservations) > 0) {
      this.showToast('Un exemplaire est disponible : enregistrez plutôt le prêt.');
      return;
    }
    if (
      state.reservations.some(
        (r) =>
          r.b === bookId &&
          r.m === memberId &&
          (r.s === 'attente' || r.s === 'prete'),
      )
    ) {
      this.showToast('Cet adhérent a déjà réservé ce livre.');
      return;
    }
    const rs = this._reservations();
    this._reservations.set([
      ...rs,
      { id: rs.length + 1, m: memberId, b: bookId, s: 'attente', exp: null, req: T },
    ]);
    this.showToast(`Réservation enregistrée pour ${this.memberName(memberId)}.`);
    this.saveData();
  }

  payFine(id: number): void {
    const loans = this._loans();
    const loan = loans.find((l) => l.id === id);
    if (!loan) return;
    this._loans.update((ls) => ls.map((l) => (l.id === id ? { ...l, paid: 1 } : l)));
    this.showToast(`${fr(fine(loan))} encaissés auprès de ${this.memberName(loan.m)}.`);
    this.saveData();
  }

  memberName(id: string): string {
    return findMember(this._members(), id)?.n ?? id;
  }

  unpaid(id: string): number {
    return unpaid(this._loans(), id);
  }
}
