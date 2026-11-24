import { Component, input, signal } from '@angular/core';
import { Reveal } from '../core/reveal';
import { Chapter, PlaceKind } from '../data/tour';

@Component({
  selector: 'app-city-chapter',
  imports: [Reveal],
  templateUrl: './city-chapter.html',
  styleUrl: './city-chapter.scss',
})
export class CityChapter {
  readonly chapter = input.required<Chapter>();
  readonly filter = signal<PlaceKind | 'all'>('all');

  places() {
    const all = this.chapter().places;
    const f = this.filter();
    return f === 'all' ? all : all.filter((p) => p.kind === f);
  }
}
