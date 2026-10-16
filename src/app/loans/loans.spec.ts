import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Loans } from './loans';
import { LibraryStore } from '../state/library.store';

describe('Loans', () => {
  let fixture: ComponentFixture<Loans>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Loans] }).compileComponents();
    fixture = TestBed.createComponent(Loans);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  const rows = (): HTMLTableRowElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));

  it('affiche le sous-titre et les prêts triés par échéance', () => {
    expect(el('.sub')?.textContent).toBe(
      '8 prêts en cours, dont 2 en retard. Durée de prêt : 14 jours.',
    );
    expect(rows().length).toBe(8);
    expect(rows()[0].textContent).toContain('Awa Koné');
    expect(rows()[7].textContent).toContain('Fatoumata Traoré');
  });

  it('affiche les trois états d’échéance', () => {
    const first = rows()[0];
    expect(first.querySelector('td:nth-child(5)')?.textContent).toBe(
      'Retard de 9 j',
    );
    const today = rows().find((r) =>
      r.querySelector('td:nth-child(5)')?.textContent?.includes('Aujourd’hui'),
    );
    expect(today).toBeTruthy();
    const soon = rows().find((r) =>
      r.querySelector('td:nth-child(5)')?.textContent?.includes('dans 2 j'),
    );
    expect(soon).toBeTruthy();
  });

  it('enregistre un prêt valide et pose le tampon', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.form input');
    (inputs[0] as HTMLInputElement).value = 'ADH-0190';
    inputs[0].dispatchEvent(new Event('input'));
    (inputs[1] as HTMLInputElement).value = '843 FAY';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el<HTMLButtonElement>('.btn')!.click();
    fixture.detectChanges();
    expect(el('.stamp strong')?.textContent).toBe('30 oct.');
    expect(el('.stamp em')?.textContent).toBe('Petit pays, pour Kouamé N’Guessan');
    expect(store.loans().length).toBe(11);
  });

  it('affiche l’erreur de validation', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.form input');
    (inputs[0] as HTMLInputElement).value = 'ADH-9999';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el<HTMLButtonElement>('.btn')!.click();
    fixture.detectChanges();
    expect(el('#msg')?.textContent).toBe('Carte adhérent inconnue.');
  });

  it('enregistre un retour', () => {
    const first = rows()[0];
    (first.querySelector('.ghost') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.loans().find((l) => l.id === 1)?.ret).toBe(0);
    expect(el('.sub')?.textContent).toContain('7 prêts en cours');
  });
});
