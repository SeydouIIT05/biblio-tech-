import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Catalogue } from './catalogue';
import { LibraryStore } from '../state/library.store';

describe('Catalogue', () => {
  let fixture: ComponentFixture<Catalogue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Catalogue] }).compileComponents();
    fixture = TestBed.createComponent(Catalogue);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const rows = (): number =>
    fixture.nativeElement.querySelectorAll('tbody tr.k').length;

  it('affiche le sous-titre des totaux', () => {
    expect(el('.sub')?.textContent).toBe(
      '10 titres et 17 exemplaires, dont 9 disponibles au comptoir. 10 affichés.',
    );
    expect(rows()).toBe(10);
  });

  it('filtre par recherche combinée', () => {
    const search = el<HTMLInputElement>('input[type=search]')!;
    search.value = 'kourouma';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(rows()).toBe(2);
    expect(el('.sub')?.textContent).toContain('2 affichés');
  });

  it('filtre par statut', () => {
    const segments = fixture.nativeElement.querySelectorAll('.bar .seg');
    const statusButtons = segments[0].querySelectorAll('button');
    (statusButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows()).toBe(7);
    (statusButtons[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows()).toBe(3);
  });

  it('filtre par catégorie', () => {
    const select = el<HTMLSelectElement>('.bar select')!;
    select.value = 'Informatique';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(rows()).toBe(2);
  });

  it('bascule entre tableau et mosaïque', () => {
    expect(el('table')).toBeTruthy();
    expect(el('.mos')).toBeNull();
    const segments = fixture.nativeElement.querySelectorAll('.bar .seg');
    const layoutButtons = segments[1].querySelectorAll('button');
    (layoutButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el('table')).toBeNull();
    expect(el('.mos')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.mos .bk').length).toBe(10);
  });

  it('affiche les états vides', () => {
    const search = el<HTMLInputElement>('input[type=search]')!;
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(rows()).toBe(0);
    expect(el('.empty')?.textContent).toContain(
      'Aucun livre ne correspond à cette recherche.',
    );
  });

  it('sélectionne un livre au clic', () => {
    const store = TestBed.inject(LibraryStore);
    const firstRow = el<HTMLTableRowElement>('tbody tr.k')!;
    firstRow.click();
    fixture.detectChanges();
    expect(store.selectedBook()?.t).toBe('Une si longue lettre');
  });
});
