import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api';
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
    wave: [`${TOUR_WAVES[0].dates} (${TOUR_WAVES[0].price})`],
    message: ['Хочу в Классический Евротур ARALA'],
  });

  readonly waDirectUrl = whatsappLink(
    WHATSAPP_TOURS,
    'Здравствуйте! Интересует Классический Евротур ARALA (Италия, Франция, Швейцария).',
  );
  readonly waVisaUrl = whatsappLink(
    WHATSAPP_VISA,
    'Здравствуйте! Хочу проконсультироваться по шенгенской визе через ARALA.',
  );

  readonly formWaUrl = computed(() => {
    this.formTick();
    const v = this.form.getRawValue();
    const lines = [
      'Здравствуйте! Оставляю заявку на Классический Евротур ARALA.',
      v.name.trim() ? `Имя: ${v.name.trim()}` : '',
      v.wave ? `Даты: ${v.wave}` : '',
      v.phone.trim() ? `Телефон: ${v.phone.trim()}` : '',
      v.telegram.trim() ? `Telegram: ${v.telegram.trim()}` : '',
      v.message.trim() ? `Комментарий: ${v.message.trim()}` : '',
    ].filter(Boolean);
    return whatsappLink(WHATSAPP_TOURS, lines.join('\n'));
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
  }

  openBooking(wave?: TourWave): void {
    const label = wave ? `${wave.dates} (${wave.price})` : undefined;
    this.bookingModal()?.open(label);
  }

  offeringWa(phone: string, text: string): string {
    return whatsappLink(phone, text);
  }

  submit(): void {
    this.err.set('');
    const v = this.form.getRawValue();
    if (!v.name.trim()) {
      this.err.set('Напишите ваше имя');
      return;
    }
    if (!v.phone.trim() && !v.telegram.trim()) {
      this.err.set('Укажите телефон или Telegram');
      return;
    }
    this.sending.set(true);
    const fullMessage = [`Даты: ${v.wave}`, v.message.trim()].filter(Boolean).join(' · ');
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
              'Не удалось отправить на сервер — нажмите «Написать в WhatsApp», текст заявки уже готов.',
          );
        },
      });
  }
}
