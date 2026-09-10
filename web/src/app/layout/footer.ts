import { Component } from '@angular/core';
import { INSTAGRAM, WHATSAPP } from '../data/tour';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="foot">
      <div>
        <strong>iTour</strong>
        <p>Авторский евротур · Алматы — Европа — домой</p>
      </div>
      <div class="row">
        <a [href]="ig" target="_blank" rel="noreferrer">Instagram</a>
        <a [href]="wa" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </footer>
  `,
  styles: `
    .foot {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 48px 36px 64px;
      border-top: 1px solid rgb(255 255 255 / 0.08);
      color: #86868b;
      font-size: 13px;
    }
    strong { color: #f5f5f7; font-size: 16px; display: block; margin-bottom: 8px; }
    p { margin: 0; }
    .row { display: flex; gap: 20px; }
    a { color: #f5f5f7; text-decoration: none; }
    @media (max-width: 640px) {
      .foot { flex-direction: column; padding: 32px 18px 48px; }
    }
  `,
})
export class Footer {
  readonly ig = INSTAGRAM;
  readonly wa = WHATSAPP;
}
