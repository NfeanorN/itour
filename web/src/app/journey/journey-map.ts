import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { CITIES, LEGS, type City } from '../data/tour';

type Beat =
  | { kind: 'overview'; title: string; text: string; ms: number }
  | { kind: 'dwell'; city: string; title: string; text: string; ms: number }
  | { kind: 'leg'; index: number; title: string; text: string; ms: number };

const TIMELINE: Beat[] = [
  { kind: 'overview', title: 'Весь маршрут', text: 'Алматы, Италия, Франция, Швейцария — и домой.', ms: 3000 },
  { kind: 'dwell', city: 'almaty', title: 'Алматы', text: 'Собираемся. Дальше — Рим, с одной стыковкой.', ms: 2200 },
  { kind: 'leg', index: 0, title: 'Летим в Рим', text: 'Ночь над Каспием. Стыковка впереди.', ms: 5200 },
  { kind: 'dwell', city: 'istanbul', title: 'Пересадка', text: 'Коридор, кофе — и снова в воздух.', ms: 1400 },
  { kind: 'leg', index: 1, title: 'Летим в Рим', text: 'Второй борт. Утром уже Италия.', ms: 3600 },
  { kind: 'dwell', city: 'rome', title: 'Рим', text: 'Колизей, Ватикан, ужин в Трастевере.', ms: 2600 },
  { kind: 'leg', index: 2, title: 'Поезд в Венецию', text: 'Пара часов — и город на воде.', ms: 2600 },
  { kind: 'dwell', city: 'venice', title: 'Венеция', text: 'Каналы, цикетти, площадь Сан-Марко.', ms: 2400 },
  { kind: 'leg', index: 3, title: 'Летим в Париж', text: 'Короткий перелёт. Другой свет за окном.', ms: 4200 },
  { kind: 'dwell', city: 'paris', title: 'Париж', text: 'Башня на закате, кафе, набережные.', ms: 2400 },
  { kind: 'leg', index: 4, title: 'Поезд в Цюрих', text: 'Франция сменяется Швейцарией.', ms: 2600 },
  { kind: 'dwell', city: 'zurich', title: 'Цюрих', text: 'Озеро, старый город, спокойствие.', ms: 2200 },
  { kind: 'leg', index: 5, title: 'Поезд в Альпы', text: 'Сорок минут — и стена водопадов.', ms: 2200 },
  { kind: 'dwell', city: 'lauterbrunnen', title: 'Лаутербруннен', text: 'Долина, ради которой едут в горы.', ms: 2600 },
  { kind: 'leg', index: 6, title: 'Обратно в Цюрих', text: 'Забираем чемоданы и едем в аэропорт.', ms: 1800 },
  { kind: 'dwell', city: 'zurich', title: 'Цюрих', text: 'Вылет домой. Одна стыковка по пути.', ms: 2600 },
  { kind: 'leg', index: 7, title: 'Летим домой', text: 'Сначала стыковка, потом ночной борт.', ms: 4000 },
  { kind: 'dwell', city: 'istanbul', title: 'Пересадка', text: 'Последняя стыковка. Дальше — домой.', ms: 1400 },
  { kind: 'leg', index: 8, title: 'Домой', text: 'Ночь над степью. Утром уже Алматы.', ms: 5600 },
  { kind: 'dwell', city: 'almaty', title: 'Алматы', text: 'Маршрут закрыт. Можно смотреть ещё раз.', ms: 2400 },
];

const DURATION = TIMELINE.reduce((s, b) => s + b.ms, 0);

function destIds() {
  return CITIES.filter((c) => c.id !== 'istanbul').map((c) => c.id);
}

function cityOf(id: string): City {
  return CITIES.find((c) => c.id === id)!;
}

function ll(id: string): L.LatLng {
  const c = cityOf(id);
  return L.latLng(c.lat, c.lon);
}

function p(lat: number, lng: number) {
  return L.latLng(lat, lng);
}

function ease(t: number) {
  const x = Math.min(1, Math.max(0, t));
  const a = 0.16;
  if (x < a) {
    return (x / a) * (x / a) * a;
  }
  if (x > 1 - a) {
    const u = (1 - x) / a;
    return 1 - u * u * a;
  }
  return x;
}

