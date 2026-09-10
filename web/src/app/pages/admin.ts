import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api';
import { Lead, User } from '../core/models';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  template: `
    <section class="wrap">
      <h1>Админ</h1>
      <p class="lead">Создайте аккаунт после оплаты — и человек увидит гайд.</p>

      <form [formGroup]="form" (ngSubmit)="create()">
        <input formControlName="name" placeholder="Имя" />
        <input formControlName="email" placeholder="Email" />
        <input formControlName="password" placeholder="Пароль от 8 символов" />
        <label class="chk"><input type="checkbox" formControlName="tourAccess" /> доступ к гайду</label>
        <button type="submit">Создать аккаунт</button>
        @if (msg()) { <p>{{ msg() }}</p> }
      </form>

      <h2>Путешественники</h2>
      <table>
        <thead>
          <tr><th>Имя</th><th>Email</th><th>Роль</th><th>Гайд</th></tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.role }}</td>
              <td>
                <button type="button" (click)="toggle(u)">{{ u.tourAccess ? 'Открыт' : 'Закрыт' }}</button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <h2>Заявки</h2>
      <div class="leads">
        @for (l of leads(); track l.id) {
          <article>
            <strong>{{ l.name }}</strong>
            <p>{{ l.phone }} · {{ l.telegram }}</p>
            <p>{{ l.message }}</p>
          </article>
        } @empty {
          <p>Пока пусто</p>
        }
      </div>
    </section>
  `,
  styles: `
    .wrap { padding: 140px 36px 80px; max-width: 960px; margin: 0 auto; }
    h1 { font-size: 56px; letter-spacing: -0.05em; margin: 0 0 8px; }
    .lead, h2 { color: #a1a1a6; }
    h2 { margin: 48px 0 16px; font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase; }
    form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 32px 0; }
    input {
      background: rgb(255 255 255 / 0.04); border: 1px solid rgb(255 255 255 / 0.1);
      border-radius: 12px; padding: 12px; color: #fff; font: inherit;
    }
    .chk { display: flex; align-items: center; gap: 8px; color: #d2d2d7; font-size: 14px; }
    button {
      border: 0; border-radius: 980px; padding: 10px 16px; font: inherit; font-weight: 600; cursor: pointer;
    }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; padding: 12px 8px; border-bottom: 1px solid rgb(255 255 255 / 0.08); }
    .leads { display: grid; gap: 12px; }
    article { padding: 16px; border-radius: 16px; background: rgb(255 255 255 / 0.04); }
    article p { margin: 6px 0 0; color: #a1a1a6; }
    @media (max-width: 720px) {
      .wrap { padding: 120px 18px; }
      form { grid-template-columns: 1fr; }
    }
  `,
})
export class Admin {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
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
      this.msg.set('Заполните имя, email и пароль');
      return;
    }
    const v = this.form.getRawValue();
    this.api.createUser({ ...v, role: 'traveler' }).subscribe({
      next: () => {
        this.msg.set('Аккаунт создан');
        this.form.reset({ name: '', email: '', password: '', tourAccess: true });
        this.reload();
      },
      error: (e: HttpErrorResponse) => this.msg.set(e.error?.error ?? 'Ошибка'),
    });
  }

  toggle(u: User) {
    this.api.patchUser(u.id, { tourAccess: !u.tourAccess }).subscribe(() => this.reload());
  }
}
