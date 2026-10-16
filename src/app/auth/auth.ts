import { Component, inject, signal } from '@angular/core';
import { LibraryStore } from '../state/library.store';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styles: ':host{display:contents}',
})
export class Auth {
  private readonly store = inject(LibraryStore);

  protected readonly tab = signal<'in' | 'up'>('in');

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showIn = signal(false);
  protected readonly remember = signal(true);
  protected readonly errIn = signal('');
  protected readonly errInOk = signal(false);

  protected readonly sB = signal('');
  protected readonly sY = signal('Municipale');
  protected readonly sV = signal('');
  protected readonly sN = signal('');
  protected readonly sT = signal('');
  protected readonly sE = signal('');
  protected readonly sP = signal('');
  protected readonly sC = signal('');
  protected readonly sK = signal(false);
  protected readonly showUp = signal(false);
  protected readonly errUp = signal('');
  /** Vrai pendant l'appel au serveur : le bouton est désactivé. */
  protected readonly busy = signal(false);

  constructor() {
    this.errIn.set(this.store.consumeAuthNotice());
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected checkedValue(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected setTab(value: 'in' | 'up'): void {
    this.tab.set(value);
    this.errIn.set('');
    this.errInOk.set(false);
    this.errUp.set('');
  }

  protected goIn(event: Event): void {
    event.preventDefault();
    this.setTab('in');
  }

  protected goUp(event: Event): void {
    event.preventDefault();
    this.setTab('up');
  }

  protected forgot(event: Event): void {
    event.preventDefault();
    this.errIn.set('Contactez l’administrateur de votre bibliothèque pour réinitialiser votre mot de passe.');
    this.errInOk.set(false);
  }

  protected async login(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    const error = await this.store.login(this.email().trim(), this.password(), this.remember());
    this.busy.set(false);
    this.errIn.set(error);
    this.errInOk.set(false);
  }

  protected async signup(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    const error = await this.store.signup({
      b: this.sB(),
      y: this.sY(),
      v: this.sV(),
      n: this.sN(),
      t: this.sT(),
      e: this.sE(),
      p: this.sP(),
      c: this.sC(),
      k: this.sK(),
    });
    this.busy.set(false);
    this.errUp.set(error);
  }
}
