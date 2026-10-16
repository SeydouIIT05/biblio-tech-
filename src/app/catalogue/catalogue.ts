import { Component, computed, inject, signal } from '@angular/core';
import { Cover } from '../cover/cover';
import { Book } from '../state/demo-data';
import { LibraryStore } from '../state/library.store';
import { avail, bookStatus } from '../state/rules';

type Layout = 'Tableau' | 'Mosaïque';

@Component({
  selector: 'app-catalogue',
  imports: [Cover],
  templateUrl: './catalogue.html',
  styles: ':host{display:contents}',
})
export class Catalogue {
  private readonly store = inject(LibraryStore);

  protected readonly segments = ['Tous', 'Disponible', 'Réservé', 'Emprunté'];
  protected readonly layouts: { label: Layout; icon: string }[] = [
    { label: 'Tableau', icon: 'list' },
    { label: 'Mosaïque', icon: 'grid' },
  ];

  protected readonly query = signal('');
  protected readonly filter = signal('Tous');
  protected readonly category = signal('Toutes');
  protected readonly layout = signal<Layout>('Tableau');

  protected readonly totals = this.store.catalogTotals;

  protected readonly categories = computed(() => [
    'Toutes',
    ...new Set(this.store.books().map((b) => b.k)),
  ]);

  protected readonly rows = computed<Book[]>(() => {
    const loans = this.store.loans();
    const reservations = this.store.reservations();
    const filter = this.filter();
    const category = this.category();
    const query = this.query().toLowerCase();
    return this.store.books().filter(
      (book) =>
        (filter === 'Tous' || bookStatus(book, loans, reservations).t === filter) &&
        (category === 'Toutes' || book.k === category) &&
        (book.t + book.a + book.c).toLowerCase().includes(query),
    );
  });

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected status(book: Book) {
    return bookStatus(book, this.store.loans(), this.store.reservations());
  }

  protected available(book: Book): number {
    return Math.max(0, avail(book, this.store.loans(), this.store.reservations()));
  }

  protected open(id: number): void {
    this.store.selectBook(id);
  }
}
