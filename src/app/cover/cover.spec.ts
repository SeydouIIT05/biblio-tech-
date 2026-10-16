import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cover } from './cover';

describe('Cover', () => {
  let fixture: ComponentFixture<Cover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Cover] }).compileComponents();
    fixture = TestBed.createComponent(Cover);
  });

  const el = <T extends Element>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector) as T | null;

  it('génère une couverture colorée sans image', () => {
    fixture.componentRef.setInput('book', { id: 1, t: 'Titre', a: 'Auteur' });
    fixture.detectChanges();
    const cover = el<HTMLDivElement>('.cv')!;
    expect(cover.classList.contains('g')).toBe(true);
    expect(cover.textContent).toContain('Titre');
    expect(cover.textContent).toContain('Auteur');
    expect(cover.style.backgroundColor).toBe('rgb(180, 68, 31)');
  });

  it('affiche l’image de couverture avec un libellé accessible', () => {
    fixture.componentRef.setInput('book', {
      id: 2,
      t: 'Titre',
      a: 'Auteur',
      img: 'data:image/png;base64,AAAA',
    });
    fixture.detectChanges();
    const cover = el<HTMLDivElement>('.cv')!;
    expect(cover.getAttribute('role')).toBe('img');
    expect(cover.getAttribute('aria-label')).toBe('Couverture de Titre');
    expect(cover.style.backgroundImage).toContain('data:image/png');
  });

  it('applique la variante vignette', () => {
    fixture.componentRef.setInput('book', { id: 3, t: 'Titre', a: 'Auteur' });
    fixture.componentRef.setInput('variant', 'th');
    fixture.detectChanges();
    expect(el<HTMLDivElement>('.cv')!.classList.contains('th')).toBe(true);
  });
});
