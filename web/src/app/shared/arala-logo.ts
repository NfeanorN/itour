import { Component, input } from '@angular/core';

@Component({
  selector: 'app-arala-logo',
  template: `
    <span class="arala-logo" [class]="'arala-logo arala-logo--' + variant()">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path
            d="M8.5 37L21.8 11.4C22.7 9.6 25.3 9.6 26.2 11.4L39.5 37"
            stroke="currentColor"
            stroke-width="3.1"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13.2 36L19.4 26.8L23.8 31.8L29.4 25.2L34.8 36"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.88"
          />
          <path
            d="M20.5 37.5C22.4 34 27 33 25.3 29.7C23.8 26.9 22.3 25.4 24 21.8"
            stroke="var(--logo-accent, #F6DFB0)"
            stroke-width="2.1"
            stroke-linecap="round"
          />
          <path d="M24 13.6L26.7 19.2L24 18.1L21.3 19.2L24 13.6Z" fill="currentColor" />
        </svg>
      </span>
      <span class="word">
        <strong>arala</strong>
        @if (showSub()) {
          <small>tours</small>
        }
      </span>
    </span>
  `,
  styles: `
    .arala-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      user-select: none;
    }

    .mark {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      flex: none;
      transition: transform 0.2s ease;
    }

    .mark svg {
      width: 26px;
      height: 26px;
      display: block;
    }

    .word {
      display: flex;
      flex-direction: column;
      line-height: 1;
    }

    .word strong {
      font-family: var(--font-sans);
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.04em;
      text-transform: lowercase;
    }

    .word small {
      margin-top: 2px;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      opacity: 0.65;
    }

    .arala-logo--badge .mark {
      background: var(--ruby);
      color: #ffffff;
      --logo-accent: #f6dfb0;
      box-shadow: 0 6px 18px rgba(200, 16, 46, 0.24);
    }

    .arala-logo--badge .word strong {
      color: var(--text);
    }

    .arala-logo--badge .word small {
      color: var(--text-subtle);
    }

    .arala-logo--light .mark {
      background: var(--ruby);
      color: #ffffff;
      --logo-accent: #f6dfb0;
    }

    .arala-logo--light .word strong {
      color: #ffffff;
    }

    .arala-logo--light .word small {
      color: #cbd5e1;
    }

    .arala-logo--dark .mark {
      background: var(--ink-dark);
      color: #ffffff;
      --logo-accent: var(--gold);
    }

    .arala-logo--dark .word strong {
      color: var(--ink-dark);
    }
  `,
})
export class AralaLogo {
  readonly variant = input<'badge' | 'light' | 'dark'>('badge');
  readonly showSub = input(true);
}
