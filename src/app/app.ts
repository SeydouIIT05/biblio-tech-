import { Component, effect, inject } from '@angular/core';
import { AddBook } from './add-book/add-book';
import { Auth } from './auth/auth';
import { BookPanel } from './book-panel/book-panel';
import { Catalogue } from './catalogue/catalogue';
import { Loans } from './loans/loans';
import { Penalties } from './penalties/penalties';
import { Reservations } from './reservations/reservations';
import { Statistics } from './statistics/statistics';
import { LibraryStore } from './state/library.store';

@Component({
  selector: 'app-root',
  imports: [Auth, Catalogue, AddBook, Loans, Reservations, Penalties, Statistics, BookPanel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(LibraryStore);

  constructor() {
    effect(() => {
      const connected = this.store.session() !== null;
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('in', connected);
      }
    });
    effect(() => {
      if (this.store.session() && typeof document !== 'undefined') {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }
}

