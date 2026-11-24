import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../core/i18n';
import { INSTAGRAM, WHATSAPP_TOURS, WHATSAPP_VISA, whatsappLink } from '../data/tour';
import { AralaLogo } from '../shared/arala-logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, AralaLogo],
  template: `
    <footer class="foot">
      <div class="wrap grid">
        <div class="col-brand">
          <app-arala-logo variant="light" />
          <p class="tag">
            {{
              i18n.t(
                'Қазақстаннан авторлық турлар және барлық елге визалық сүйемелдеу. Ернұр мен Қайрат — 3+ жыл Еуропада, 200+ бақытты турист.',
                'Авторские туры из Казахстана и визовое сопровождение во все страны. Ернұр и Қайрат — более 3 лет в Европе, 200+ счастливых туристов.'
              )
            }}
          </p>
        </div>

        <div class="col">
          <h4>{{ i18n.t('Навигация', 'Навигация') }}</h4>
          <a routerLink="/" fragment="dates">{{ i18n.t('Күндер мен баға', 'Даты и цены') }}</a>
          <a routerLink="/" fragment="route">{{ i18n.t('Маршрут картасы', 'Карта маршрута') }}</a>
          <a routerLink="/" fragment="cities">{{ i18n.t('Қалалар және Альпі', 'Города и Альпы') }}</a>
          <a routerLink="/guide">{{ i18n.t('Жабық визалық гайд', 'Закрытый визовый гайд') }}</a>
          <a routerLink="/login">{{ i18n.t('Жеке кабинет', 'Личный кабинет') }}</a>
        </div>

        <div class="col">
          <h4>{{ i18n.t('Бізбен байланысу', 'Связаться с нами') }}</h4>
          <a [href]="ig" target="_blank" rel="noreferrer">Instagram @arala.tours</a>
          <a [href]="waTours()" target="_blank" rel="noreferrer" class="gold">
            {{ i18n.t('WhatsApp турлар · +7 706 608 9508', 'WhatsApp туры · +7 706 608 9508') }}
          </a>
          <a [href]="waVisa()" target="_blank" rel="noreferrer">
            {{ i18n.t('WhatsApp виза · +7 777 205 7252', 'WhatsApp визы · +7 777 205 7252') }}
          </a>
        </div>
      </div>

      <div class="wrap bottom">
        <span>© 2026 ARALA Tours · {{ i18n.t('Италия · Франция · Швейцария', 'Италия · Франция · Швейцария') }}</span>
        <span>{{ i18n.t('Алматы, Қазақстан', 'Алматы, Казахстан') }}</span>
      </div>
    </footer>
  `,
  styles: `
    .foot {
      margin-top: 56px;
      background: var(--ink-dark);
      color: var(--text-on-dark-muted);
      padding: 56px 0 36px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      gap: 36px;
      padding-bottom: 36px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .tag {
      margin: 16px 0 0;
      max-width: 380px;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-on-dark-subtle);
    }

    .col {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    h4 {
      margin: 0 0 6px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #ffffff;
    }

    a {
      font-size: 14px;
      color: var(--text-on-dark-muted);
      text-decoration: none;
      width: fit-content;
      transition: color 0.15s ease;
    }

    a:hover {
      color: #ffffff;
    }

    a.gold {
      color: var(--gold);
      font-weight: 700;
    }

    a.gold:hover {
      color: var(--gold-hover);
    }

    .bottom {
      padding-top: 22px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      font-size: 12.5px;
      color: var(--text-on-dark-subtle);
    }

    @media (max-width: 820px) {
      .grid {
        grid-template-columns: 1fr;
        gap: 28px;
      }
      .bottom {
        flex-direction: column;
        gap: 6px;
      }
    }
  `,
})
export class Footer {
  readonly i18n = inject(I18nService);
  readonly ig = INSTAGRAM;

  readonly waTours = computed(() =>
    whatsappLink(
      WHATSAPP_TOURS,
      this.i18n.t(
        'Сәлеметсіз бе! ARALA турлары туралы толығырақ білгім келеді.',
        'Здравствуйте! Хочу узнать подробнее о турах ARALA.',
      ),
    ),
  );

  readonly waVisa = computed(() =>
    whatsappLink(
      WHATSAPP_VISA,
      this.i18n.t(
        'Сәлеметсіз бе! ARALA арқылы виза / жеке маршрут бойынша кеңес керек.',
        'Здравствуйте! Нужна консультация по визе / маршруту ARALA.',
      ),
    ),
  );
}
