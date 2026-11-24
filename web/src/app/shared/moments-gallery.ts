import { Component, computed, ElementRef, HostListener, inject, input, signal, viewChild } from '@angular/core';
import { I18nService } from '../core/i18n';
import { MomentPhoto } from '../data/tour';

@Component({
  selector: 'app-moments-gallery',
  template: `
    <div class="grid">
      @for (m of moments(); track m.id; let i = $index) {
        <button
          type="button"
          class="shot"
          (click)="openAt(i)"
          [attr.aria-label]="i18n.t('Фотоны ашу: ', 'Открыть фото: ') + i18n.pick(m.city)"
        >
          <img [src]="m.image" [alt]="i18n.pick(m.city) + ' — ' + i18n.pick(m.caption)" loading="lazy" />
          <div class="meta">
            <span class="pill">{{ i18n.pick(m.tag) }}</span>
            <strong>{{ i18n.pick(m.city) }}</strong>
          </div>
        </button>
      }
    </div>

    <dialog #box class="lightbox" (click)="onBackdrop($event)" (cancel)="close()">
      @if (active(); as cur) {
        <div class="frame" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="lb-close"
            (click)="close()"
            [attr.aria-label]="i18n.t('Жабу', 'Закрыть')"
          >
            ✕
          </button>
          <button
            type="button"
            class="lb-nav lb-nav--prev"
            (click)="step(-1)"
            [attr.aria-label]="i18n.t('Алдыңғы фото', 'Предыдущее фото')"
          >
            ‹
          </button>
          <img [src]="cur.image" [alt]="i18n.pick(cur.city)" />
          <button
            type="button"
            class="lb-nav lb-nav--next"
            (click)="step(1)"
            [attr.aria-label]="i18n.t('Келесі фото', 'Следующее фото')"
          >
            ›
          </button>
          <div class="lb-cap">
            <div>
              <span>{{ i18n.pick(cur.tag) }}</span>
              <strong>{{ i18n.pick(cur.city) }}</strong>
              <p>{{ i18n.pick(cur.caption) }}</p>
            </div>
            <span class="lb-count">{{ activeIndex() + 1 }} / {{ moments().length }}</span>
          </div>
        </div>
      }
    </dialog>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    .shot {
      position: relative;
      display: block;
      width: 100%;
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      background: var(--ink-dark);
      aspect-ratio: 9 / 16;
      cursor: pointer;
      text-align: left;
      box-shadow: var(--shadow-sm);
      transition: transform 0.22s ease, box-shadow 0.22s ease;
    }

    .shot:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .shot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.45s ease;
    }

    .shot:hover img {
      transform: scale(1.035);
    }

    .meta {
      position: absolute;
      inset: auto 0 0;
      padding: 40px 14px 14px;
      background: linear-gradient(180deg, transparent 0%, rgba(11, 19, 36, 0.84) 100%);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pill {
      width: fit-content;
      padding: 3px 9px;
      border-radius: var(--r-pill);
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(8px);
      color: #f8fafc;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .meta strong {
      color: #ffffff;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .lightbox {
      padding: 0;
      border: 0;
      background: transparent;
      max-width: min(460px, calc(100vw - 24px));
      max-height: calc(100svh - 24px);
      overflow: visible;
    }

    .lightbox::backdrop {
      background: rgba(8, 13, 24, 0.82);
      backdrop-filter: blur(8px);
    }

    .frame {
      position: relative;
      border-radius: 22px;
      overflow: hidden;
      background: #080d18;
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: var(--shadow-lg);
    }

    .frame img {
      width: 100%;
      max-height: 76svh;
      object-fit: contain;
      background: #080d18;
    }

    .lb-close {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 5;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(8, 13, 24, 0.72);
      color: #ffffff;
      cursor: pointer;
    }

    .lb-nav {
      position: absolute;
      top: 42%;
      z-index: 5;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: rgba(8, 13, 24, 0.72);
      color: #ffffff;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      display: grid;
      place-items: center;
    }

    .lb-nav--prev {
      left: 10px;
    }

    .lb-nav--next {
      right: 10px;
    }

    .lb-cap {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      padding: 14px 18px 16px;
      color: #f8fafc;
    }

    .lb-cap span {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gold);
    }

    .lb-cap strong {
      font-size: 18px;
      font-weight: 800;
    }

    .lb-cap p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.4;
    }

    .lb-count {
      font-family: var(--font-mono);
      font-size: 12px;
      color: #94a3b8 !important;
      white-space: nowrap;
    }

    @media (max-width: 960px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 560px) {
      .grid {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        gap: 12px;
        padding-bottom: 6px;
        scrollbar-width: none;
      }
      .grid::-webkit-scrollbar {
        display: none;
      }
      .shot {
        flex: 0 0 74%;
        scroll-snap-align: start;
      }
    }
  `,
})
export class MomentsGallery {
  readonly i18n = inject(I18nService);
  readonly moments = input.required<MomentPhoto[]>();
  private readonly box = viewChild<ElementRef<HTMLDialogElement>>('box');

  readonly activeIndex = signal(-1);
  readonly active = computed(() => {
    const idx = this.activeIndex();
    const list = this.moments();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  openAt(index: number): void {
    this.activeIndex.set(index);
    const el = this.box()?.nativeElement;
    if (el && !el.open) {
      el.showModal();
    }
  }

  close(): void {
    this.activeIndex.set(-1);
    const el = this.box()?.nativeElement;
    if (el?.open) {
      el.close();
    }
  }

  step(delta: number): void {
    const len = this.moments().length;
    if (!len) {
      return;
    }
    this.activeIndex.update((i) => (i + delta + len) % len);
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === this.box()?.nativeElement) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.activeIndex() < 0) {
      return;
    }
    if (e.key === 'ArrowRight') {
      this.step(1);
    } else if (e.key === 'ArrowLeft') {
      this.step(-1);
    }
  }
}
