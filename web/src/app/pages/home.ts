import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api';
import { I18nService } from '../core/i18n';
import { Reveal } from '../core/reveal';
import {
  ADVANTAGES,
  CHAPTERS,
  EXCLUDED,
  FOUNDERS,
  HERO_IMAGE,
  HERO_SECONDARY_IMAGE,
  HOTEL_TIERS,
  INCLUDED,
  INSTAGRAM,
  MOMENTS,
  OTHER_OFFERINGS,
  ROUTE_SUMMARY,
  TOUR_WAVES,
  WHATSAPP_TOURS,
  WHATSAPP_VISA,
  whatsappLink,
  type CountryFilter,
  type TourWave,
} from '../data/tour';
import { CityChapter } from '../journey/city-chapter';
import { JourneyMap } from '../journey/journey-map';
import { BookingModal } from '../shared/booking-modal';
import { HotelShowcase } from '../shared/hotel-showcase';
import { MomentsGallery } from '../shared/moments-gallery';

@Component({
  selector: 'app-home',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    JourneyMap,
    CityChapter,
    BookingModal,
    MomentsGallery,
    HotelShowcase,
    Reveal,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);
  private readonly bookingModal = viewChild<BookingModal>(BookingModal);

  readonly heroImage = HERO_IMAGE;
  readonly heroSecondary = HERO_SECONDARY_IMAGE;
  readonly routeSummary = ROUTE_SUMMARY;
  readonly waves = TOUR_WAVES;
  readonly chapters = CHAPTERS;
  readonly moments = MOMENTS;
  readonly hotelTiers = HOTEL_TIERS;
  readonly included = INCLUDED;
  readonly excluded = EXCLUDED;
  readonly advantages = ADVANTAGES;
  readonly founders = FOUNDERS;
  readonly offerings = OTHER_OFFERINGS;
  readonly ig = INSTAGRAM;

  readonly countryFilter = signal<CountryFilter>('all');
  readonly visibleChapters = computed(() => {
    const f = this.countryFilter();
    return f === 'all' ? this.chapters : this.chapters.filter((c) => c.countryKey === f);
  });

  readonly sent = signal(false);
  readonly sending = signal(false);
  readonly err = signal('');
  readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    telegram: [''],
    waveId: [TOUR_WAVES[0].id],
    message: [''],
  });

  readonly waDirectUrl = computed(() =>
    whatsappLink(
      WHATSAPP_TOURS,
      this.i18n.t(
        'Сәлеметсіз бе! ARALA Классикалық Еуротуры (Италия, Франция, Швейцария) қызықтырады.',
        'Здравствуйте! Интересует Классический Евротур ARALA (Италия, Франция, Швейцария).',
      ),
    ),
  );

  readonly waVisaUrl = computed(() =>
    whatsappLink(
      WHATSAPP_VISA,
      this.i18n.t(
        'Сәлеметсіз бе! ARALA арқылы шенген визасы бойынша кеңес алғым келеді.',
        'Здравствуйте! Хочу проконсультироваться по шенгенской визе через ARALA.',
      ),
    ),
  );

  readonly formWaUrl = computed(() => {
    this.formTick();
    const l = this.i18n.lang();
    const v = this.form.getRawValue();
    const waveText = this.resolveWaveText(v.waveId, l);
    const lines = [
      l === 'kk'
        ? 'Сәлеметсіз бе! ARALA Классикалық Еуротурына өтінім қалдырамын.'
        : 'Здравствуйте! Оставляю заявку на Классический Евротур ARALA.',
      v.name.trim() ? `${l === 'kk' ? 'Есімім' : 'Имя'}: ${v.name.trim()}` : '',
      waveText ? `${l === 'kk' ? 'Күндері' : 'Даты'}: ${waveText}` : '',
      v.phone.trim() ? `Телефон: ${v.phone.trim()}` : '',
      v.telegram.trim() ? `Telegram: ${v.telegram.trim()}` : '',
      v.message.trim() ? `${l === 'kk' ? 'Пікір' : 'Комментарий'}: ${v.message.trim()}` : '',
    ].filter(Boolean);
    return whatsappLink(WHATSAPP_TOURS, lines.join('\n'));
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
  }

  openBooking(wave?: TourWave): void {
    this.bookingModal()?.open(wave?.id);
  }

  offeringWa(phone: string, text: string): string {
    return whatsappLink(phone, text);
  }

  submit(): void {
    this.err.set('');
    const l = this.i18n.lang();
    const v = this.form.getRawValue();
    if (!v.name.trim()) {
      this.err.set(l === 'kk' ? 'Есіміңізді жазыңыз' : 'Напишите ваше имя');
      return;
    }
    if (!v.phone.trim() && !v.telegram.trim()) {
      this.err.set(l === 'kk' ? 'Телефон немесе Telegram көрсетіңіз' : 'Укажите телефон или Telegram');
      return;
    }
    this.sending.set(true);
    const waveText = this.resolveWaveText(v.waveId, l);
    const fullMessage = [`${l === 'kk' ? 'Күндері' : 'Даты'}: ${waveText}`, v.message.trim()]
      .filter(Boolean)
      .join(' · ');
    this.api
      .sendLead({
        name: v.name.trim(),
        phone: v.phone.trim(),
        telegram: v.telegram.trim(),
        message: fullMessage,
      })
      .subscribe({
        next: () => {
          this.sent.set(true);
          this.sending.set(false);
          this.formTick.update((n) => n + 1);
        },
        error: (e: HttpErrorResponse) => {
          this.sending.set(false);
          this.err.set(
            e.error?.error ??
              (l === 'kk'
                ? 'Серверге жіберілмеді — «WhatsApp-қа жазу» батырмасын басыңыз, өтінім мәтіні дайын.'
                : 'Не удалось отправить на сервер — нажмите «Написать в WhatsApp», текст заявки уже готов.'),
          );
        },
      });
  }

  private resolveWaveText(id: string, lang: 'kk' | 'ru'): string {
    const found = this.waves.find((w) => w.id === id);
    if (!found) {
      return lang === 'kk' ? 'Күн таңдауға көмектесіңізші' : 'Помогите выбрать даты';
    }
    return `${found.dates[lang]} (${found.price})`;
  }
}