function haversine(a: L.LatLng, b: L.LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function toXYZ(lat: number, lng: number) {
  const φ = (lat * Math.PI) / 180;
  const λ = (lng * Math.PI) / 180;
  return { x: Math.cos(φ) * Math.cos(λ), y: Math.cos(φ) * Math.sin(λ), z: Math.sin(φ) };
}

function fromXYZ(v: { x: number; y: number; z: number }) {
  return L.latLng(
    (Math.atan2(v.z, Math.hypot(v.x, v.y)) * 180) / Math.PI,
    (Math.atan2(v.y, v.x) * 180) / Math.PI,
  );
}

function greatCircle(a: L.LatLng, b: L.LatLng, steps: number) {
  const va = toXYZ(a.lat, a.lng);
  const vb = toXYZ(b.lat, b.lng);
  let dot = va.x * vb.x + va.y * vb.y + va.z * vb.z;
  dot = Math.min(1, Math.max(-1, dot));
  const ω = Math.acos(dot);
  const out: L.LatLng[] = [];
  if (ω < 1e-6 || steps < 2) {
    return [a, b];
  }
  const sinω = Math.sin(ω);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s1 = Math.sin((1 - t) * ω) / sinω;
    const s2 = Math.sin(t * ω) / sinω;
    out.push(fromXYZ({ x: va.x * s1 + vb.x * s2, y: va.y * s1 + vb.y * s2, z: va.z * s1 + vb.z * s2 }));
  }
  return out;
}

function stitch(waypoints: L.LatLng[]) {
  const pts: L.LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const km = haversine(waypoints[i], waypoints[i + 1]);
    const steps = Math.max(18, Math.round(km / 12));
    const seg = greatCircle(waypoints[i], waypoints[i + 1], steps);
    if (i > 0) {
      seg.shift();
    }
    pts.push(...seg);
  }
  return pts;
}

function densify(waypoints: L.LatLng[], everyKm: number) {
  const pts: L.LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const steps = Math.max(2, Math.round(haversine(a, b) / everyKm));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push(L.latLng(a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t));
    }
  }
  pts.push(waypoints[waypoints.length - 1]);
  return pts;
}

function clonePath(path: L.LatLng[]) {
  return path.map((q) => L.latLng(q.lat, q.lng));
}

function along(path: L.LatLng[], dist: number[], t: number): L.LatLng {
  const target = Math.min(1, Math.max(0, t)) * dist[dist.length - 1];
  let i = 1;
  while (i < dist.length && dist[i] < target) {
    i++;
  }
  const a = path[i - 1];
  const b = path[Math.min(path.length - 1, i)];
  const span = dist[i] - dist[i - 1] || 1;
  const f = (target - dist[i - 1]) / span;
  return L.latLng(a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f);
}

function prefix(path: L.LatLng[], dist: number[], t: number) {
  const end = along(path, dist, t);
  const target = Math.min(1, Math.max(0, t)) * dist[dist.length - 1];
  const out: L.LatLng[] = [L.latLng(path[0].lat, path[0].lng)];
  for (let i = 1; i < path.length; i++) {
    if (dist[i] >= target) {
      break;
    }
    out.push(L.latLng(path[i].lat, path[i].lng));
  }
  out.push(L.latLng(end.lat, end.lng));
  return out;
}

function lengths(path: L.LatLng[]) {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    acc.push(acc[i - 1] + haversine(path[i - 1], path[i]));
  }
  return acc;
}

