import { Component, inject, input, signal } from '@angular/core';
import { I18nService } from '../core/i18n';
import { HotelTier } from '../data/tour';

@Component({
  selector: 'app-hotel-showcase',
  template: `
    <div class="grid">
      @for (tier of tiers(); track tier.id) {
        <article class="card">
          <div class="top">
            <span class="kicker">{{ tier.flag }} {{ i18n.pick(tier.country) }}</span>
            <span class="stars">{{ i18n.pick(tier.stars) }}</span>
          </div>
          <h3>{{ i18n.pick(tier.title) }}</h3>

          <div class="stage">
            <img
              [src]="activePhoto(tier).url"
              [alt]="i18n.pick(tier.title) + ' — ' + i18n.pick(activePhoto(tier).label)"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <span class="cap">{{ i18n.pick(activePhoto(tier).label) }}</span>
          </div>

          <div
            class="thumbs"
            role="group"
            [attr.aria-label]="i18n.t('Қонақ үй фотолары: ', 'Фото отелей: ') + i18n.pick(tier.country)"
          >
            @for (ph of tier.photos; track ph.url; let i = $index) {
              <button
                type="button"
                class="thumb"
                [class.is-on]="selectedIdx(tier.id) === i"
                (click)="select(tier.id, i)"
                [attr.aria-label]="i18n.pick(ph.label)"
              >
                <img [src]="ph.url" [alt]="i18n.pick(ph.label)" loading="lazy" referrerpolicy="no-referrer" />
              </button>
            }
          </div>

          <p class="desc">{{ i18n.pick(tier.description) }}</p>
        </article>
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .kicker {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--gold-deep);
    }

    .stars {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-subtle);
    }

    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .stage {
      position: relative;
      border-radius: var(--r-md);
      overflow: hidden;
      aspect-ratio: 4 / 3;
      background: var(--surface-soft);
    }

    .stage img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cap {
      position: absolute;
      left: 10px;
      bottom: 10px;
      padding: 4px 10px;
      border-radius: var(--r-pill);
      background: rgba(11, 19, 36, 0.74);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 600;
    }

    .thumbs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .thumb {
      padding: 0;
      border: 2px solid transparent;
      border-radius: 10px;
      overflow: hidden;
      aspect-ratio: 4 / 3;
      background: var(--surface-soft);
      cursor: pointer;
      opacity: 0.72;
      transition: opacity 0.15s ease, border-color 0.15s ease;
    }

    .thumb:hover {
      opacity: 1;
    }

    .thumb.is-on {
      border-color: var(--ruby);
      opacity: 1;
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .desc {
      margin: 2px 0 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-muted);
    }

    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HotelShowcase {
  readonly i18n = inject(I18nService);
  readonly tiers = input.required<HotelTier[]>();
  private readonly picks = signal<Record<string, number>>({});

  selectedIdx(tierId: string): number {
    return this.picks()[tierId] ?? 0;
  }

  activePhoto(tier: HotelTier) {
    const idx = this.selectedIdx(tier.id);
    return tier.photos[idx] ?? tier.photos[0];
  }

  select(tierId: string, idx: number): void {
    this.picks.update((cur) => ({ ...cur, [tierId]: idx }));
  }
}
