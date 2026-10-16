import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { LibraryStore } from './state/library.store';

const normalize = (value: string): string =>
  value.replace(/[\u202f\u00a0]/g, ' ');

describe('Scénario de bout en bout', () => {
  let fixture: ComponentFixture<App>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    fixture = TestBed.createComponent(App);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const setValue = (input: HTMLInputElement, value: string): void => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('connexion → ajout → prêt → retour en retard → encaissement → statistiques', () => {
    // Connexion
    expect(el('app-auth')).toBeTruthy();
    const loginFields = fixture.nativeElement.querySelectorAll('#fin input');
    setValue(loginFields[0], 'salimata@biblio.tech');
    setValue(loginFields[1], 'motdepasse');
    fixture.detectChanges();
    (el('#fin .btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.session()?.user).toBe('Salimata D., comptoir 1');
    expect(document.body.classList.contains('in')).toBe(true);
    expect(el('aside')).toBeTruthy();

    // Ajout d'un livre
    store.setView('add');
    fixture.detectChanges();
    const addFields = fixture.nativeElement.querySelectorAll('#add .form input');
    setValue(addFields[0], 'Une si longue lettre');
    setValue(addFields[1], 'Mariama Bâ');
    setValue(addFields[2], '001 BAA');
    setValue(addFields[3], 'Roman');
    setValue(addFields[4], '2001');
    setValue(addFields[5], '3');
    fixture.detectChanges();
    (el('#add .form .btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.books().length).toBe(11);
    expect(store.toastMessage()).toBe('« Une si longue lettre » ajouté au catalogue.');

    // Prêt
    store.setView('emp');
    fixture.detectChanges();
    const loanFields = fixture.nativeElement.querySelectorAll('.form input');
    setValue(loanFields[0], 'ADH-0190');
    setValue(loanFields[1], '843 FAY');
    fixture.detectChanges();
    (el('.form .btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.loans().length).toBe(11);
    expect(el('.stamp strong')?.textContent).toBe('30 oct.');
    expect(el('.stamp em')?.textContent).toBe('Petit pays, pour Kouamé N’Guessan');

    // Retour en retard
    store.returnLoan(1);
    fixture.detectChanges();
    expect(store.toastMessage()).toBe(
      'Retour enregistré. Pénalité de 900 FCFA pour Awa Koné.',
    );

    // Encaissement
    store.payFine(1);
    fixture.detectChanges();
    expect(store.toastMessage()).toBe('900 FCFA encaissés auprès de Awa Koné.');

    // Statistiques
    store.setView('sta');
    fixture.detectChanges();
    const values = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.kc strong'),
      ) as Element[]
    ).map((s) => normalize(s.textContent ?? ''));
    expect(values).toEqual(['11', '20', '8', '1', '4', '3', '8', '800 FCFA']);
  });
});