function bearing(a: L.LatLng, b: L.LatLng) {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function lerpAngle(from: number, to: number, k: number) {
  const d = ((((to - from) % 360) + 540) % 360) - 180;
  return (((from + d * k) % 360) + 360) % 360;
}

const AIRWAYS: Record<string, L.LatLng[]> = {
  'almaty-istanbul': stitch([
    ll('almaty'),
    p(43.9, 70.1),
    p(44.55, 62.2),
    p(43.95, 51.4),
    p(42.6, 40.2),
    ll('istanbul'),
  ]),
  'istanbul-rome': stitch([ll('istanbul'), p(40.2, 26.3), p(40.55, 19.4), ll('rome')]),
  'rome-venice': densify([ll('rome'), p(43.77, 11.25), p(44.49, 11.34), ll('venice')], 8),
  'venice-paris': densify([ll('venice'), p(45.46, 9.19), p(45.07, 7.69), p(45.76, 4.84), p(47.4, 3.3), ll('paris')], 10),
  'paris-zurich': densify(
    [ll('paris'), p(48.59, 3.55), p(48.1, 4.8), p(47.32, 5.04), p(47.4, 6.8), p(47.56, 7.59), ll('zurich')],
    8,
  ),
  'zurich-lauterbrunnen': densify([ll('zurich'), p(47.05, 8.31), p(46.69, 7.86), ll('lauterbrunnen')], 6),
  'lauterbrunnen-zurich': densify([ll('lauterbrunnen'), p(46.69, 7.86), p(47.05, 8.31), ll('zurich')], 6),
  'zurich-istanbul': stitch([ll('zurich'), p(45.7, 15.9), p(43.1, 21.2), ll('istanbul')]),
  'istanbul-almaty': stitch([
    ll('istanbul'),
    p(42.6, 40.2),
    p(43.95, 51.4),
    p(44.55, 62.2),
    p(43.9, 70.1),
    ll('almaty'),
  ]),
};

function pathOf(leg: { from: string; to: string }) {
  return AIRWAYS[`${leg.from}-${leg.to}`] ?? stitch([ll(leg.from), ll(leg.to)]);
}

const PLANE_SVG = `<svg class="ico-plane" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
const TRAIN_SVG = `<svg class="ico-train" viewBox="0 0 32 64" aria-hidden="true"><path fill="#fff" d="M16 2c-5.2 0-9 4.4-9 10.2v39.6C7 57.6 10.8 62 16 62s9-4.4 9-10.2V12.2C25 6.4 21.2 2 16 2zm0 6.2c1.8 0 3.2 1.2 3.2 2.7S17.8 13.6 16 13.6 12.8 12.4 12.8 10.9 14.2 8.2 16 8.2zM11.4 20h9.2c.7 0 1.2.5 1.2 1.2v5.2c0 .7-.5 1.2-1.2 1.2h-9.2c-.7 0-1.2-.5-1.2-1.2v-5.2c0-.7.5-1.2 1.2-1.2zm0 12h9.2c.7 0 1.2.5 1.2 1.2v5.2c0 .7-.5 1.2-1.2 1.2h-9.2c-.7 0-1.2-.5-1.2-1.2v-5.2c0-.7.5-1.2 1.2-1.2z"/></svg>`;

@Component({
  selector: 'app-journey-map',
  templateUrl: './journey-map.html',
  styleUrl: './journey-map.scss',
})
export class JourneyMap {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('map');

  readonly title = signal('Весь маршрут');
  readonly text = signal('Алматы, Италия, Франция, Швейцария — и домой.');
  readonly mode = signal<'plane' | 'train' | 'layover' | ''>('');
  readonly done = signal(false);
  readonly playing = signal(false);

  private map?: L.Map;
  private vehicle?: L.Marker;
  private traveled: L.Polyline[] = [];
  private paths: L.LatLng[][] = [];
  private dists: number[][] = [];
  private heading = 0;
  private cityMarks = new Map<string, L.Marker>();
  private raf = 0;
  private origin = 0;
  private started = false;
  private beatAt = -1;
  private camKey = '';

  constructor() {
    afterNextRender(() => {
      this.build();
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting) && !this.started) {
            this.started = true;
            this.map?.invalidateSize();
            this.replay();
          }
        },
        { threshold: 0.32 },
      );
      io.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => {
        io.disconnect();
        cancelAnimationFrame(this.raf);
        this.map?.remove();
      });
    });
  }

  replay() {
    cancelAnimationFrame(this.raf);
    this.done.set(false);
    this.playing.set(true);
    this.beatAt = -1;
    this.camKey = '';
    this.heading = 0;
    this.origin = performance.now();
    this.map?.dragging.disable();
    this.traveled.forEach((line) => line.setLatLngs([]));
    this.setCraftVisible(false);
    this.tick();
  }

  private build() {
    const el = this.mapEl()?.nativeElement;
    if (!el) {
      return;
    }
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomSnap: 0.15,
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
      worldCopyJump: false,
      maxBounds: L.latLngBounds(p(18, -18), p(72, 98)),
      maxBoundsViscosity: 0.7,
    });
    const tiles = {
      keepBuffer: 8,
      updateWhenZooming: false,
      updateWhenIdle: true,
      maxZoom: 16,
    };
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { ...tiles, attribution: 'Tiles &copy; Esri' },
    ).addTo(map);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { ...tiles, opacity: 0.75 },
    ).addTo(map);

    this.paths = LEGS.map((leg) => pathOf(leg));
    this.dists = this.paths.map(lengths);

    this.paths.forEach((_, i) => {
      this.traveled.push(
        L.polyline([], {
          color: '#f4e4c1',
          weight: LEGS[i].mode === 'plane' ? 2.8 : 3.4,
          opacity: 0.96,
          lineJoin: 'round',
          lineCap: 'round',
          smoothFactor: 0,
        }).addTo(map),
      );
    });

    for (const c of CITIES) {
      const hub = c.id === 'istanbul';
      const mark = L.marker(ll(c.id), {
        icon: L.divIcon({
          className: `pin pin--${c.id}${hub ? ' pin--hub' : ''}`,
          html: `<span class="pin-dot"></span><span class="pin-name">${hub ? 'пересадка' : c.name}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
      }).addTo(map);
      this.cityMarks.set(c.id, mark);
    }

    this.vehicle = L.marker(ll('almaty'), {
      icon: L.divIcon({
        className: 'craft is-hidden',
        html: `<div class="craft-rot" data-kind="plane">${PLANE_SVG}${TRAIN_SVG}</div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      }),
      interactive: false,
      zIndexOffset: 600,
    }).addTo(map);

    this.map = map;
    requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(this.worldBounds(), { padding: [40, 40], maxZoom: 4.2, animate: false });
      this.showCities(destIds(), 'almaty');
    });
  }

  private worldBounds() {
    return L.latLngBounds(CITIES.map((c) => ll(c.id))).pad(0.16);
  }

  private europeBounds() {
    return L.latLngBounds(CITIES.filter((c) => c.id !== 'almaty' && c.id !== 'istanbul').map((c) => ll(c.id))).pad(0.32);
  }

  private look(key: string, bounds: L.LatLngBounds, maxZoom: number, duration: number) {
    if (this.camKey === key) {
      return;
    }
    this.camKey = key;
    this.map?.flyToBounds(bounds, { padding: [56, 56], maxZoom, duration, easeLinearity: 0.24 });
  }

  private tick = () => {
    const ms = Math.min(DURATION, performance.now() - this.origin);
    this.apply(ms);
    if (ms >= DURATION) {
      this.playing.set(false);
      this.done.set(true);
      this.paths.forEach((path, i) => this.traveled[i].setLatLngs(clonePath(path)));
      this.styleTrail('eu');
      this.showCities(destIds(), 'almaty');
      this.setCraftVisible(false);
      this.map?.dragging.enable();
      this.look('end', this.worldBounds(), 4.2, 1.8);
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private apply(ms: number) {
    const vehicle = this.vehicle;
    if (!this.map || !vehicle) {
      return;
    }

    let acc = 0;
    let beat = TIMELINE[0];
    let local = 0;
    for (const b of TIMELINE) {
      if (ms <= acc + b.ms) {
        beat = b;
        local = (ms - acc) / b.ms;
        break;
      }
      acc += b.ms;
      beat = b;
      local = 1;
    }

    const t = ease(Math.min(1, Math.max(0, local)));
    this.title.set(beat.title);
    this.text.set(beat.text);
    const beatIndex = TIMELINE.indexOf(beat);
    this.beatAt = beatIndex;

    if (beat.kind === 'overview') {
      this.mode.set('');
      this.paintTrail(-1);
      this.showCities(destIds(), 'almaty');
      vehicle.setLatLng(ll('almaty'));
      this.setCraftVisible(false);
      this.look('world', this.worldBounds(), 4.2, 1.6);
      return;
    }

    if (beat.kind === 'dwell') {
      this.mode.set(beat.city === 'istanbul' ? 'layover' : '');
      vehicle.setLatLng(ll(beat.city));
      this.setCraftVisible(false);
      this.paintTrail(this.legsBefore(beatIndex));
      this.showCities(this.pinsFor(beat, beatIndex), beat.city === 'istanbul' ? '' : beat.city);
      if (beat.city === 'almaty') {
        this.look(
          beatIndex === 1 ? 'leg-0' : 'leg-8',
          L.latLngBounds(this.paths[beatIndex === 1 ? 0 : 8]).pad(0.12),
          4.7,
          1.7,
        );
      } else if (beat.city === 'istanbul') {
        const next = TIMELINE[beatIndex + 1];
        const idx = next?.kind === 'leg' ? next.index : 1;
        this.look(`leg-${idx}`, L.latLngBounds(this.paths[idx]).pad(0.14), 5.1, 1.5);
        this.styleTrail(idx >= 7 ? 'home' : 'out');
      } else if (beat.city === 'zurich' && this.legsBefore(beatIndex) >= 6) {
        this.look('leg-7', L.latLngBounds(this.paths[7]).pad(0.14), 5.1, 2.1);
        this.styleTrail('home');
      } else {
        this.look('eu', this.europeBounds(), 6.05, 1.8);
        this.styleTrail('eu');
      }
      return;
    }

    const path = this.paths[beat.index];
    const dist = this.dists[beat.index];
    const pt = along(path, dist, t);
    const nxt = along(path, dist, Math.min(1, t + 0.012));
    const mode = LEGS[beat.index].mode;
    this.mode.set(mode);
    const hop = LEGS[beat.index];
    let now = t > 0.78 ? hop.to : hop.from;
    if (now === 'istanbul') {
      now = hop.from === 'istanbul' ? hop.to : hop.from;
    }
    this.showCities(this.pinsFor(beat, beatIndex), now);
    vehicle.setLatLng(pt);
    this.setCraftVisible(true);
    this.setCraft(mode, bearing(pt, nxt), true);
    this.paintTrail(beat.index, prefix(path, dist, t));

    if (beat.index === 0 || beat.index === 8) {
      this.look(`leg-${beat.index}`, L.latLngBounds(path).pad(0.12), 4.7, 1.7);
      this.styleTrail(beat.index === 8 ? 'home' : 'out');
    } else if (beat.index === 1 || beat.index === 7) {
      this.look(`leg-${beat.index}`, L.latLngBounds(path).pad(0.14), 5.1, 1.6);
      this.styleTrail(beat.index === 7 ? 'home' : 'out');
    } else {
      this.look('eu', this.europeBounds(), 6.05, 1.8);
      this.styleTrail('eu');
    }
  }

  private pinsFor(beat: Beat, beatIndex: number) {
    if (beat.kind === 'overview') {
      return destIds();
    }
    if (beat.kind === 'dwell' && beat.city === 'almaty') {
      return beatIndex === 1 ? ['almaty', 'rome'] : ['almaty'];
    }
    if (beat.kind === 'dwell' && beat.city === 'istanbul') {
      return ['istanbul', this.legsBefore(beatIndex) >= 7 ? 'almaty' : 'rome'];
    }
    if (beat.kind === 'dwell' && beat.city === 'zurich' && this.legsBefore(beatIndex) >= 6) {
      return ['zurich', 'almaty'];
    }
    if (beat.kind === 'leg' && beat.index === 0) {
      return ['almaty', 'istanbul', 'rome'];
    }
    if (beat.kind === 'leg' && beat.index === 1) {
      return ['istanbul', 'rome'];
    }
    if (beat.kind === 'leg' && beat.index === 7) {
      return ['zurich', 'istanbul', 'almaty'];
    }
    if (beat.kind === 'leg' && beat.index === 8) {
      return ['istanbul', 'almaty'];
    }
    return CITIES.filter((c) => c.id !== 'almaty' && c.id !== 'istanbul').map((c) => c.id);
  }

  private legsBefore(beatIndex: number) {
    return TIMELINE.filter((x) => x.kind === 'leg' && TIMELINE.indexOf(x) < beatIndex).length;
  }

  private paintTrail(upToLeg: number, current?: L.LatLng[]) {
    this.traveled.forEach((line, i) => {
      if (i < upToLeg) {
        line.setLatLngs(clonePath(this.paths[i]));
      } else if (i === upToLeg && current?.length) {
        line.setLatLngs(current);
      } else {
        line.setLatLngs([]);
      }
    });
  }

  private styleTrail(mood: 'eu' | 'out' | 'home') {
    this.traveled.forEach((line, i) => {
      if (mood === 'home') {
        line.setStyle({
          opacity: i >= 7 ? 0.96 : i <= 1 ? 0.28 : 0.1,
          weight: i >= 7 ? 3 : 2,
        });
        return;
      }
      line.setStyle({
        opacity: 0.96,
        weight: LEGS[i].mode === 'plane' ? 2.8 : 3.4,
      });
    });
  }

  private showCities(active: string[], now: string) {
    this.cityMarks.forEach((mark, key) => {
      const root = mark.getElement();
      if (!root) {
        return;
      }
      root.classList.toggle('is-on', active.includes(key));
      root.classList.toggle('is-now', key === now);
    });
  }

  private setCraftVisible(on: boolean) {
    this.vehicle?.getElement()?.classList.toggle('is-hidden', !on);
  }

  private setCraft(kind: 'plane' | 'train', angle: number, smooth = true) {
    const el = this.vehicle?.getElement()?.querySelector('.craft-rot') as HTMLElement | null;
    if (!el) {
      return;
    }
    this.heading = smooth ? lerpAngle(this.heading, angle, kind === 'train' ? 0.32 : 0.14) : angle;
    el.dataset['kind'] = kind;
    el.style.transform = `rotate(${this.heading}deg)`;
  }
}
