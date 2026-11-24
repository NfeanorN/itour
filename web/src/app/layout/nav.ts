import { afterNextRender, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth';
import { WHATSAPP_TOURS, whatsappLink } from '../data/tour';
import { AralaLogo } from '../shared/arala-logo';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, AralaLogo],
  template: `
    <header class="nav" [class.nav--scrolled]="scrolled()">
      <div class="wrap bar">
        <a routerLink="/" class="brand-link" (click)="menuOpen.set(false)">
          <app-arala-logo variant="badge" />
        </a>

        <nav class="links" aria-label="Основная навигация">
          <a routerLink="/" fragment="dates">Даты и цены</a>
          <a routerLink="/" fragment="route">Маршрут</a>
          <a routerLink="/" fragment="cities">Города</a>
          <a routerLink="/" fragment="moments">Живые фото</a>
          <a routerLink="/guide" routerLinkActive="is-on">Гайд</a>
          @if (auth.isAdmin) {
            <a routerLink="/admin" routerLinkActive="is-on">Админ</a>
          }
        </nav>

        <div class="actions">
          <a [href]="waUrl" target="_blank" rel="noreferrer" class="wa-btn">WhatsApp</a>
          @if (auth.user(); as u) {
            <span class="who">{{ u.name }}</span>
            <button type="button" class="text-link" (click)="auth.logout()">Выйти</button>
          } @else {
            <a routerLink="/login" class="text-link">Войти</a>
          }
          <a routerLink="/" fragment="book" class="btn btn--primary btn--sm cta-desk">Записаться</a>

          <button
            type="button"
            class="burger"
            [attr.aria-expanded]="menuOpen()"
            aria-label="Открыть меню"
            (click)="toggleMenu($event)"
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      @if (menuOpen()) {
        <div class="wrap sheet-host">
          <div class="sheet" (click)="$event.stopPropagation()">
            <a routerLink="/" fragment="dates" (click)="menuOpen.set(false)">Даты и стоимость</a>
            <a routerLink="/" fragment="route" (click)="menuOpen.set(false)">Карта маршрута</a>
            <a routerLink="/" fragment="cities" (click)="menuOpen.set(false)">Города и Альпы</a>
            <a routerLink="/" fragment="moments" (click)="menuOpen.set(false)">Фото с туров</a>
            <a routerLink="/" fragment="included" (click)="menuOpen.set(false)">Что включено</a>
            <a routerLink="/guide" (click)="menuOpen.set(false)">Визовый гайд</a>
            @if (auth.isAdmin) {
              <a routerLink="/admin" (click)="menuOpen.set(false)">Админ-панель</a>
            }
            <hr />
            @if (auth.user(); as u) {
              <div class="sheet-user">
                <span>{{ u.name }}</span>
                <button type="button" (click)="logout()">Выйти</button>
              </div>
            } @else {
              <a routerLink="/login" (click)="menuOpen.set(false)">Войти в кабинет</a>
            }
            <a routerLink="/" fragment="book" class="btn btn--primary btn--sm sheet-cta" (click)="menuOpen.set(false)">
              Записаться в тур
            </a>
          </div>
        </div>
      }
    </header>
  `,
  styles: `
    .nav {
      position: fixed;
      inset: 0 0 auto;
      z-index: 60;
      background: rgba(250, 249, 246, 0.86);
      backdrop-filter: saturate(1.4) blur(14px);
      border-bottom: 1px solid transparent;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    .nav--scrolled {
      background: rgba(250, 249, 246, 0.94);
      border-bottom-color: var(--border);
      box-shadow: 0 6px 24px rgba(11, 19, 36, 0.05);
    }

    .bar {
      height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .brand-link {
      text-decoration: none;
      flex: none;
    }

    .links {
      display: flex;
      align-items: center;
      gap: 22px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .links a {
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .links a:hover,
    .links a.is-on {
      color: var(--ruby);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .wa-btn {
      padding: 8px 14px;
      border-radius: var(--r-pill);
      background: var(--ink-dark);
      color: #ffffff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: background 0.15s ease;
    }

    .wa-btn:hover {
      background: var(--ink-dark-3);
    }

    .who {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-subtle);
    }

    .text-link {
      border: 0;
      background: transparent;
      color: var(--text-muted);
      font-size: 13.5px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      padding: 4px 2px;
    }

    .text-link:hover {
      color: var(--text);
    }

    .burger {
      display: none;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--surface-soft);
      cursor: pointer;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }

    .burger span {
      display: block;
      width: 16px;
      height: 2px;
      border-radius: 2px;
      background: var(--ink-dark);
    }

    .sheet-host {
      position: relative;
      display: flex;
      justify-content: flex-end;
    }

    .sheet {
      margin-top: 8px;
      width: min(300px, calc(100vw - 32px));
      padding: 14px;
      border-radius: 22px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      display: grid;
      gap: 4px;
    }

    .sheet a {
      padding: 10px 12px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }

    .sheet a:hover {
      background: var(--surface-soft);
    }

    .sheet hr {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 6px 0;
    }

    .sheet-user {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .sheet-user button {
      border: 0;
      background: transparent;
      color: var(--ruby);
      font-weight: 700;
      cursor: pointer;
    }

    .sheet-cta {
      margin-top: 6px;
      text-align: center;
      color: #ffffff !important;
    }

    .sheet-cta:hover {
      background: var(--ruby-hover) !important;
    }

    @media (max-width: 1020px) {
      .links,
      .who,
      .text-link,
      .cta-desk {
        display: none;
      }
      .burger {
        display: inline-flex;
      }
    }
  `,
})
export class Nav {
  readonly auth = inject(AuthService);
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);
  readonly waUrl = whatsappLink(
    WHATSAPP_TOURS,
    'Здравствуйте! Интересует Классический Евротур ARALA. Расскажите подробнее.',
  );

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const onScroll = () => this.scrolled.set(window.scrollY > 18);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroy.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  toggleMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menuOpen.set(false);
  }
}
