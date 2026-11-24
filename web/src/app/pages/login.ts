import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth';
import { AralaLogo } from '../shared/arala-logo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AralaLogo],
  template: `
    <section class="page">
      <div class="card">
        <app-arala-logo variant="badge" />
        <h1>Личный кабинет</h1>
        @if (locked()) {
          <p class="note">
            Визовый гайд ARALA открывается после оплаты тура. Мы создаём аккаунт вручную и присылаем доступ. Нет логина
            — <a routerLink="/" fragment="book">оставьте заявку</a>.
          </p>
        } @else {
          <p class="note">Доступ выдаём участникам тура после оплаты. Самостоятельно зарегистрироваться нельзя.</p>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            Email
            <input formControlName="email" type="email" autocomplete="username" placeholder="you@example.com" />
          </label>
          <label>
            Пароль
            <input formControlName="password" type="password" autocomplete="current-password" placeholder="••••••••" />
          </label>
          @if (err()) {
            <p class="err">{{ err() }}</p>
          }
          <button type="submit" class="btn btn--primary" [disabled]="busy()">
            {{ busy() ? 'Входим…' : 'Продолжить' }}
          </button>
        </form>

        <a routerLink="/" class="back">← Вернуться на главную</a>
      </div>
    </section>
  `,
  styles: `
    .page {
      min-height: calc(100svh - 140px);
      display: grid;
      place-items: center;
      padding: 120px 16px 60px;
    }

    .card {
      width: min(460px, 100%);
      padding: 36px 32px;
      border-radius: var(--r-xl);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    h1 {
      margin: 20px 0 10px;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .note {
      margin: 0 0 24px;
      font-size: 14.5px;
      line-height: 1.55;
      color: var(--text-muted);
    }

    .note a {
      color: var(--ruby);
      font-weight: 700;
    }

    form {
      width: 100%;
      display: grid;
      gap: 14px;
      text-align: left;
      margin-bottom: 20px;
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-muted);
    }

    input {
      width: 100%;
      padding: 12px 14px;
      border-radius: var(--r-sm);
      border: 1px solid var(--border-strong);
      background: var(--bg);
      color: var(--text);
      font-size: 15px;
      outline: none;
    }

    input:focus {
      border-color: var(--ruby);
      background: #ffffff;
    }

    .err {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--danger);
    }

    .back {
      font-size: 14px;
      font-weight: 700;
      color: var(--alpine);
      text-decoration: none;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly err = signal('');
  readonly busy = signal(false);
  readonly locked = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.locked.set(this.route.snapshot.queryParamMap.get('locked') === '1');
  }

  submit() {
    this.err.set('');
    if (this.form.invalid) {
      this.err.set('Введите корректный email и пароль');
      return;
    }
    this.busy.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        const next = this.route.snapshot.queryParamMap.get('next');
        if (res.user.role === 'admin') {
          void this.router.navigateByUrl(next || '/admin');
          return;
        }
        if (res.user.tourAccess) {
          void this.router.navigateByUrl(next || '/guide');
          return;
        }
        this.busy.set(false);
        this.locked.set(true);
        this.err.set('Аккаунт есть, но доступ к гайду ещё закрыт. Напишите нам в WhatsApp.');
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.err.set(e.error?.error ?? 'Не удалось войти');
      },
    });
  }
}
