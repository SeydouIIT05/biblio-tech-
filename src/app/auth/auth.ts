import { Component, inject, signal } from '@angular/core';
import { LibraryStore } from '../state/library.store';
import { isEmail } from '../state/rules';

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
    const email = this.email().trim();
    if (isEmail(email)) {
      this.errIn.set(`Un lien de réinitialisation a été envoyé à ${email}.`);
      this.errInOk.set(true);
    } else {
      this.errIn.set('Saisissez votre e-mail ci-dessus pour recevoir le lien.');
      this.errInOk.set(false);
    }
  }

  protected login(): void {
    const error = this.store.login(this.email().trim(), this.password());
    if (error) {
      this.errIn.set(error);
      this.errInOk.set(false);
    }
  }

  protected signup(): void {
    this.errUp.set(
      this.store.signup({
        b: this.sB(),
        n: this.sN(),
        t: this.sT(),
        e: this.sE(),
        p: this.sP(),
        c: this.sC(),
        k: this.sK(),
      }),
    );
  }
}
