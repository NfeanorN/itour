import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[reveal]',
  host: { class: 'reveal' },
})
export class Reveal {
  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    afterNextRender(() => {
      const node = el.nativeElement;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              node.classList.add('is-in');
              io.unobserve(node);
            }
          }
        },
        { threshold: 0.14, rootMargin: '0px 0px -10% 0px' },
      );
      io.observe(node);
    });
  }
}
