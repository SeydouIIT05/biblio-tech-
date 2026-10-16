import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Statistics } from './statistics';
import { LibraryStore } from '../state/library.store';

const normalize = (value: string): string =>
  value.replace(/[\u202f\u00a0]/g, ' ');

describe('Statistics', () => {
  let fixture: ComponentFixture<Statistics>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Statistics] }).compileComponents();
    fixture = TestBed.createComponent(Statistics);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  it('affiche le sous-titre et les huit indicateurs', () => {
    expect(el('.sub')?.textContent).toBe(
      'Situation au 16 oct., d’après les prêts, réservations et pénalités enregistrés.',
    );
    const cards = fixture.nativeElement.querySelectorAll(
      '.kc',
    ) as NodeListOf<Element>;
    expect(cards.length).toBe(8);
    const values = Array.from(cards).map((card) =>
      card.querySelector('strong')?.textContent,
    );
    expect(values).toEqual([
      '10',
      '17',
      '8',
      '2',
      '4',
      '2',
      '8',
      '800 FCFA',
    ]);
  });

  it('affiche les livres les plus empruntés et les catégories', () => {
    const s1 = fixture.nativeElement.querySelectorAll('.desk > div:first-child tbody tr');
    expect(s1.length).toBe(5);
    const s2 = fixture.nativeElement.querySelectorAll('.desk > div:last-child tbody tr');
    expect(s2.length).toBe(4);
    const roman = s2[0] as HTMLTableRowElement;
    expect(roman.querySelector('td')?.textContent).toBe('Roman');
    const cells = Array.from(roman.querySelectorAll('td')).map(
      (td: Element) => td.textContent,
    );
    expect(cells).toEqual(['Roman', '6', '11', '6']);
  });

  it('affiche les adhérents les plus actifs', () => {
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('section > .tw:last-of-type tbody tr'),
    ) as HTMLTableRowElement[];
    expect(rows.length).toBe(8);
    expect(rows[0].textContent).toContain('ADH-0412');
    const cells = Array.from(rows[0].querySelectorAll('td')).map(
      (td: Element) => normalize(td.textContent ?? ''),
    );
    expect(cells).toEqual(['Awa KonéADH-0412', '1', '2', '800 FCFA']);
    expect(rows[1].textContent).toContain('ADH-0533');
  });

  it('recalcule après un prêt, un retour et un encaissement', () => {
    const values = (): string[] =>
      (
        Array.from(
          fixture.nativeElement.querySelectorAll('.kc strong'),
        ) as Element[]
      ).map((s) => normalize(s.textContent ?? ''));
    expect(values()).toEqual(['10', '17', '8', '2', '4', '2', '8', '800 FCFA']);
    expect(store.createLoan('ADH-0190', '843 FAY')).toBe('');
    fixture.detectChanges();
    expect(values()).toEqual(['10', '17', '9', '2', '4', '2', '8', '800 FCFA']);
    store.returnLoan(1);
    fixture.detectChanges();
    expect(values()).toEqual(['10', '17', '8', '1', '4', '3', '8', '1 700 FCFA']);
    store.payFine(7);
    fixture.detectChanges();
    expect(values()).toEqual(['10', '17', '8', '1', '4', '3', '8', '900 FCFA']);
  });
});
