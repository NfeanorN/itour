import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="wrap">
      <h1>Войти</h1>
      @if (locked()) {
        <p class="note">
          Гайд открывается после покупки тура. Мы создаём аккаунт вручную и присылаем доступ.
          Нет логина — <a href="/#book">запишитесь</a>.
        </p>
      } @else {
        <p class="note">Аккаунт выдаём после оплаты. Самостоятельно зарегистрироваться нельзя.</p>
      }
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email<input formControlName="email" type="email" autocomplete="username" /></label>
        <label>Пароль<input formControlName="password" type="password" autocomplete="current-password" /></label>
        @if (err()) {
          <p class="err">{{ err() }}</p>
        }
        <button type="submit" [disabled]="busy()">Продолжить</button>
      </form>
      <a routerLink="/">На главную</a>
    </section>
  `,
  styles: `
    .wrap {
      min-height: 100svh;
      display: grid;
      place-content: center;
      padding: 120px 20px 80px;
      text-align: center;
    }
    h1 {
      font-size: 56px;
      letter-spacing: -0.05em;
      margin: 0 0 16px;
    }
    .note {
      color: #86868b;
      max-width: 420px;
      margin: 0 auto 28px;
      line-height: 1.5;
    }
    form {
      display: grid;
      gap: 12px;
      width: min(420px, 100%);
      margin: 0 auto 24px;
      text-align: left;
    }
    label {
      display: grid;
      gap: 6px;
      font-size: 12px;
      color: #86868b;
    }
    input {
      background: rgb(255 255 255 / 0.04);
      border: 1px solid rgb(255 255 255 / 0.12);
      border-radius: 14px;
      padding: 12px 14px;
      color: #fff;
      font: inherit;
    }
    button {
      margin-top: 8px;
      border: 0;
      border-radius: 980px;
      padding: 12px;
      background: #f5f5f7;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .err { color: #ff8a80; }
    a { color: #f5f5f7; }
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
      this.err.set('Введите email и пароль');
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
        this.err.set('Аккаунт есть, но гайд ещё закрыт. Напишите нам.');
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.err.set(e.error?.error ?? 'Не удалось войти');
      },
    });
  }
}
