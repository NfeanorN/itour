import { afterNextRender, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SmoothScroll } from './core/smooth-scroll';
import { Footer } from './layout/footer';
import { Nav } from './layout/nav';

@Component({
  imports: [RouterOutlet, Nav, Footer],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    const scroll = inject(SmoothScroll);
    afterNextRender(() => scroll.start());
  }
}
