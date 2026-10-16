import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { CATEGORY_PALETTE } from '../state/demo-data';

export interface CoverBook {
  id: number;
  t: string;
  a: string;
  img?: string;
}

@Component({
  selector: 'app-cover',
  imports: [],
  template: `
    @if (book().img) {
      <div
        class="cv"
        [class]="variant()"
        role="img"
        [attr.aria-label]="'Couverture de ' + book().t"
        [style]="coverStyle()"
      ></div>
    } @else {
      <div class="cv g" [class]="variant()" [style]="coverStyle()">
        <span>{{ book().t }}</span><small>{{ book().a }}</small>
      </div>
    }
  `,
  styles: ':host{display:contents}',
})
export class Cover {
  private readonly sanitizer = inject(DomSanitizer);

  readonly book = input.required<CoverBook>();
  readonly variant = input('');

  protected readonly coverStyle = computed<SafeStyle>(() => {
    const book = this.book();
    return this.sanitizer.bypassSecurityTrustStyle(
      book.img
        ? `background-image:url('${book.img}')`
        : `background-color:${CATEGORY_PALETTE[book.id % 6]}`,
    );
  });
}
