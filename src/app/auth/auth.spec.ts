import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { LibraryStore } from '../state/library.store';

describe('Auth', () => {
  let fixture: ComponentFixture<Auth>;
  let store: LibraryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Auth] }).compileComponents();
    fixture = TestBed.createComponent(Auth);
    store = TestBed.inject(LibraryStore);
    fixture.detectChanges();
  });

  const el = <T extends Element>(selector: string): T =>
    fixture.nativeElement.querySelector(selector) as T;

  const type = (selector: string, value: string): void => {
    const input = el<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  it('affiche la connexion et bascule vers l’inscription', () => {
    expect(el('#fin')).toBeTruthy();
    expect(el('#fup')).toBeNull();
    const tabs = fixture.nativeElement.querySelectorAll('.seg button');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el('#fin')).toBeNull();
    expect(el('#fup')).toBeTruthy();
  });

  it('bascule la visibilité du mot de passe', () => {
    expect(el<HTMLInputElement>('#fin .pw input').type).toBe('password');
    el<HTMLButtonElement>('#fin .eye').click();
    fixture.detectChanges();
    expect(el<HTMLInputElement>('#fin .pw input').type).toBe('text');
    expect(el<HTMLButtonElement>('#fin .eye').textContent).toContain('Masquer');
  });

  it('renseigne le message « Mot de passe oublié »', () => {
    type('#fin input[type=email]', 'salimata@biblio.ci');
    el<HTMLAnchorElement>('#fin .ac a').click();
    fixture.detectChanges();
    expect(el('#fin .err').textContent).toContain(
      'Un lien de réinitialisation a été envoyé à salimata@biblio.ci.',
    );
    expect(el('#fin .err').classList.contains('ok')).toBe(true);
  });

  it('refuse puis accepte une connexion', () => {
    type('#fin input[type=email]', 'pas-un-email');
    el<HTMLButtonElement>('#fin .btn').click();
    fixture.detectChanges();
    expect(el('#fin .err').textContent).toBe(
      'Saisissez une adresse e-mail valide.',
    );
    expect(store.session()).toBeNull();

    type('#fin input[type=email]', 'salimata@biblio.ci');
    type('#fin .pw input', 'secret');
    el<HTMLButtonElement>('#fin .btn').click();
    expect(store.session()?.user).toBe('Salimata D., comptoir 1');
  });

  it('soumet la connexion avec la touche Entrée', () => {
    type('#fin input[type=email]', 'salimata@biblio.ci');
    type('#fin .pw input', 'secret');
    const input = el<HTMLInputElement>('#fin input[type=email]');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(store.session()).not.toBeNull();
  });

  it('refuse puis accepte une inscription', () => {
    el<HTMLButtonElement>('.seg button:nth-child(2)').click();
    fixture.detectChanges();
    el<HTMLButtonElement>('#fup .btn').click();
    fixture.detectChanges();
    expect(el('#fup .err').textContent).toBe(
      'Indiquez le nom de la bibliothèque.',
    );

    type('#fup input[autocomplete=organization]', 'Bibliothèque de Cocody');
    type('#fup input[autocomplete=name]', 'Salimata Diomandé');
    type('#fup input[type=tel]', '+225 07 07 12 34 56');
    type('#fup input[type=email]', 'salimata@biblio.ci');
    const pwds = fixture.nativeElement.querySelectorAll('#fup input[type=password]');
    for (const p of [pwds[0], pwds[1]] as HTMLInputElement[]) {
      p.value = 'Motdepasse1';
      p.dispatchEvent(new Event('input'));
    }
    const check = el<HTMLInputElement>('#fup input[type=checkbox]');
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    el<HTMLButtonElement>('#fup .btn').click();
    expect(store.session()?.user).toBe('Salimata Diomandé, administrateur');
    expect(store.session()?.place).toBe('Bibliothèque de Cocody');
  });
});
