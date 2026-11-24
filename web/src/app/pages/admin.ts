import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api';
import { I18nService } from '../core/i18n';
import { Lead, User } from '../core/models';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page wrap">
      <header class="sec-head">
        <p class="sec-kicker">{{ i18n.t('ARALA · Топты басқару', 'ARALA · Управление группой') }}</p>
        <h1 class="sec-title">{{ i18n.t('Админ-панель', 'Админ-панель') }}</h1>
        <p class="sec-lead">
          {{
            i18n.t(
              'Төлемнен кейін қатысушыға аккаунт ашыңыз — оған бірден визалық гайд ашылады.',
              'Создайте аккаунт участнику после оплаты — и ему сразу откроется визовый гайд.'
            )
          }}
        </p>
      </header>

      <div class="panel">
        <h2>{{ i18n.t('Жаңа қатысушы', 'Новый участник') }}</h2>
        <form [formGroup]="form" (ngSubmit)="create()">
          <input formControlName="name" [placeholder]="i18n.t('Есімі', 'Имя')" />
          <input formControlName="email" placeholder="Email" />
          <input
            formControlName="password"
            [placeholder]="i18n.t('8 таңбадан кем емес құпия сөз', 'Пароль от 8 символов')"
          />
          <label class="chk">
            <input type="checkbox" formControlName="tourAccess" />
            {{ i18n.t('Визалық гайдқа рұқсат', 'Доступ к визовому гайду') }}
          </label>
          <button type="submit" class="btn btn--primary btn--sm">
            {{ i18n.t('Аккаунт құру', 'Создать аккаунт') }}
          </button>
          @if (msg()) {
            <p class="msg">{{ msg() }}</p>
          }
        </form>
      </div>

      <div class="panel">
        <h2>{{ i18n.t('Саяхатшылар', 'Путешественники') }} ({{ users().length }})</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ i18n.t('Есімі', 'Имя') }}</th>
                <th>Email</th>
                <th>{{ i18n.t('Рөлі', 'Роль') }}</th>
                <th>{{ i18n.t('Гайд', 'Гайд') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td><strong>{{ u.name }}</strong></td>
                  <td>{{ u.email }}</td>
                  <td><span class="role">{{ u.role }}</span></td>
                  <td>
                    <button type="button" class="toggle" [class.is-on]="u.tourAccess" (click)="toggle(u)">
                      {{ u.tourAccess ? i18n.t('Ашық', 'Открыт') : i18n.t('Жабық', 'Закрыт') }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h2>{{ i18n.t('Сайттан түскен өтінімдер', 'Заявки с сайта') }} ({{ leads().length }})</h2>
        <div class="leads">
          @for (l of leads(); track l.id) {
            <article class="lead">
              <strong>{{ l.name }}</strong>
              <p class="contact">{{ l.phone }} @if (l.phone && l.telegram) { · } {{ l.telegram }}</p>
              <p class="body">{{ l.message }}</p>
            </article>
          } @empty {
            <p class="empty">{{ i18n.t('Әзірге жаңа өтінімдер жоқ.', 'Пока нет новых заявок.') }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .page {
      padding-top: 118px;
      padding-bottom: 56px;
      max-width: 980px;
    }

    .panel {
      margin-top: 24px;
      padding: 26px 28px;
      border-radius: var(--r-lg);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }

    h2 {
      margin: 0 0 18px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold-deep);
    }

    form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: center;
    }

    input:not([type='checkbox']) {
      width: 100%;
      padding: 11px 14px;
      border-radius: var(--r-sm);
      border: 1px solid var(--border-strong);
      background: var(--bg);
      color: var(--text);
      font-size: 14.5px;
    }

    .chk {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .msg {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--alpine);
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th,
    td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid var(--border);
    }

    th {
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-subtle);
    }

    .role {
      padding: 3px 9px;
      border-radius: var(--r-pill);
      background: var(--surface-soft);
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 700;
    }

    .toggle {
      border: 1px solid var(--border-strong);
      border-radius: var(--r-pill);
      padding: 6px 14px;
      background: var(--surface-soft);
      color: var(--text-muted);
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }

    .toggle.is-on {
      background: rgba(21, 128, 61, 0.12);
      border-color: rgba(21, 128, 61, 0.35);
      color: var(--success);
    }

    .leads {
      display: grid;
      gap: 12px;
    }

    .lead {
      padding: 16px 18px;
      border-radius: var(--r-md);
      background: var(--bg);
      border: 1px solid var(--border);
    }

    .lead strong {
      font-size: 16px;
    }

    .contact {
      margin: 4px 0 0;
      font-family: var(--font-mono);
      font-size: 12.5px;
      color: var(--alpine);
    }

    .body {
      margin: 8px 0 0;
      font-size: 14.5px;
      color: var(--text-muted);
    }

    .empty {
      margin: 0;
      color: var(--text-subtle);
    }

    @media (max-width: 720px) {
      .panel {
        padding: 20px 18px;
      }
      form {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Admin {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(I18nService);
  readonly users = signal<User[]>([]);
  readonly leads = signal<Lead[]>([]);
  readonly msg = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    tourAccess: [true],
  });

  constructor() {
    this.reload();
  }

  reload() {
    this.api.adminUsers().subscribe((u) => this.users.set(u));
    this.api.adminLeads().subscribe((l) => this.leads.set(l));
  }

  create() {
    this.msg.set('');
    if (this.form.invalid) {
      this.msg.set(
        this.i18n.t(
          'Есімі, email және 8 таңбадан кем емес құпия сөзді толтырыңыз',
          'Заполните имя, email и пароль от 8 символов',
        ),
      );
      return;
    }
    const v = this.form.getRawValue();
    this.api.createUser({ ...v, role: 'traveler' }).subscribe({
      next: () => {
        this.msg.set(this.i18n.t('Аккаунт құрылды', 'Аккаунт создан'));
        this.form.reset({ name: '', email: '', password: '', tourAccess: true });
        this.reload();
      },
      error: (e: HttpErrorResponse) => this.msg.set(e.error?.error ?? this.i18n.t('Қате', 'Ошибка')),
    });
  }

  toggle(u: User) {
    this.api.patchUser(u.id, { tourAccess: !u.tourAccess }).subscribe(() => this.reload());
  }
}
