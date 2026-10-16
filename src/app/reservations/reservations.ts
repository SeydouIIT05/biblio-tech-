import { Component, computed, inject } from '@angular/core';
import { Reservation } from '../state/demo-data';
import { LibraryStore } from '../state/library.store';
import { activeReservations, findBook, fmtDate, rank } from '../state/rules';

@Component({
  selector: 'app-reservations',
  imports: [],
  templateUrl: './reservations.html',
  styles: ':host{display:contents}',
})
export class Reservations {
  private readonly store = inject(LibraryStore);

  protected readonly active = computed(() =>
    activeReservations(this.store.reservations()),
  );

  protected readonly ready = computed(() =>
    this.active().filter((r) => r.s === 'prete'),
  );

  protected rank(reservation: Reservation): number {
    return rank(this.store.reservations(), reservation);
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

  protected cancel(id: number): void {
    this.store.cancelReservation(id);
  }
}
