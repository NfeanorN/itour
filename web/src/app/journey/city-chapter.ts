import { Component, input, signal } from '@angular/core';
import { Reveal } from '../core/reveal';
import { City, PlaceKind } from '../data/tour';

@Component({
  selector: 'app-city-chapter',
  imports: [Reveal],
  templateUrl: './city-chapter.html',
  styleUrl: './city-chapter.scss',
})
export class CityChapter {
  readonly city = input.required<City>();
  readonly filter = signal<PlaceKind | 'all'>('all');

  places() {
    const all = this.city().places;
    const f = this.filter();
    return f === 'all' ? all : all.filter((p) => p.kind === f);
  }
}
