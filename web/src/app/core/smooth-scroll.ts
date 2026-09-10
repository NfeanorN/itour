import { Injectable, inject, DestroyRef } from '@angular/core';
import Lenis from 'lenis';

@Injectable({ providedIn: 'root' })
export class SmoothScroll {
  private readonly destroy = inject(DestroyRef);
  private lenis?: Lenis;

  start() {
    if (this.lenis) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    this.lenis = new Lenis({
      autoRaf: true,
      anchors: { offset: -12 },
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    this.destroy.onDestroy(() => {
      this.lenis?.destroy();
      this.lenis = undefined;
    });
  }

  to(target: string | HTMLElement, offset = -12) {
    this.lenis?.scrollTo(target, { offset, duration: 1.25 });
  }
}
