import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../core/api';
import { I18nService } from '../core/i18n';
import { renderMarkdown } from '../core/markdown';

@Component({
  selector: 'app-guide-detail',
  imports: [RouterLink],
  template: `
    <article class="page wrap">
      <a routerLink="/guide" class="back">{{ i18n.t('← Барлық гайд бөлімдері', '← Все разделы гайда') }}</a>
      @if (html()) {
        <div class="paper">
          <div class="md" [innerHTML]="html()"></div>
        </div>
      } @else if (err()) {
        <div class="paper">
          <p class="err-msg">{{ i18n.t('Гайдты жүктеу мүмкін болмады.', 'Не удалось загрузить раздел гайда.') }}</p>
        </div>
      }
    </article>
  `,
  styles: `
    .page {
      padding-top: 118px;
      padding-bottom: 56px;
      max-width: 820px;
    }

    .back {
      display: inline-flex;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: 700;
      color: var(--alpine);
      text-decoration: none;
    }

    .paper {
      padding: 40px 42px;
      border-radius: var(--r-xl);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }

    .err-msg {
      margin: 0;
      color: var(--danger);
      font-weight: 700;
    }

    :host ::ng-deep .md h1 {
      margin: 0 0 20px;
      font-size: clamp(30px, 5vw, 44px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.08;
      color: var(--text);
    }

    :host ::ng-deep .md h2 {
      margin: 32px 0 12px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ink-dark);
    }

    :host ::ng-deep .md p,
    :host ::ng-deep .md li {
      font-size: 16.5px;
      line-height: 1.65;
      color: var(--text-muted);
    }

    :host ::ng-deep .md strong {
      color: var(--text);
    }

    :host ::ng-deep .md ul,
    :host ::ng-deep .md ol {
      padding-left: 20px;
      display: grid;
      gap: 6px;
    }

    @media (max-width: 640px) {
      .paper {
        padding: 24px 20px;
      }
    }
  `,
})
export class GuideDetail {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(I18nService);
  readonly html = signal<SafeHtml | null>(null);
  readonly err = signal(false);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.api.guide(slug).subscribe({
      next: (g) => {
        this.html.set(this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(g.markdown)));
      },
      error: () => {
        this.err.set(true);
      },
    });
  }
}
