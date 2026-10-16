import { Component, computed, inject } from '@angular/core';
import { BLOQUE, P, TARIF } from '../state/demo-data';
import { LibraryStore } from '../state/library.store';
import { Loan } from '../state/demo-data';
import { Status, delay, findBook, fine, fr } from '../state/rules';

@Component({
  selector: 'app-penalties',
  imports: [],
  templateUrl: './penalties.html',
  styles: ':host{display:contents}',
})
export class Penalties {
  private readonly store = inject(LibraryStore);

  protected readonly rules: [string, string][] = [
    [P + ' jours', 'de prêt par livre'],
    [TARIF + ' FCFA', 'par jour de retard'],
    ['3 jours', 'pour retirer un livre réservé'],
  ];

  protected readonly rows = computed(() =>
    this.store
      .loans()
      .filter((l) => fine(l) > 0)
      .sort((a, b) => a.paid - b.paid || fine(b) - fine(a)),
  );

  private readonly toEncash = computed(() =>
    this.store
      .loans()
      .filter((l) => l.ret !== null && !l.paid)
      .reduce((sum, l) => sum + fine(l), 0),
  );

  private readonly running = computed(() =>
    this.store
      .loans()
      .filter((l) => l.ret === null)
      .reduce((sum, l) => sum + fine(l), 0),
  );

  protected readonly subtitle = computed(
    () =>
      `${TARIF} FCFA par jour de retard. ${fr(this.toEncash())} à encaisser, ${fr(this.running())} en cours de calcul sur des livres non rendus. Prêt bloqué dès ${fr(BLOQUE)} impayés.`,
  );

  protected fmtFcfa(value: number): string {
    return fr(value);
  }

  protected delay(loan: Loan): number {
    return delay(loan);
  }

  protected fine(loan: Loan): number {
    return fine(loan);
  }

  protected memberName(id: string): string {
    return this.store.memberName(id);
  }

  protected bookTitle(id: number): string {
    return findBook(this.store.books(), id)?.t ?? '';
  }

  protected situation(loan: Loan): Status {
    if (loan.ret === null) return { t: 'Non rendu, le montant augmente', c: 'ocre', i: 'clock' };
    if (loan.paid) return { t: 'Réglée', c: 'vert', i: 'check' };
    return { t: 'À encaisser', c: 'bleu', i: 'coin' };
  }

  protected pay(id: number): void {
    this.store.payFine(id);
  }
}
