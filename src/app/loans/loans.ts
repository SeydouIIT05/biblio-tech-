import { Component, computed, inject, signal } from '@angular/core';
import { LibraryStore } from '../state/library.store';
import { findBook, fmtDate } from '../state/rules';
import { P, T } from '../state/demo-data';

@Component({
  selector: 'app-loans',
  imports: [],
  templateUrl: './loans.html',
  styles: ':host{display:contents}',
})
export class Loans {
  private readonly store = inject(LibraryStore);

  protected readonly card = signal('');
  protected readonly cote = signal('');
  protected readonly message = this.store.loanMessage;
  protected readonly stamp = this.store.stamp;

  protected readonly currentLoans = computed(() =>
    this.store.loans()
      .filter((l) => l.ret === null)
      .sort((a, b) => a.due - b.due),
  );

  protected readonly overdue = computed(
    () => this.currentLoans().filter((l) => l.due < T).length,
  );

  protected readonly members = this.store.members;
  protected readonly books = this.store.books;

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected memberName(id: string): string {
    return this.store.memberName(id);
  }

  protected bookTitle(id: number): string {
    return findBook(this.store.books(), id)?.t ?? '';
  }

  protected fmt(offset: number): string {
    return fmtDate(offset);
  }

  protected borrowedOn(loan: { due: number }): string {
    return fmtDate(loan.due - P);
  }

  protected countdown(loan: { due: number }): number {
    return loan.due - T;
  }

  protected duration(): number {
    return P;
  }

  protected submit(): void {
    const error = this.store.createLoan(this.card(), this.cote());
    if (!error) {
      this.card.set('');
      this.cote.set('');
    }
  }

  protected returnLoan(id: number): void {
    this.store.returnLoan(id);
  }
}
