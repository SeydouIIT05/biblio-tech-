import { Component, computed, inject } from '@angular/core';
import { Cover } from '../cover/cover';
import { T } from '../state/demo-data';
import { LibraryStore } from '../state/library.store';
import { activeReservations, fine, fmtDate, fr, unpaid } from '../state/rules';

interface Kpi {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-statistics',
  imports: [Cover],
  templateUrl: './statistics.html',
  styles: ':host{display:contents}',
})
export class Statistics {
  private readonly store = inject(LibraryStore);

  protected readonly subtitle = computed(
    () =>
      `Situation au ${fmtDate(0)}, d’après les prêts, réservations et pénalités enregistrés.`,
  );

  protected readonly kpis = computed<Kpi[]>(() => {
    const loans = this.store.loans();
    const current = loans.filter((l) => l.ret === null);
    const late = current.filter((l) => l.due < T).length;
    const due = loans
      .filter((l) => l.ret !== null && !l.paid)
      .reduce((sum, l) => sum + fine(l), 0);
    return [
      { icon: 'book', label: 'Titres', value: String(this.store.books().length) },
      {
        icon: 'copy',
        label: 'Exemplaires',
        value: String(this.store.books().reduce((s, b) => s + b.n, 0)),
      },
      { icon: 'swap', label: 'Prêts en cours', value: String(current.length) },
      { icon: 'clock', label: 'Prêts en retard', value: String(late) },
      {
        icon: 'bookmark',
        label: 'Réservations actives',
        value: String(activeReservations(this.store.reservations()).length),
      },
      {
        icon: 'check',
        label: 'Retours enregistrés',
        value: String(loans.length - current.length),
      },
      { icon: 'users', label: 'Adhérents', value: String(this.store.members().length) },
      { icon: 'coin', label: 'À encaisser', value: fr(due) },
    ];
  });

  protected readonly topBooks = computed(() => {
    const loans = this.store.loans();
    return this.store
      .books()
      .map((book) => ({
        book,
        count: loans.filter((l) => l.b === book.id).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  protected readonly categories = computed(() => {
    const loans = this.store.loans();
    const books = this.store.books();
    return [...new Set(books.map((b) => b.k))].map((k) => {
      const group = books.filter((b) => b.k === k);
      return {
        k,
        titles: group.length,
        copies: group.reduce((s, b) => s + b.n, 0),
        loans: group.reduce(
          (s, b) => s + loans.filter((l) => l.b === b.id).length,
          0,
        ),
      };
    });
  });

  protected readonly activeMembers = computed(() => {
    const loans = this.store.loans();
    return this.store
      .members()
      .map((member) => ({
        member,
        loans: loans.filter((l) => l.m === member.id),
      }))
      .filter((entry) => entry.loans.length > 0)
      .sort((a, b) => b.loans.length - a.loans.length)
      .map((entry) => ({
        member: entry.member,
        current: entry.loans.filter((l) => l.ret === null).length,
        total: entry.loans.length,
        due: unpaid(loans, entry.member.id),
      }));
  });

  protected fmtFcfa(value: number): string {
    return fr(value);
  }
}
