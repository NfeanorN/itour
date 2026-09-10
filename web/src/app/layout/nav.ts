import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="nav" [class.nav--solid]="solid()">
      <a routerLink="/" class="brand">iTour</a>
      <nav class="links">
        <a routerLink="/" fragment="route">Маршрут</a>
        <a routerLink="/" fragment="cities">Города</a>
        <a routerLink="/guide" routerLinkActive="is-on">Гайд</a>
        @if (auth.isAdmin) {
          <a routerLink="/admin" routerLinkActive="is-on">Админ</a>
        }
      </nav>
      <div class="actions">
        @if (auth.user(); as u) {
          <span class="who">{{ u.name }}</span>
          <button type="button" class="ghost" (click)="auth.logout()">Выйти</button>
        } @else {
          <a routerLink="/login" class="ghost">Войти</a>
        }
        <a routerLink="/" fragment="book" class="cta">Записаться</a>
      </div>
    </header>
  `,
  styles: `
    .nav {
      position: fixed;
      inset: 0 0 auto;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 18px 36px;
      color: #f5f5f7;
      background: linear-gradient(to bottom, rgb(0 0 0 / 0.72), transparent);
      backdrop-filter: saturate(1.4) blur(16px);
      transition: background 0.3s ease;
    }
    .nav--solid {
      background: rgb(0 0 0 / 0.78);
      border-bottom: 1px solid rgb(255 255 255 / 0.06);
    }
    .brand {
      font-size: 21px;
      font-weight: 600;
      letter-spacing: -0.04em;
      color: inherit;
      text-decoration: none;
    }
    .links {
      display: flex;
      gap: 28px;
      font-size: 13px;
      color: #a1a1a6;
    }
    .links a {
      color: inherit;
      text-decoration: none;
    }
    .links a:hover,
    .is-on {
      color: #fff;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .who {
      font-size: 13px;
      color: #a1a1a6;
    }
    .ghost,
    .cta {
      font-size: 13px;
      text-decoration: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: #f5f5f7;
    }
    .cta {
      background: #f5f5f7;
      color: #000;
      padding: 8px 16px;
      border-radius: 980px;
      font-weight: 600;
    }
    @media (max-width: 820px) {
      .links, .who { display: none; }
      .nav { padding: 14px 18px; }
    }
  `,
})
export class Nav {
  readonly auth = inject(AuthService);
  readonly solid = signal(false);

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const onScroll = () => this.solid.set(window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroy.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }
}
