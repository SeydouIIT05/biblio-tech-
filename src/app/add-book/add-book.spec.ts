import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddBook } from './add-book';
import { LibraryStore } from '../state/library.store';

describe('AddBook', () => {
  let fixture: ComponentFixture<AddBook>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AddBook] }).compileComponents();
    fixture = TestBed.createComponent(AddBook);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const inputs = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.form input'));

  const fill = (index: number, value: string): void => {
    const input = inputs()[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  it('met à jour l’aperçu à la frappe', () => {
    expect(el('.pvw .cv span')?.textContent).toBe('Titre du livre');
    fill(0, 'Nouveau titre');
    fill(1, 'Nouvel auteur');
    fixture.detectChanges();
    expect(el('.pvw .cv span')?.textContent).toBe('Nouveau titre');
    expect(el('.pvw .cv small')?.textContent).toBe('Nouvel auteur');
  });

  it('refuse une image trop lourde', () => {
    const fileInput = el<HTMLInputElement>('input[type=file]')!;
    const file = new File([new Uint8Array(4_000_000)], 'big.png', {
      type: 'image/png',
    });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el('.err')?.textContent).toBe('Image trop lourde : 3 Mo maximum.');
  });

  it('refuse une cote déjà présente', () => {
    fill(0, 'Titre');
    fill(1, 'Auteur');
    fill(2, '843 BAA');
    fill(3, 'Roman');
    fill(4, '2020');
    fill(5, '1');
    el<HTMLButtonElement>('.btn')!.click();
    fixture.detectChanges();
    expect(el('.err')?.textContent).toBe(
      'Cette cote existe déjà dans le catalogue.',
    );
    expect(store.books().length).toBe(10);
  });

  it('ajoute un livre, réinitialise et notifie', () => {
    fill(0, 'Petit Manuel');
    fill(1, 'Un Auteur');
    fill(2, '843 PM');
    fill(3, 'Roman');
    fill(4, '2021');
    fill(5, '3');
    el<HTMLButtonElement>('.btn')!.click();
    fixture.detectChanges();
    expect(store.books().length).toBe(11);
    const added = store.books()[10];
    expect(added.t).toBe('Petit Manuel');
    expect(added.n).toBe(3);
    expect(added.y).toBe(2021);
    expect(store.toastMessage()).toBe('« Petit Manuel » ajouté au catalogue.');
    expect(inputs()[0].value).toBe('');
    expect(inputs()[5].value).toBe('1');
    expect(el('.err')?.textContent).toBe('');
  });
});
