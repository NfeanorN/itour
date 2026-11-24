import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api';
import { TOUR_WAVES, WHATSAPP_TOURS, whatsappLink } from '../data/tour';

@Component({
  selector: 'app-booking-modal',
  imports: [ReactiveFormsModule],
  template: `
    <dialog #dlg class="modal" (click)="onBackdrop($event)" (cancel)="close()">
      <div class="sheet" (click)="$event.stopPropagation()">
        <header class="head">
          <div>
            <p class="kicker">Классический Евротур · ARALA</p>
            <h3>Забронировать место</h3>
          </div>
          <button type="button" class="close" (click)="close()" aria-label="Закрыть окно">✕</button>
        </header>

        @if (sent()) {
          <div class="done">
            <div class="done-badge">✓ Заявка принята</div>
            <p>
              Спасибо, <strong>{{ submittedName() }}</strong>! Мы получили заявку и свяжемся с вами в ближайшее время.
              Чтобы получить ответ ещё быстрее — продублируйте запрос в WhatsApp одним нажатием:
            </p>
            <div class="done-actions">
              <a [href]="waUrl()" target="_blank" rel="noreferrer" class="btn btn--primary">
                Написать в WhatsApp
              </a>
              <button type="button" class="btn btn--ghost" (click)="close()">Закрыть</button>
            </div>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label>
              Ваше имя
              <input formControlName="name" placeholder="Как к вам обращаться" autocomplete="name" />
            </label>

            <div class="row">
              <label>
                Телефон / WhatsApp
                <input formControlName="phone" placeholder="+7 7XX XXX XX XX" autocomplete="tel" />
              </label>
              <label>
                Telegram (если удобнее)
                <input formControlName="telegram" placeholder="@username" />
              </label>
            </div>

            <label>
              Удобные даты тура
              <select formControlName="wave">
                @for (w of waves; track w.id) {
                  <option [value]="w.dates + ' (' + w.price + ')'">
                    {{ w.dates }} — {{ w.price }} ({{ w.duration }})
                  </option>
                }
                <option value="Помогите выбрать даты">Помогите выбрать даты</option>
              </select>
            </label>

            <label>
              Комментарий или вопрос
              <textarea
                formControlName="comment"
                rows="3"
                placeholder="Например: лечу вдвоём, интересует виза"
              ></textarea>
            </label>

            @if (err()) {
              <p class="err">{{ err() }}</p>
            }

            <div class="actions">
              <button type="submit" class="btn btn--primary" [disabled]="sending()">
                {{ sending() ? 'Отправляем…' : 'Оставить заявку' }}
              </button>
              <a [href]="waUrl()" target="_blank" rel="noreferrer" class="btn btn--ghost">
                Сразу в WhatsApp
              </a>
            </div>
            <p class="hint">Бесплатное визовое сопровождение включено. Места в группе ограничены.</p>
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
    wave: [`${TOUR_WAVES[0].dates} (${TOUR_WAVES[0].price})`],
    comment: [''],
  });

  readonly waUrl = computed(() => {
    this.formTick();
    const v = this.form.getRawValue();
    const parts = [
      'Здравствуйте! Хочу записаться в Классический Евротур ARALA.',
      v.name.trim() ? `Имя: ${v.name.trim()}` : '',
      v.wave ? `Даты: ${v.wave}` : '',
      v.phone.trim() ? `Телефон: ${v.phone.trim()}` : '',
      v.telegram.trim() ? `Telegram: ${v.telegram.trim()}` : '',
      v.comment.trim() ? `Комментарий: ${v.comment.trim()}` : '',
    ].filter(Boolean);
    return whatsappLink(WHATSAPP_TOURS, parts.join('\n'));
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
  }

  open(waveLabel?: string): void {
    this.sent.set(false);
    this.err.set('');
    if (waveLabel) {
      this.form.controls.wave.setValue(waveLabel);
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
    const v = this.form.getRawValue();
    if (!v.name.trim()) {
      this.err.set('Напишите ваше имя');
      return;
    }
    if (!v.phone.trim() && !v.telegram.trim()) {
      this.err.set('Укажите телефон или Telegram для связи');
      return;
    }
    this.sending.set(true);
    const message = [`Даты: ${v.wave}`, v.comment.trim()].filter(Boolean).join(' · ');
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
              'Сервер сейчас недоступен — нажмите «Сразу в WhatsApp» ниже, сообщение уже собрано.',
          );
        },
      });
  }
}
