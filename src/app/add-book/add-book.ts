import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Cover } from '../cover/cover';
import { LibraryStore } from '../state/library.store';

const MAX_IMAGE_BYTES = 3e6;
const COVER_WIDTH = 400;
const COVER_HEIGHT = 600;

/** Réduit la couverture en JPEG 400×600 maximum pour qu'elle tienne dans le stockage du navigateur. */
function shrinkCover(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(dataUrl);
    image.onload = () => {
      const scale = Math.min(1, COVER_WIDTH / image.naturalWidth, COVER_HEIGHT / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) return resolve(dataUrl);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(dataUrl);
      }
    };
    image.src = dataUrl;
  });
}

@Component({
  selector: 'app-add-book',
  imports: [Cover],
  templateUrl: './add-book.html',
  styles: ':host{display:contents}',
})
export class AddBook {
  private readonly store = inject(LibraryStore);

  protected readonly t = signal('');
  protected readonly a = signal('');
  protected readonly c = signal('');
  protected readonly k = signal('');
  protected readonly y = signal('');
  protected readonly n = signal('1');
  protected readonly s = signal('');
  protected readonly img = signal('');
  protected readonly message = signal('');

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly categories = computed(() => [
    ...new Set(this.store.books().map((b) => b.k)),
  ]);

  protected readonly previewBook = computed(() => ({
    id: this.store.books().length + 1,
    t: this.t() || 'Titre du livre',
    a: this.a() || 'Auteur',
    img: this.img(),
  }));

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.message.set('');
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      this.message.set('Image trop lourde : 3 Mo maximum.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => this.img.set(await shrinkCover(reader.result as string));
    reader.readAsDataURL(file);
  }

  protected submit(): void {
    const error = this.store.addBook({
      t: this.t().trim(),
      a: this.a().trim(),
      c: this.c().trim(),
      k: this.k().trim(),
      n: Number(this.n()),
      y: Number(this.y()),
      s: this.s().trim(),
      img: this.img(),
    });
    this.message.set(error);
    if (error) return;
    this.t.set('');
    this.a.set('');
    this.c.set('');
    this.k.set('');
    this.y.set('');
    this.n.set('1');
    this.s.set('');
    this.img.set('');
    const fileInput = this.fileInput();
    if (fileInput) fileInput.nativeElement.value = '';
  }
}
