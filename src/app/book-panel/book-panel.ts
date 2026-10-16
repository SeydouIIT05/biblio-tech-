import { Component, computed, effect, inject, signal, ElementRef, viewChild, HostListener } from '@angular/core';
import { Cover } from '../cover/cover';
import { LibraryStore } from '../state/library.store';
import { avail, bookStatus, fmtDate } from '../state/rules';

@Component({
  selector: 'app-book-panel',
  imports: [Cover],
  templateUrl: './book-panel.html',
  styles: ':host{display:contents}',
})
export class BookPanel {
  private readonly store = inject(LibraryStore);

  protected readonly book = this.store.selectedBook;
  protected readonly memberId = signal('');

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  protected readonly borrowers = computed(() =>
    this.store.loans().filter((l) => l.b === this.book()?.id && l.ret === null),
  );

  protected readonly waiting = computed(() =>
    this.store.reservations().filter(
      (r) => r.b === this.book()?.id && (r.s === 'attente' || r.s === 'prete'),
    ),
  );

  protected readonly status = computed(() => {
    const book = this.book();
    return book ? bookStatus(book, this.store.loans(), this.store.reservations()) : null;
  });

  protected readonly available = computed(() => {
    const book = this.book();
    return book ? Math.max(0, avail(book, this.store.loans(), this.store.reservations())) : 0;
  });

  protected readonly members = this.store.members;

  constructor() {
    effect(() => {
      this.book();
      this.memberId.set(this.members()[0]?.id ?? '');
    });
    effect(() => {
      const button = this.closeButton();
      if (button && this.book()) {
        button.nativeElement.focus();
      }
    });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected memberName(id: string): string {
    return this.store.memberName(id);
  }

  protected fmt(offset: number): string {
    return fmtDate(offset);
  }

  protected reserve(): void {
    const book = this.book();
    if (book) this.store.reserve(book.id, this.memberId());
  }

  protected close(): void {
    this.store.closeBook();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
