import { HttpErrorResponse } from '@angular/common/http';
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
            <div class="done-badge">✓ {{ i18n.t('Өтінім қабылданды', 'Заявка принята') }}</div>
            <p>
              {{ i18n.t('Рақмет,', 'Спасибо,') }} <strong>{{ submittedName() }}</strong>!
              {{
                i18n.t(
                  'Өтініміңізді алдық, жақын арада хабарласамыз. Одан да жылдам жауап алу үшін бір батырмамен WhatsApp-қа жаза аласыз:',
                  'Мы получили заявку и свяжемся с вами в ближайшее время. Чтобы получить ответ ещё быстрее — продублируйте запрос в WhatsApp одним нажатием:'
                )
              }}
            </p>
            <div class="done-actions">
              <a [href]="waUrl()" target="_blank" rel="noreferrer" class="btn btn--primary">
                {{ i18n.t('WhatsApp-қа жазу', 'Написать в WhatsApp') }}
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
                {{ i18n.t('Телефон / WhatsApp', 'Телефон / WhatsApp') }}
                <input formControlName="phone" placeholder="+7 7XX XXX XX XX" autocomplete="tel" />
              </label>
              <label>
                {{ i18n.t('Telegram (ыңғайлы болса)', 'Telegram (если удобнее)') }}
                <input formControlName="telegram" placeholder="@username" />
              </label>
            </div>

            <label>
              {{ i18n.t('Ыңғайлы тур күндері', 'Удобные даты тура') }}
              <select formControlName="waveId">
                @for (w of waves; track w.id) {
                  <option [value]="w.id">
                    {{ i18n.pick(w.dates) }} — {{ w.price }} ({{ i18n.pick(w.duration) }})
                  </option>
                }
                <option value="help">{{ i18n.t('Күн таңдауға көмектесіңізші', 'Помогите выбрать даты') }}</option>
              </select>
            </label>

            <label>
              {{ i18n.t('Пікір немесе сұрақ', 'Комментарий или вопрос') }}
              <textarea
                formControlName="comment"
                rows="3"
                [placeholder]="i18n.t('Мысалы: екеуміз барамыз, виза бойынша сұрақ бар', 'Например: лечу вдвоём, интересует виза')"
              ></textarea>
            </label>

            @if (err()) {
              <p class="err">{{ err() }}</p>
            }

            <div class="actions">
              <button type="submit" class="btn btn--primary" [disabled]="sending()">
                {{
                  sending()
                    ? i18n.t('Жіберілуде…', 'Отправляем…')
                    : i18n.t('Өтінім қалдыру', 'Оставить заявку')
                }}
              </button>
              <a [href]="waUrl()" target="_blank" rel="noreferrer" class="btn btn--ghost">
                {{ i18n.t('Бірден WhatsApp-қа', 'Сразу в WhatsApp') }}
              </a>
            </div>
            <p class="hint">
              {{
                i18n.t(
                  'Тегін визалық сүйемелдеу кіреді. Авторлық топтағы орындар шектеулі.',
                  'Бесплатное визовое сопровождение включено. Места в группе ограничены.'
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
      grid-template-columns: 1fr 1fr;
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
  readonly sending = signal(false);
  readonly err = signal('');
  readonly submittedName = signal('');
  readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    telegram: [''],
    waveId: [TOUR_WAVES[0].id],
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
      v.phone.trim() ? `Телефон: ${v.phone.trim()}` : '',
      v.telegram.trim() ? `Telegram: ${v.telegram.trim()}` : '',
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
    if (!v.phone.trim() && !v.telegram.trim()) {
      this.err.set(
        l === 'kk' ? 'Байланыс үшін телефон немесе Telegram көрсетіңіз' : 'Укажите телефон или Telegram для связи',
      );
      return;
    }
    this.sending.set(true);
    const waveText = this.resolveWaveText(v.waveId, l);
    const message = [`${l === 'kk' ? 'Күндері' : 'Даты'}: ${waveText}`, v.comment.trim()].filter(Boolean).join(' · ');
    this.api
      .sendLead({
        name: v.name.trim(),
        phone: v.phone.trim(),
        telegram: v.telegram.trim(),
        message,
      })
      .subscribe({
        next: () => {
          this.submittedName.set(v.name.trim());
          this.sending.set(false);
          this.sent.set(true);
          this.formTick.update((n) => n + 1);
        },
        error: (e: HttpErrorResponse) => {
          this.sending.set(false);
          this.err.set(
            e.error?.error ??
              (l === 'kk'
                ? 'Сервер қазір жауап бермеді — төмендегі «Бірден WhatsApp-қа» батырмасын басыңыз, хабарлама дайын.'
                : 'Сервер сейчас недоступен — нажмите «Сразу в WhatsApp» ниже, сообщение уже собрано.'),
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
