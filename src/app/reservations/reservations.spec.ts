import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reservations } from './reservations';
import { LibraryStore } from '../state/library.store';

describe('Reservations', () => {
  let fixture: ComponentFixture<Reservations>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Reservations] }).compileComponents();
    fixture = TestBed.createComponent(Reservations);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const rows = (): HTMLTableRowElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));

  it('affiche le sous-titre et les rangs', () => {
    expect(el('.sub')?.textContent).toBe(
      '4 demandes actives, dont 0 à retirer au comptoir. Un exemplaire rendu est gardé 3 jours.',
    );
    expect(rows().length).toBe(4);
    expect(rows()[0].querySelector('td')?.textContent?.trim()).toBe('1');
    expect(rows()[1].querySelector('td')?.textContent?.trim()).toBe('2');
    expect(rows()[2].querySelector('td')?.textContent?.trim()).toBe('1');
    expect(rows()[0].textContent).toContain(
      'En attente, tous les exemplaires sont prêtés',
    );
  });

  it('affiche la date limite d’une réservation prête', () => {
    store.returnLoan(4);
    fixture.detectChanges();
    expect(el('.sub')?.textContent).toContain('dont 1 à retirer au comptoir');
    expect(rows()[0].querySelector('td')?.textContent?.trim()).toBe('—');
    expect(rows()[0].textContent).toContain('À retirer avant le 19 oct.');
  });

  it('annule une réservation et promeut la suivante', () => {
    store.returnLoan(4);
    fixture.detectChanges();
    (rows()[0].querySelector('.ghost') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.reservations().find((r) => r.id === 1)?.s).toBe('annulee');
    expect(store.reservations().find((r) => r.id === 2)?.s).toBe('prete');
    expect(el('.sub')?.textContent).toContain('3 demandes actives');
    expect(store.toastMessage()).toBe('Réservation annulée.');
  });
});
