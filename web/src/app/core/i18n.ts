import { Injectable, signal } from '@angular/core';

export type Lang = 'kk' | 'ru';

export interface BiText {
  kk: string;
  ru: string;
}

const LANG_KEY = 'arala_lang';

const PAGE_TITLES: BiText = {
  kk: 'ARALA — Авторлық Еуротур | Италия, Франция, Швейцария',
  ru: 'ARALA — Авторский Евротур | Италия, Франция, Швейцария',
};

function readInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ru' || saved === 'kk') {
      return saved;
    }
  } catch {
    // SSR / storage restricted
  }
  return 'kk';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(readInitialLang());

  constructor() {
    this.syncDocument(this.lang());
  }

  setLang(next: Lang): void {
    if (this.lang() === next) {
      return;
    }
    this.lang.set(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore storage errors
    }
    this.syncDocument(next);
  }

  toggle(): void {
    this.setLang(this.lang() === 'kk' ? 'ru' : 'kk');
  }

  pick<T>(pair: { kk: T; ru: T }): T {
    return pair[this.lang()];
  }

  t(kk: string, ru: string): string {
    return this.lang() === 'kk' ? kk : ru;
  }

  private syncDocument(l: Lang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l;
      document.title = PAGE_TITLES[l];
    }
  }
}
