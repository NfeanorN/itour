import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api';
import { GuideCard } from '../core/models';

@Component({
  selector: 'app-guides',
  imports: [RouterLink],
  template: `
    <section class="page wrap">
      <header class="sec-head">
        <p class="sec-kicker">Только для участников ARALA</p>
        <h1 class="sec-title">Визовый гайд <em>и сборы</em></h1>
        <p class="sec-lead">
          Шенген, пакет документов, подача в Италию и подготовка к Классическому Евротуру. Читайте по порядку — так
          подготовка пройдёт спокойно и без ошибок.
        </p>
      </header>

      <div class="list">
        @for (g of guides(); track g.slug; let i = $index) {
          <a [routerLink]="['/guide', g.slug]" class="item">
            <span class="num">0{{ i + 1 }}</span>
            <div class="info">
              <span class="k">{{ g.kicker }}</span>
              <strong>{{ g.title }}</strong>
            </div>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        }
      </div>
    </section>
  `,
  styles: `
    .page {
      padding-top: 120px;
      padding-bottom: 48px;
      max-width: 880px;
    }

    .list {
      display: grid;
      gap: 14px;
      margin-top: 32px;
    }

    .item {
      display: grid;
      grid-template-columns: 44px 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 22px 24px;
      border-radius: var(--r-lg);
      background: var(--surface);
      border: 1px solid var(--border);
      text-decoration: none;
      box-shadow: var(--shadow-sm);
      transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
    }

    .item:hover {
      transform: translateY(-2px);
      border-color: var(--ruby);
      box-shadow: var(--shadow-md);
    }

    .num {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 700;
      color: var(--ruby);
    }

    .info {
      display: grid;
      gap: 4px;
    }

    .k {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--gold-deep);
    }

    strong {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .arrow {
      font-size: 18px;
      font-weight: 800;
      color: var(--alpine);
    }

    @media (max-width: 640px) {
      .item {
        grid-template-columns: 32px 1fr auto;
        padding: 18px;
      }
      strong {
        font-size: 17px;
      }
    }
  `,
})
export class Guides {
  private readonly api = inject(ApiService);
  readonly guides = signal<GuideCard[]>([]);

  constructor() {
    this.api.guides().subscribe((g) => this.guides.set(g));
  }
}
