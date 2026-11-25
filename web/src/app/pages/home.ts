import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../core/i18n';
import { Reveal } from '../core/reveal';
import {
  ADVANTAGES,
  CHAPTERS,
  EXCLUDED,
  FOUNDERS,
  HERO_IMAGE,
  HERO_SECONDARY_IMAGE,
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
import { MomentsGallery } from '../shared/moments-gallery';

@Component({
  selector: 'app-home',
  imports: [
    ReactiveFormsModule,
    JourneyMap,
    CityChapter,
    BookingModal,
    MomentsGallery,
    Reveal,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);
  private readonly bookingModal = viewChild<BookingModal>(BookingModal);

  readonly heroImage = HERO_IMAGE;
  readonly heroSecondary = HERO_SECONDARY_IMAGE;
  readonly routeSummary = ROUTE_SUMMARY;
  readonly waves = TOUR_WAVES;
  readonly chapters = CHAPTERS;
  readonly moments = MOMENTS;
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
  readonly err = signal('');
  readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    waveId: [TOUR_WAVES[0].id],
    guests: ['1'],
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
      `${l === 'kk' ? 'Адам саны' : 'Количество человек'}: ${v.guests}`,
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

    this.formTick.update((n) => n + 1);
    const url = this.formWaUrl();
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = url;
    }
    this.sent.set(true);
  }

  private resolveWaveText(id: string, lang: 'kk' | 'ru'): string {
    const found = this.waves.find((w) => w.id === id);
    if (!found) {
      return lang === 'kk' ? 'Күн таңдауға көмектесіңізші' : 'Помогите выбрать даты';
    }
    return `${found.dates[lang]} (${found.price})`;
  }
}
