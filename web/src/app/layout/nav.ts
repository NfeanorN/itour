import { afterNextRender, Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../core/i18n';
import { WHATSAPP_TOURS, whatsappLink } from '../data/tour';
import { AralaLogo } from '../shared/arala-logo';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, AralaLogo],
  template: `
    <header class="nav" [class.nav--scrolled]="scrolled()">
      <div class="wrap bar">
        <a routerLink="/" class="brand-link" (click)="menuOpen.set(false)">
          <app-arala-logo variant="badge" />
        </a>

        <nav class="links" [attr.aria-label]="i18n.t('Негізгі мәзір', 'Основная навигация')">
          <a routerLink="/" fragment="dates">{{ i18n.t('Күндер мен баға', 'Даты и цены') }}</a>
          <a routerLink="/" fragment="route">{{ i18n.t('Маршрут', 'Маршрут') }}</a>
          <a routerLink="/" fragment="cities">{{ i18n.t('Қалалар', 'Города') }}</a>
          <a routerLink="/" fragment="moments">{{ i18n.t('Жанды фото', 'Живые фото') }}</a>
          <a routerLink="/" fragment="included">{{ i18n.t('Шарттар', 'Что включено') }}</a>
        </nav>

        <div class="actions">
          <div class="lang-switch" role="group" [attr.aria-label]="i18n.t('Тілді таңдау', 'Выбор языка')">
            <button
              type="button"
              [class.is-on]="i18n.lang() === 'kk'"
              (click)="i18n.setLang('kk')"
            >
              ҚАЗ
            </button>
            <button
              type="button"
              [class.is-on]="i18n.lang() === 'ru'"
              (click)="i18n.setLang('ru')"
            >
              РУС
            </button>
          </div>

          <a [href]="waUrl()" target="_blank" rel="noreferrer" class="wa-btn">WhatsApp</a>
          <a routerLink="/" fragment="book" class="btn btn--primary btn--sm cta-desk">
            {{ i18n.t('Жазылу', 'Записаться') }}
          </a>

          <button
            type="button"
            class="burger"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-label]="i18n.t('Мәзірді ашу', 'Открыть меню')"
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
            <a routerLink="/" fragment="dates" (click)="menuOpen.set(false)">
              {{ i18n.t('Күндер мен бағасы', 'Даты и стоимость') }}
            </a>
            <a routerLink="/" fragment="route" (click)="menuOpen.set(false)">
              {{ i18n.t('Маршрут картасы', 'Карта маршрута') }}
            </a>
            <a routerLink="/" fragment="cities" (click)="menuOpen.set(false)">
              {{ i18n.t('Қалалар және Альпі', 'Города и Альпы') }}
            </a>
            <a routerLink="/" fragment="moments" (click)="menuOpen.set(false)">
              {{ i18n.t('Турдан жанды фотолар', 'Фото с туров') }}
            </a>
            <a routerLink="/" fragment="included" (click)="menuOpen.set(false)">
              {{ i18n.t('Бағаға не кіреді', 'Что включено') }}
            </a>
            <hr />
            <a routerLink="/" fragment="book" class="btn btn--primary btn--sm sheet-cta" (click)="menuOpen.set(false)">
              {{ i18n.t('Турға жазылу', 'Записаться в тур') }}
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
      background: rgba(250, 249, 246, 0.88);
      backdrop-filter: saturate(1.4) blur(14px);
      border-bottom: 1px solid transparent;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    .nav--scrolled {
      background: rgba(250, 249, 246, 0.95);
      border-bottom-color: var(--border);
      box-shadow: 0 6px 24px rgba(11, 19, 36, 0.05);
    }

    .bar {
      height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand-link {
      text-decoration: none;
      flex: none;
    }

    .links {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .links a {
      text-decoration: none;
      transition: color 0.15s ease;
      white-space: nowrap;
    }

    .links a:hover,
    .links a.is-on {
      color: var(--ruby);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .lang-switch {
      display: inline-flex;
      padding: 3px;
      border-radius: var(--r-pill);
      background: var(--surface-soft);
      border: 1px solid var(--border);
    }

    .lang-switch button {
      border: 0;
      border-radius: var(--r-pill);
      padding: 5px 10px;
      background: transparent;
      color: var(--text-subtle);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .lang-switch button.is-on {
      background: var(--ink-dark);
      color: #ffffff;
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

    .burger {
      display: none;
      width: 40px;
      height: 40px;
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

    .sheet-cta {
      margin-top: 6px;
      text-align: center;
      color: #ffffff !important;
    }

    .sheet-cta:hover {
      background: var(--ruby-hover) !important;
    }

    @media (max-width: 1080px) {
      .links,
      .cta-desk {
        display: none;
      }
      .burger {
        display: inline-flex;
      }
    }

    @media (max-width: 460px) {
      .wa-btn {
        display: none;
      }
    }
  `,
})
export class Nav {
  readonly i18n = inject(I18nService);
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  readonly waUrl = computed(() =>
    whatsappLink(
      WHATSAPP_TOURS,
      this.i18n.t(
        'Сәлеметсіз бе! ARALA Классикалық Еуротуры қызықтырады. Толығырақ айтып беріңізші.',
        'Здравствуйте! Интересует Классический Евротур ARALA. Расскажите подробнее.',
      ),
    ),
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
