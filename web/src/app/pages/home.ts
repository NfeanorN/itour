import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api';
import { Reveal } from '../core/reveal';
import { CITIES, HERO_IMAGE, INSTAGRAM, WHATSAPP } from '../data/tour';
import { CityChapter } from '../journey/city-chapter';
import { JourneyMap } from '../journey/journey-map';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, JourneyMap, CityChapter, Reveal],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly hero = HERO_IMAGE;
  readonly ig = INSTAGRAM;
  readonly wa = WHATSAPP;
  readonly cities = CITIES.filter((c) => c.places.length);
  readonly sent = signal(false);
  readonly err = signal('');
  readonly sending = signal(false);
  readonly heroShift = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    telegram: [''],
    message: ['Хочу в евротур'],
  });

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const onScroll = () => this.heroShift.set(Math.min(window.scrollY, 900) * 0.24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroy.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  submit() {
    this.err.set('');
    if (this.form.invalid) {
      this.err.set('Напишите имя');
      return;
    }
    const v = this.form.getRawValue();
    if (!v.phone.trim() && !v.telegram.trim()) {
      this.err.set('Укажите телефон или Telegram');
      return;
    }
    this.sending.set(true);
    this.api.sendLead(v).subscribe({
      next: () => {
        this.sent.set(true);
        this.sending.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.sending.set(false);
        this.err.set(e.error?.error ?? 'Не отправилось. Напишите в WhatsApp.');
      },
    });
  }
}
