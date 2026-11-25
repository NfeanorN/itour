import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api';
import { I18nService } from '../core/i18n';
import { TOUR_WAVES, WHATSAPP_TOURS, whatsappLink } from '../data/tour';

@Component({
  selector: 'app-booking-modal',
  imports: [ReactiveFormsModule],
  template: `
    <dialog #dlg class="modal" (click)="onBackdrop($event)" (cancel)="close()">
      <div class="sheet" (click)="$event.stopPropagation()">
        <header class="head">
          <div>
            <p class="kicker">{{ i18n.t('Классикалық Еуротур · ARALA', 'Классический Евротур · ARALA') }}</p>
            <h3>{{ i18n.t('Орын брондау', 'Забронировать место') }}</h3>
          </div>
          <button
            type="button"
            class="close"
            (click)="close()"
            [attr.aria-label]="i18n.t('Терезені жабу', 'Закрыть окно')"
          >
            ✕
          </button>
        </header>

        @if (sent()) {
          <div class="done">
            <div class="done-badge">✓ {{ i18n.t('WhatsApp чаты ашылды', 'Чат WhatsApp открыт') }}</div>
            <p>
              {{ i18n.t('Рақмет,', 'Спасибо,') }} <strong>{{ submittedName() }}</strong>!
              {{
                i18n.t(
                  'Дайын хабарламамен WhatsApp ашылды. Егер чат автоматты түрде ашылмаса, төмендегі батырманы басыңыз:',
                  'Мы открыли WhatsApp с готовым текстом заявки. Если чат не открылся автоматически, нажмите кнопку ниже:'
                )
              }}
            </p>
            <div class="done-actions">
              <a [href]="waUrl()" target="_blank" rel="noreferrer" class="btn btn--primary">
                {{ i18n.t('WhatsApp-ты ашу', 'Открыть WhatsApp') }}
              </a>
              <button type="button" class="btn btn--ghost" (click)="close()">
                {{ i18n.t('Жабу', 'Закрыть') }}
              </button>
            </div>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label>
              {{ i18n.t('Есіміңіз', 'Ваше имя') }}
              <input
                formControlName="name"
                [placeholder]="i18n.t('Сізге қалай хабарласайық?', 'Как к вам обращаться')"
                autocomplete="name"
              />
            </label>

            <div class="row">
              <label>
                {{ i18n.t('Ыңғайлы тур күндері', 'Удобные даты тура') }}
                <select formControlName="waveId">
                  @for (w of waves; track w.id) {
                    <option [value]="w.id">
                      {{ i18n.pick(w.dates) }} — {{ w.price }}
                    </option>
                  }
                  <option value="help">{{ i18n.t('Күн таңдауға көмектесіңізші', 'Помогите выбрать даты') }}</option>
                </select>
              </label>

              <label>
                {{ i18n.t('Адам саны', 'Количество человек') }}
                <select formControlName="guests">
                  <option value="1">{{ i18n.t('1 адам', '1 человек') }}</option>
                  <option value="2">{{ i18n.t('2 адам', '2 человека') }}</option>
                  <option value="3">{{ i18n.t('3 адам', '3 человека') }}</option>
                  <option value="4+">{{ i18n.t('4+ адам', '4+ человека') }}</option>
                </select>
              </label>
            </div>

            <label>
              {{ i18n.t('Пікір немесе сұрақ (міндетті емес)', 'Комментарий или вопрос (необязательно)') }}
              <textarea
                formControlName="comment"
                rows="3"
                [placeholder]="i18n.t('Мысалы: виза бойынша сұрағым бар', 'Например: интересует помощь с визой')"
              ></textarea>
            </label>

            @if (err()) {
              <p class="err">{{ err() }}</p>
            }

            <div class="actions">
              <button type="submit" class="btn btn--primary">
                {{ i18n.t('WhatsApp арқылы жіберу →', 'Отправить в WhatsApp →') }}
              </button>
            </div>
            <p class="hint">
              {{
                i18n.t(
                  'Батырманы басқанда дайын өтініммен +7 706 608 9508 WhatsApp чаты ашылады. Тегін визалық сүйемелдеу кіреді.',
                  'После нажатия откроется чат WhatsApp +7 706 608 9508 с уже заполненным текстом. Бесплатное визовое сопровождение включено.'
                )
              }}
            </p>
          </form>
        }
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(540px, calc(100vw - 24px));
      max-height: calc(100svh - 24px);
      padding: 0;
      border: 0;
      border-radius: var(--r-xl);
      background: transparent;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .modal::backdrop {
      background: rgba(11, 19, 36, 0.58);
      backdrop-filter: blur(6px);
    }

    .sheet {
      max-height: calc(100svh - 24px);
      overflow-y: auto;
      background: var(--surface);
      color: var(--text);
      border-radius: var(--r-xl);
      padding: 28px;
      border: 1px solid var(--border);
    }

    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }

    .kicker {
      margin: 0 0 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold-deep);
    }

    h3 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .close {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--surface-soft);
      color: var(--text);
      font-size: 15px;
      cursor: pointer;
      flex: none;
    }

    .close:hover {
      background: #e7e4dc;
    }

    form {
      display: grid;
      gap: 14px;
    }

    .row {
      display: grid;
      grid-template-columns: 1.35fr 0.85fr;
      gap: 12px;
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-muted);
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 12px 14px;
      border-radius: var(--r-sm);
      border: 1px solid var(--border-strong);
      background: var(--bg);
      color: var(--text);
      font-size: 15px;
      outline: none;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    input:focus,
    select:focus,
    textarea:focus {
      border-color: var(--ruby);
      background: #ffffff;
    }

    .err {
      margin: 0;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--danger);
    }

    .actions,
    .done-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 4px;
    }

    .hint {
      margin: 2px 0 0;
      font-size: 12.5px;
      color: var(--text-subtle);
      line-height: 1.45;
    }

    .done {
      display: grid;
      gap: 16px;
    }

    .done-badge {
      display: inline-flex;
      width: fit-content;
      padding: 6px 14px;
      border-radius: var(--r-pill);
      background: rgba(21, 128, 61, 0.1);
      color: var(--success);
      font-size: 13px;
      font-weight: 800;
    }

    .done p {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.55;
    }

    @media (max-width: 560px) {
      .sheet {
        padding: 20px;
      }
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class BookingModal {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);
  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  readonly waves = TOUR_WAVES;
  readonly sent = signal(false);
  readonly err = signal('');
  readonly submittedName = signal('');
  readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    waveId: [TOUR_WAVES[0].id],
    guests: ['1'],
    comment: [''],
  });

  readonly waUrl = computed(() => {
    this.formTick();
    const l = this.i18n.lang();
    const v = this.form.getRawValue();
    const waveText = this.resolveWaveText(v.waveId, l);
    const parts = [
      l === 'kk'
        ? 'Сәлеметсіз бе! ARALA Классикалық Еуротурына жазылғым келеді.'
        : 'Здравствуйте! Хочу записаться в Классический Евротур ARALA.',
      v.name.trim() ? `${l === 'kk' ? 'Есімім' : 'Имя'}: ${v.name.trim()}` : '',
      waveText ? `${l === 'kk' ? 'Күндері' : 'Даты'}: ${waveText}` : '',
      `${l === 'kk' ? 'Адам саны' : 'Количество человек'}: ${v.guests}`,
      v.comment.trim() ? `${l === 'kk' ? 'Пікір' : 'Комментарий'}: ${v.comment.trim()}` : '',
    ].filter(Boolean);
    return whatsappLink(WHATSAPP_TOURS, parts.join('\n'));
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
  }

  open(waveId?: string): void {
    this.sent.set(false);
    this.err.set('');
    if (waveId) {
      this.form.controls.waveId.setValue(waveId);
    }
    this.formTick.update((n) => n + 1);
    const el = this.dlg()?.nativeElement;
    if (el && !el.open) {
      el.showModal();
    }
  }

  close(): void {
    const el = this.dlg()?.nativeElement;
    if (el?.open) {
      el.close();
    }
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlg()?.nativeElement) {
      this.close();
    }
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
    const url = this.waUrl();
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = url;
    }

    this.submittedName.set(v.name.trim());
    this.sent.set(true);

    // Best-effort non-blocking log for local Go/SQLite admin if running
    const waveText = this.resolveWaveText(v.waveId, l);
    const message = [`${l === 'kk' ? 'Күндері' : 'Даты'}: ${waveText}`, `${l === 'kk' ? 'Адам саны' : 'Гостей'}: ${v.guests}`, v.comment.trim()]
      .filter(Boolean)
      .join(' · ');
    this.api
      .sendLead({ name: v.name.trim(), phone: 'WhatsApp', telegram: '', message })
      .subscribe({ error: () => {} });
  }

  private resolveWaveText(id: string, lang: 'kk' | 'ru'): string {
    const found = this.waves.find((w) => w.id === id);
    if (!found) {
      return lang === 'kk' ? 'Күн таңдауға көмектесіңізші' : 'Помогите выбрать даты';
    }
    return `${found.dates[lang]} (${found.price})`;
  }
}
