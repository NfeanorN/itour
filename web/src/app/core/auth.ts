import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { User } from './models';

export const TOKEN_KEY = 'arala_token';
export const LEGACY_TOKEN_KEY = 'itour_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly ready = signal(false);

  constructor() {
    this.restore();
  }

  get isAdmin() {
    return this.user()?.role === 'admin';
  }

  get canReadGuides() {
    const u = this.user();
    return !!u && (u.tourAccess || u.role === 'admin');
  }

  restore() {
    const token = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
    if (!token) {
      this.ready.set(true);
      return;
    }
    if (!localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
    this.http.get<User>('/api/auth/me').subscribe({
      next: (u) => {
        this.user.set(u);
        this.ready.set(true);
      },
      error: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        this.user.set(null);
        this.ready.set(true);
      },
    });
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User }>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        this.user.set(res.user);
      }),
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    this.user.set(null);
    void this.router.navigateByUrl('/');
  }

  ensureReady() {
    return of(this.ready()).pipe(catchError(() => of(true)));
  }
}
