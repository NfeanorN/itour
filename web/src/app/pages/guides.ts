import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api';
import { GuideCard } from '../core/models';

@Component({
  selector: 'app-guides',
  imports: [RouterLink],
  template: `
    <section class="wrap">
      <p class="kicker">Только для группы</p>
      <h1>Гайд</h1>
      <p class="lead">Виза, документы, подача, сборы. Читайте по порядку — так меньше ошибок.</p>
      <div class="list">
        @for (g of guides(); track g.slug) {
          <a [routerLink]="['/guide', g.slug]">
            <span>{{ g.kicker }}</span>
            <strong>{{ g.title }}</strong>
          </a>
        }
      </div>
    </section>
  `,
  styles: `
    .wrap { padding: 140px 36px 80px; max-width: 860px; margin: 0 auto; }
    .kicker { color: #86868b; letter-spacing: 0.14em; text-transform: uppercase; font-size: 12px; }
    h1 { font-size: clamp(48px, 8vw, 80px); letter-spacing: -0.05em; margin: 8px 0 16px; }
    .lead { color: #a1a1a6; font-size: 20px; max-width: 520px; }
    .list { display: grid; gap: 12px; margin-top: 48px; }
    a {
      display: grid; gap: 6px; padding: 22px 24px;
      border-radius: 22px; background: rgb(255 255 255 / 0.04);
      color: inherit; text-decoration: none;
      border: 1px solid rgb(255 255 255 / 0.06);
    }
    a span { color: #86868b; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
    a strong { font-size: 24px; letter-spacing: -0.03em; }
    @media (max-width: 640px) { .wrap { padding: 120px 18px 60px; } }
  `,
})
export class Guides {
  private readonly api = inject(ApiService);
  readonly guides = signal<GuideCard[]>([]);

  constructor() {
    this.api.guides().subscribe((g) => this.guides.set(g));
  }
}
