import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Penalties } from './penalties';
import { LibraryStore } from '../state/library.store';

const normalize = (value: string): string =>
  value.replace(/[\u202f\u00a0]/g, ' ');

describe('Penalties', () => {
  let fixture: ComponentFixture<Penalties>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Penalties] }).compileComponents();
    fixture = TestBed.createComponent(Penalties);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const rows = (): HTMLTableRowElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));

  it('affiche les cartouches de règles et le sous-titre', () => {
    const cartouches = fixture.nativeElement.querySelectorAll('.rules div');
    expect(cartouches.length).toBe(3);
    expect(cartouches[0].textContent).toBe('14 joursde prêt par livre');
    expect(cartouches[1].textContent).toBe('100 FCFApar jour de retard');
    expect(cartouches[2].textContent).toBe('3 jourspour retirer un livre réservé');
    expect(normalize(el('.sub')!.textContent ?? '')).toBe(
      '100 FCFA par jour de retard. 800 FCFA à encaisser, 1 200 FCFA en cours de calcul sur des livres non rendus. Prêt bloqué dès 500 FCFA impayés.',
    );
  });

  it('trie les impayés d’abord puis par montant décroissant', () => {
    expect(rows().length).toBe(4);
    expect(rows()[0].textContent).toContain('Awa Koné');
    expect(rows()[0].textContent).toContain('Non rendu, le montant augmente');
    expect(rows()[1].textContent).toContain('À encaisser');
    expect(rows()[2].textContent).toContain('Yao Kouassi');
    expect(rows()[3].textContent).toContain('Ibrahim Ouattara');
    expect(rows()[3].textContent).toContain('Réglée');
  });

  it('encaisse une pénalité et met à jour le total', () => {
    const rowToPay = rows().find((r) => r.querySelector('.ghost'))!;
    (rowToPay.querySelector('.ghost') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(normalize(el('.sub')!.textContent ?? '')).toContain('0 FCFA à encaisser');
    expect(fixture.nativeElement.querySelector('tbody .ghost')).toBeNull();
    expect(el('tbody')?.textContent).not.toContain('À encaisser');
    expect(store.unpaid('ADH-0412')).toBe(0);
  });

  it('débloque un adhérent après encaissement', () => {
    expect(store.createLoan('ADH-0412', '843 BAA')).toBe(
      'Prêt bloqué : 800 FCFA de pénalités impayées. Rendez-vous à l’onglet Pénalités.',
    );
    store.payFine(7);
    expect(store.createLoan('ADH-0412', '843 BAA')).toBe('');
  });
});
