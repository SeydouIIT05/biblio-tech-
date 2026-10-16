import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { LibraryStore } from './state/library.store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('monte le composant racine', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche l’authentification hors session', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-auth')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
  });

  it('bascule vers le châssis à la connexion', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(LibraryStore).enter(
      'Salimata D., comptoir 1',
      'Bibliothèque centrale',
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-auth')).toBeNull();
    expect(fixture.nativeElement.querySelector('aside')).toBeTruthy();
  });

  it('change la vue affichée via la navigation', () => {
    const store = TestBed.inject(LibraryStore);
    store.enter('Salimata D., comptoir 1', 'Bibliothèque centrale');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#cat')).toBeTruthy();
    (
      fixture.nativeElement.querySelector(
        'nav button[data-v=sta]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#cat')).toBeNull();
    expect(fixture.nativeElement.querySelector('#sta')).toBeTruthy();
  });

  it('affiche les compteurs de navigation', () => {
    const store = TestBed.inject(LibraryStore);
    store.enter('Salimata D., comptoir 1', 'Bibliothèque centrale');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('nav button[data-v=emp] b').textContent,
    ).toBe('2');
    expect(
      fixture.nativeElement.querySelector('nav button[data-v=res] b').textContent,
    ).toBe('4');
  });

  it('affiche un toast lors d’un retour', () => {
    const store = TestBed.inject(LibraryStore);
    store.enter('Salimata D., comptoir 1', 'Bibliothèque centrale');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    store.returnLoan(1);
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('#toast');
    expect(toast.classList.contains('show')).toBe(true);
    expect(toast.textContent).toBe(
      'Retour enregistré. Pénalité de 900 FCFA pour Awa Koné.',
    );
  });
});
