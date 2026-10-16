import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookPanel } from './book-panel';
import { LibraryStore } from '../state/library.store';

describe('BookPanel', () => {
  let fixture: ComponentFixture<BookPanel>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookPanel] }).compileComponents();
    fixture = TestBed.createComponent(BookPanel);
    store = TestBed.inject(LibraryStore);
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  it('reste vide sans sélection', () => {
    fixture.detectChanges();
    expect(el('h3')).toBeNull();
  });

  it('affiche le contenu d’un livre prêté', () => {
    store.selectBook(1);
    fixture.detectChanges();
    expect(el('h3')?.textContent).toBe('Une si longue lettre');
    expect(el('.st')?.textContent).toBe('Disponible');
    expect(el('dl')?.textContent).toContain('1 sur 2');
    expect(el('dl')?.textContent).toContain('Awa Koné, retour le 7 oct.');
  });

  it('affiche les réservataires d’un livre réservé', () => {
    store.selectBook(2);
    fixture.detectChanges();
    expect(el('.st')?.textContent).toBe('Réservé');
    expect(el('dl')?.textContent).toContain('Aminata Diallo');
    expect(el('dl')?.textContent).toContain('Ibrahim Ouattara');
  });

  it('ferme la fiche par le bouton, le voile et Échap', () => {
    store.selectBook(1);
    fixture.detectChanges();
    el<HTMLButtonElement>('button[aria-label="Fermer la fiche"]')!.click();
    expect(store.selectedBook()).toBeNull();

    store.selectBook(1);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(store.selectedBook()).toBeNull();
  });

  it('refuse de réserver un titre disponible', () => {
    store.selectBook(1);
    fixture.detectChanges();
    el<HTMLButtonElement>('.btn')!.click();
    fixture.detectChanges();
    expect(store.toastMessage()).toBe(
      'Un exemplaire est disponible : enregistrez plutôt le prêt.',
    );
    expect(store.reservations().length).toBe(4);
  });

  it('refuse un doublon puis crée la réservation', () => {
    store.selectBook(2);
    fixture.detectChanges();
    const select = el<HTMLSelectElement>('select')!;
    select.value = 'ADH-0601';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el<HTMLButtonElement>('.btn')!.click();
    expect(store.toastMessage()).toBe('Cet adhérent a déjà réservé ce livre.');

    select.value = 'ADH-0276';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el<HTMLButtonElement>('.btn')!.click();
    expect(store.reservations().length).toBe(5);
    expect(store.toastMessage()).toBe(
      'Réservation enregistrée pour Mariam Bamba.',
    );
  });
});
