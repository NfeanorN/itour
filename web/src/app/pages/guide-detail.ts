import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../core/api';
import { renderMarkdown } from '../core/markdown';

@Component({
  selector: 'app-guide-detail',
  imports: [RouterLink],
  template: `
    <article class="wrap">
      <a routerLink="/guide" class="back">Все гайды</a>
      @if (html()) {
        <div class="md" [innerHTML]="html()"></div>
      }
    </article>
  `,
  styles: `
    .wrap { padding: 140px 36px 100px; max-width: 740px; margin: 0 auto; }
    .back { color: #86868b; text-decoration: none; font-size: 14px; }
    .md { margin-top: 28px; }
    :host ::ng-deep .md h1 { font-size: 56px; letter-spacing: -0.05em; line-height: 1; margin: 0 0 24px; }
    :host ::ng-deep .md h2 { font-size: 28px; margin: 36px 0 12px; letter-spacing: -0.03em; }
    :host ::ng-deep .md p, :host ::ng-deep .md li { color: #d2d2d7; font-size: 18px; line-height: 1.55; }
    :host ::ng-deep .md ul { padding-left: 18px; }
    @media (max-width: 640px) { .wrap { padding: 120px 18px 60px; } :host ::ng-deep .md h1 { font-size: 36px; } }
  `,
})
export class GuideDetail {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly html = signal<SafeHtml | null>(null);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.api.guide(slug).subscribe((g) => {
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(g.markdown)));
    });
  }
}
