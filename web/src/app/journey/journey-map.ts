import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { I18nService } from '../core/i18n';
import { CITIES, LEGS, type CityPoint, type Leg } from '../data/tour';
import {
  buildTelemetryPaths,
  cameraZoomForPhase,
  craftSpeed,
  flightAltitude,
  formatDuration,
  railElevation,
  statusForPhase,
  type PhaseStatus,
  type TelemetrySample,
} from './telemetry';

const CITY_MAP = new Map<string, CityPoint>(CITIES.map((c) => [c.id, c]));

const DWELL_MS = 1000;
const OVERVIEW_MS = 1800;

function cityOf(id: string): CityPoint {
  return CITY_MAP.get(id)!;
}

function ll(id: string): L.LatLng {
  const c = cityOf(id);
  return L.latLng(c.lat, c.lon);
}

function pt(lat: number, lon: number): L.LatLng {
  return L.latLng(lat, lon);
}

function haversine(a: L.LatLng, b: L.LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function toXYZ(lat: number, lng: number) {
  const phi = (lat * Math.PI) / 180;
  const lam = (lng * Math.PI) / 180;
  return { x: Math.cos(phi) * Math.cos(lam), y: Math.cos(phi) * Math.sin(lam), z: Math.sin(phi) };
}

function fromXYZ(v: { x: number; y: number; z: number }): L.LatLng {
  return L.latLng(
    (Math.atan2(v.z, Math.hypot(v.x, v.y)) * 180) / Math.PI,
    (Math.atan2(v.y, v.x) * 180) / Math.PI,
  );
}

function greatCircle(a: L.LatLng, b: L.LatLng, steps: number): L.LatLng[] {
  const va = toXYZ(a.lat, a.lng);
  const vb = toXYZ(b.lat, b.lng);
  const dot = Math.min(1, Math.max(-1, va.x * vb.x + va.y * vb.y + va.z * vb.z));
  const omega = Math.acos(dot);
  if (omega < 1e-6 || steps < 2) {
    return [a, b];
  }
  const sinO = Math.sin(omega);
  const out: L.LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s1 = Math.sin((1 - t) * omega) / sinO;
    const s2 = Math.sin(t * omega) / sinO;
    out.push(
      fromXYZ({
        x: va.x * s1 + vb.x * s2,
        y: va.y * s1 + vb.y * s2,
        z: va.z * s1 + vb.z * s2,
      }),
    );
  }
  return out;
}

function stitchFlight(waypoints: L.LatLng[]): L.LatLng[] {
  const pts: L.LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const km = haversine(waypoints[i], waypoints[i + 1]);
    const steps = Math.max(24, Math.round(km / 18));
    const seg = greatCircle(waypoints[i], waypoints[i + 1], steps);
    if (i > 0) {
      seg.shift();
    }
    pts.push(...seg);
  }
  return pts;
}

function densifyRail(waypoints: L.LatLng[], everyKm: number): L.LatLng[] {
  const pts: L.LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const steps = Math.max(8, Math.round(haversine(a, b) / everyKm));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push(L.latLng(a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t));
    }
  }
  pts.push(waypoints[waypoints.length - 1]);
  return pts;
}

function cumulativeKm(path: L.LatLng[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    acc.push(acc[i - 1] + haversine(path[i - 1], path[i]));
  }
  return acc;
}

function sampleAlong(path: L.LatLng[], dist: number[], t: number): L.LatLng {
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

function slicePrefix(path: L.LatLng[], dist: number[], t: number): L.LatLng[] {
  const end = sampleAlong(path, dist, t);
  const target = Math.min(1, Math.max(0, t)) * dist[dist.length - 1];
  const out: L.LatLng[] = [L.latLng(path[0].lat, path[0].lng)];
  for (let i = 1; i < path.length; i++) {
    if (dist[i] >= target) {
      break;
    }
    out.push(L.latLng(path[i].lat, path[i].lng));
  }
  out.push(end);
  return out;
}

function bearingDeg(a: L.LatLng, b: L.LatLng): number {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function lerpAngle(from: number, to: number, k: number): number {
  const d = ((((to - from) % 360) + 540) % 360) - 180;
  return (((from + d * k) % 360) + 360) % 360;
}

function easeRoute(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

const CORRIDORS: Record<string, L.LatLng[]> = {
  'ala-ist': stitchFlight([ll('almaty'), pt(44.2, 68.4), pt(44.8, 59.5), pt(43.8, 49.2), pt(42.4, 38.8), ll('istanbul')]),
  'ist-mxp': stitchFlight([ll('istanbul'), pt(42.1, 22.8), pt(44.3, 15.6), ll('milan')]),
  'mxp-vce': densifyRail([ll('milan'), pt(45.54, 10.21), pt(45.44, 10.99), pt(45.41, 11.88), ll('venice')], 10),
  'vce-fco': densifyRail([ll('venice'), pt(44.49, 11.34), pt(43.77, 11.25), pt(42.75, 12.11), ll('rome')], 12),
  'fco-cdg': stitchFlight([ll('rome'), pt(44.4, 8.9), pt(46.2, 6.1), ll('paris')]),
  'cdg-bsl': densifyRail([ll('paris'), pt(48.3, 4.1), pt(47.32, 5.04), pt(47.64, 6.86), ll('basel')], 10),
  'bsl-zrh': densifyRail([ll('basel'), pt(47.48, 8.05), ll('zurich')], 6),
  'zrh-lbr': densifyRail([ll('zurich'), pt(47.05, 8.31), pt(46.69, 7.86), ll('lauterbrunnen')], 5),
  'lbr-zrh': densifyRail([ll('lauterbrunnen'), pt(46.69, 7.86), pt(47.05, 8.31), ll('zurich')], 5),
  'zrh-ist': stitchFlight([ll('zurich'), pt(45.7, 15.9), pt(43.4, 22.1), ll('istanbul')]),
  'ist-ala': stitchFlight([ll('istanbul'), pt(42.4, 38.8), pt(43.8, 49.2), pt(44.8, 59.5), pt(44.2, 68.4), ll('almaty')]),
};

const PLANE_SVG = `<svg class="ico-plane" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
const TRAIN_SVG = `<svg class="ico-train" viewBox="0 0 28 54" aria-hidden="true"><rect x="6" y="3" width="16" height="48" rx="8" fill="currentColor"/><rect x="9.5" y="9" width="9" height="6" rx="2" fill="#080D18"/><rect x="9.5" y="19" width="9" height="8" rx="1.5" fill="#080D18" opacity="0.72"/><rect x="9.5" y="31" width="9" height="8" rx="1.5" fill="#080D18" opacity="0.72"/></svg>`;

interface SegmentWindow {
  legIndex: number;
  startMs: number;
  moveEndMs: number;
  endMs: number;
}

function buildSchedule(): { windows: SegmentWindow[]; totalMs: number } {
  const windows: SegmentWindow[] = [];
  let cursor = OVERVIEW_MS;
  for (let i = 0; i < LEGS.length; i++) {
    const startMs = cursor;
    const moveEndMs = startMs + LEGS[i].ms;
    const endMs = moveEndMs + DWELL_MS;
    windows.push({ legIndex: i, startMs, moveEndMs, endMs });
    cursor = endMs;
  }
  return { windows, totalMs: cursor };
}

const SCHEDULE = buildSchedule();
const CHART_W = 600;
const CHART_H = 62;

@Component({
  selector: 'app-journey-map',
  templateUrl: './journey-map.html',
  styleUrl: './journey-map.scss',
})
export class JourneyMap {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);
  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('map');

  readonly legs = LEGS;
  readonly activeLegIndex = signal(0);
  readonly legProgress = signal(0);
  readonly playing = signal(false);
  readonly done = signal(false);
  readonly reducedMotion = signal(false);
  readonly inOverview = signal(true);

  readonly distanceKm = signal(0);
  readonly totalTraveledKm = signal(0);
  readonly altitudeM = signal(0);
  readonly speedKmh = signal(0);
  readonly elapsedLabel = signal('0m');
  readonly altPath = signal('');
  readonly altArea = signal('');
  readonly speedPath = signal('');

  readonly currentLeg = computed<Leg>(() => LEGS[this.activeLegIndex()] ?? LEGS[0]);
  readonly fromCity = computed<CityPoint>(() => cityOf(this.currentLeg().from));
  readonly toCity = computed<CityPoint>(() => cityOf(this.currentLeg().to));
  readonly legNumberLabel = computed(() => `${String(this.activeLegIndex() + 1).padStart(2, '0')} / ${LEGS.length}`);
  readonly progressPct = computed(() => Math.round(this.legProgress() * 100));

  readonly status = computed<PhaseStatus>(() => {
    const l = this.i18n.lang();
    if (this.inOverview()) {
      return { label: l === 'kk' ? 'БҮКІЛ МАРШРУТ' : 'ВЕСЬ МАРШРУТ', tone: 'ground' };
    }
    if (this.done() && !this.reducedMotion()) {
      return { label: l === 'kk' ? 'МАРШРУТ АЯҚТАЛДЫ' : 'МАРШРУТ ЗАВЕРШЁН', tone: 'arrived' };
    }
    const leg = this.currentLeg();
    if (this.reducedMotion()) {
      return {
        label:
          l === 'kk'
            ? leg.mode === 'plane'
              ? 'ӘУЕ РЕЙСІ'
              : leg.alpine
                ? 'АЛЬПІ 1 650 М'
                : 'ПОЙЫЗ'
            : leg.mode === 'plane'
              ? 'АВИАПЕРЕЛЁТ'
              : leg.alpine
                ? 'АЛЬПЫ 1 650 М'
                : 'ПОЕЗД',
        tone: leg.alpine ? 'alpine' : leg.mode === 'plane' ? 'air' : 'rail',
      };
    }
    return statusForPhase(this.legProgress(), leg.mode, !!leg.alpine, l);
  });

  private map?: L.Map;
  private vehicle?: L.Marker;
  private glowLines: L.Polyline[] = [];
  private coreLines: L.Polyline[] = [];
  private paths: L.LatLng[][] = [];
  private dists: number[][] = [];
  private cityMarks = new Map<string, L.Marker>();
  private raf = 0;
  private initRaf = 0;
  private elapsedMs = 0;
  private lastTs = 0;
  private started = false;
  private heading = 0;
  private snapHeading = true;
  private camKey = '';

  constructor() {
    effect(() => {
      const lang = this.i18n.lang();
      this.refreshPinLabels(lang);
    });

    afterNextRender(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.reducedMotion.set(reduced);
      this.buildMap();

      let io: IntersectionObserver | undefined;
      this.destroyRef.onDestroy(() => {
        io?.disconnect();
        cancelAnimationFrame(this.initRaf);
        cancelAnimationFrame(this.raf);
        this.map?.remove();
      });

      if (reduced) {
        this.renderStaticLeg(1);
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting) && !this.started) {
            this.started = true;
            this.map?.invalidateSize();
            this.replay();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(this.host.nativeElement);
    });
  }

  togglePlay(): void {
    if (this.reducedMotion()) {
      const next = (this.activeLegIndex() + 1) % LEGS.length;
      this.renderStaticLeg(next);
      return;
    }
    if (this.done()) {
      this.replay();
      return;
    }
    if (this.playing()) {
      cancelAnimationFrame(this.raf);
      this.playing.set(false);
      this.map?.dragging.enable();
      return;
    }
    this.playing.set(true);
    this.map?.dragging.disable();
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  replay(): void {
    cancelAnimationFrame(this.initRaf);
    cancelAnimationFrame(this.raf);
    this.done.set(false);
    this.inOverview.set(true);
    this.elapsedMs = 0;
    this.camKey = '';
    this.heading = 0;
    this.snapHeading = true;
    this.clearTrails();
    if (this.reducedMotion()) {
      this.renderStaticLeg(0);
      return;
    }
    this.playing.set(true);
    this.map?.dragging.disable();
    this.lastTs = performance.now();
    this.applyAt(0);
    this.raf = requestAnimationFrame(this.tick);
  }

  jumpToLeg(index: number): void {
    const safe = Math.max(0, Math.min(LEGS.length - 1, index));
    cancelAnimationFrame(this.initRaf);
    cancelAnimationFrame(this.raf);
    this.started = true;
    if (this.reducedMotion()) {
      this.renderStaticLeg(safe);
      return;
    }
    const win = SCHEDULE.windows[safe];
    this.done.set(false);
    this.inOverview.set(false);
    this.elapsedMs = win.startMs + 20;
    this.camKey = '';
    this.snapHeading = true;
    this.playing.set(true);
    this.map?.dragging.disable();
    this.lastTs = performance.now();
    this.applyAt(this.elapsedMs);
    this.raf = requestAnimationFrame(this.tick);
  }

  formatNum(val: number): string {
    return val.toLocaleString('ru-RU');
  }

  private buildMap(): void {
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
      zoomSnap: 0.25,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      worldCopyJump: false,
      maxBounds: L.latLngBounds(pt(24, -14), pt(66, 90)),
      maxBoundsViscosity: 0.8,
    });

    const tileOpts: L.TileLayerOptions = {
      maxZoom: 16,
      keepBuffer: 8,
      updateWhenZooming: false,
      updateWhenIdle: true,
    };

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { ...tileOpts, attribution: 'Tiles &copy; Esri' },
    ).addTo(map);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { ...tileOpts, opacity: 0.72 },
    ).addTo(map);

    this.paths = LEGS.map((leg) => CORRIDORS[leg.id] ?? stitchFlight([ll(leg.from), ll(leg.to)]));
    this.dists = this.paths.map(cumulativeKm);

    // Subtle full-route ghost preview lines
    this.paths.forEach((path, i) => {
      L.polyline(path, {
        color: LEGS[i].mode === 'plane' ? '#f43f5e' : '#c8a86b',
        weight: 1.4,
        opacity: 0.2,
        dashArray: LEGS[i].mode === 'plane' ? '4 6' : undefined,
        interactive: false,
      }).addTo(map);

      const isPlane = LEGS[i].mode === 'plane';
      const stroke = isPlane ? '#f43f5e' : '#e5c687';
      this.glowLines.push(
        L.polyline([], {
          color: stroke,
          weight: isPlane ? 8 : 7,
          opacity: 0.24,
          lineCap: 'round',
          lineJoin: 'round',
          smoothFactor: 0,
          interactive: false,
        }).addTo(map),
      );
      this.coreLines.push(
        L.polyline([], {
          color: stroke,
          weight: isPlane ? 2.8 : 3.2,
          opacity: 0.98,
          lineCap: 'round',
          lineJoin: 'round',
          smoothFactor: 0,
          interactive: false,
        }).addTo(map),
      );
    });

    const lang = this.i18n.lang();
    for (const c of CITIES) {
      const mark = L.marker(ll(c.id), {
        icon: L.divIcon({
          className: `pin pin--${c.id}${c.hub ? ' pin--hub' : ''}`,
          html: this.pinHtml(c, lang),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
        zIndexOffset: c.hub ? 100 : 250,
      }).addTo(map);
      this.cityMarks.set(c.id, mark);
    }

    this.vehicle = L.marker(ll('almaty'), {
      icon: L.divIcon({
        className: 'craft is-hidden',
        html: `<div class="craft-rot" data-kind="plane">${PLANE_SVG}${TRAIN_SVG}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
      interactive: false,
      zIndexOffset: 700,
    }).addTo(map);

    this.map = map;
    this.initRaf = requestAnimationFrame(() => {
      map.invalidateSize();
      if (this.started || this.done()) {
        return;
      }
      map.fitBounds(this.europeAndAlmatyBounds(), { padding: [32, 32], maxZoom: 4.1, animate: false });
      this.highlightCities(CITIES.filter((c) => !c.hub).map((c) => c.id), 'almaty', 'milan');
    });
  }

  private pinHtml(c: CityPoint, lang: 'kk' | 'ru'): string {
    const label = c.hub ? (lang === 'kk' ? 'ауысу' : 'стыковка') : c.name[lang].split(' · ')[0];
    return `<span class="pin-dot"></span><span class="pin-tag"><b>${c.code}</b><i>${label}</i></span>`;
  }

  private refreshPinLabels(lang: 'kk' | 'ru'): void {
    this.cityMarks.forEach((mark, id) => {
      const root = mark.getElement();
      const labelEl = root?.querySelector('.pin-tag i');
      const city = CITY_MAP.get(id);
      if (labelEl && city) {
        labelEl.textContent = city.hub
          ? lang === 'kk'
            ? 'ауысу'
            : 'стыковка'
          : city.name[lang].split(' · ')[0];
      }
    });
  }

  private europeAndAlmatyBounds(): L.LatLngBounds {
    return L.latLngBounds(CITIES.map((c) => ll(c.id))).pad(0.14);
  }

  private flyOnce(key: string, fn: () => void): void {
    if (this.camKey === key || !this.map) {
      return;
    }
    this.camKey = key;
    fn();
  }

  private tick = (now: number) => {
    const dt = Math.min(64, Math.max(0, now - this.lastTs));
    this.lastTs = now;
    this.elapsedMs = Math.min(SCHEDULE.totalMs, this.elapsedMs + dt);
    this.applyAt(this.elapsedMs);

    if (this.elapsedMs >= SCHEDULE.totalMs) {
      this.playing.set(false);
      this.done.set(true);
      this.inOverview.set(false);
      this.paintFullRoute();
      this.setCraftVisible(false);
      this.map?.dragging.enable();
      this.flyOnce('end', () => {
        this.map?.flyToBounds(this.europeAndAlmatyBounds(), {
          padding: [34, 34],
          maxZoom: 4.1,
          duration: 1.4,
          easeLinearity: 0.25,
        });
      });
      return;
    }

    this.raf = requestAnimationFrame(this.tick);
  };

  private applyAt(ms: number): void {
    if (!this.map || !this.vehicle) {
      return;
    }

    if (ms < OVERVIEW_MS) {
      this.inOverview.set(true);
      this.activeLegIndex.set(0);
      this.legProgress.set(0);
      this.distanceKm.set(0);
      this.totalTraveledKm.set(0);
      this.altitudeM.set(LEGS[0].startElevM);
      this.speedKmh.set(0);
      this.elapsedLabel.set('0m');
      this.updateChart(LEGS[0], 0);
      this.setCraftVisible(false);
      this.highlightCities(CITIES.filter((c) => !c.hub).map((c) => c.id), 'almaty', 'milan');
      this.flyOnce('overview', () => {
        const bounds = this.europeAndAlmatyBounds();
        const fitZ = Math.min(4.1, Math.max(2.0, this.map!.getBoundsZoom(bounds, false, L.point(32, 32))));
        this.map?.setView(bounds.getCenter(), fitZ, { animate: false });
      });
      return;
    }

    this.inOverview.set(false);

    let win = SCHEDULE.windows[SCHEDULE.windows.length - 1];
    for (const w of SCHEDULE.windows) {
      if (ms <= w.endMs) {
        win = w;
        break;
      }
    }

    const legIdx = win.legIndex;
    const leg = LEGS[legIdx];
    const rawT = ms >= win.moveEndMs ? 1 : Math.min(1, Math.max(0, (ms - win.startMs) / leg.ms));
    const t = easeRoute(rawT);

    this.activeLegIndex.set(legIdx);
    this.legProgress.set(t);

    const path = this.paths[legIdx];
    const dist = this.dists[legIdx];
    const pos = sampleAlong(path, dist, t);
    const nextPos = sampleAlong(path, dist, Math.min(1, t + 0.015));

    const prevTotal = LEGS.slice(0, legIdx).reduce((sum, item) => sum + item.distanceKm, 0);
    const legKm = Math.round(leg.distanceKm * t);
    this.distanceKm.set(legKm);
    this.totalTraveledKm.set(prevTotal + legKm);

    const alt =
      leg.mode === 'plane'
        ? flightAltitude(t, leg.maxAltitudeM)
        : railElevation(t, leg.startElevM, leg.peakElevM, leg.endElevM);
    const spd = craftSpeed(t, leg.maxSpeedKmh);
    this.altitudeM.set(alt);
    this.speedKmh.set(spd);
    this.elapsedLabel.set(formatDuration(leg.durationMin * t));
    this.updateChart(leg, t);

    this.paintTrails(legIdx, slicePrefix(path, dist, t));

    const moving = ms < win.moveEndMs && t > 0.005 && t < 0.995;
    this.vehicle.setLatLng(pos);
    this.setCraftVisible(moving);
    if (moving) {
      this.setCraftVisual(leg.mode, bearingDeg(pos, nextPos));
    }

    const visible = this.visibleCitiesFor(legIdx);
    this.highlightCities(visible, leg.from, leg.to);

    // 3-phase F1 Jet Tracker hardware-accelerated keyframes (preserves tiles smoothly without abort thrashing)
    const depZoom = cameraZoomForPhase(0, leg.mode === 'plane', leg.overviewZoom);
    const arrZoom = cameraZoomForPhase(1, leg.mode === 'plane', leg.overviewZoom);

    if (t < 0.14) {
      this.flyOnce(`dep-${legIdx}`, () => {
        this.map?.flyTo(ll(leg.from), Math.min(7.5, depZoom), {
          duration: 0.75,
          easeLinearity: 0.35,
        });
      });
    } else if (t < 0.82) {
      this.flyOnce(`cruise-${legIdx}`, () => {
        this.map?.flyToBounds(L.latLngBounds(path).pad(0.22), {
          padding: [44, 44],
          maxZoom: leg.overviewZoom,
          duration: 1.15,
          easeLinearity: 0.25,
        });
      });
    } else {
      this.flyOnce(`arr-${legIdx}`, () => {
        this.map?.flyTo(ll(leg.to), Math.min(7.75, arrZoom), {
          duration: 0.85,
          easeLinearity: 0.35,
        });
      });
    }
  }

  private renderStaticLeg(legIdx: number): void {
    cancelAnimationFrame(this.initRaf);
    const leg = LEGS[legIdx];
    this.inOverview.set(false);
    this.activeLegIndex.set(legIdx);
    this.legProgress.set(1);
    this.playing.set(false);
    this.done.set(true);
    const prevTotal = LEGS.slice(0, legIdx + 1).reduce((s, l) => s + l.distanceKm, 0);
    this.distanceKm.set(leg.distanceKm);
    this.totalTraveledKm.set(prevTotal);
    this.altitudeM.set(leg.mode === 'plane' ? leg.maxAltitudeM : leg.endElevM);
    this.speedKmh.set(leg.maxSpeedKmh);
    this.elapsedLabel.set(formatDuration(leg.durationMin));
    this.updateChart(leg, 1);
    this.paintFullRoute();
    this.setCraftVisible(false);
    this.highlightCities(CITIES.map((c) => c.id), leg.from, leg.to);
    this.map?.dragging.enable();
    const bounds = L.latLngBounds(this.paths[legIdx]).pad(0.24);
    this.map?.fitBounds(bounds, { padding: [44, 44], maxZoom: leg.overviewZoom + 0.5, animate: false });
  }

  private updateChart(leg: Leg, t: number): void {
    const totalSamples = 42;
    const count = Math.max(2, Math.round(totalSamples * Math.max(0.02, t)));
    const samples: TelemetrySample[] = [];
    for (let i = 0; i < count; i++) {
      const f = i / (totalSamples - 1);
      const alt =
        leg.mode === 'plane'
          ? flightAltitude(f, leg.maxAltitudeM)
          : railElevation(f, leg.startElevM, leg.peakElevM, leg.endElevM);
      samples.push({ alt, speed: craftSpeed(f, leg.maxSpeedKmh) });
    }
    const maxAlt = Math.max(leg.maxAltitudeM, leg.startElevM, leg.endElevM, 500);
    const built = buildTelemetryPaths(samples, maxAlt, Math.max(100, leg.maxSpeedKmh), CHART_W, CHART_H);
    this.altPath.set(built.altLine);
    this.altArea.set(built.altArea);
    this.speedPath.set(built.speedLine);
  }

  private visibleCitiesFor(legIdx: number): string[] {
    if (legIdx <= 1 || legIdx >= 9) {
      const leg = LEGS[legIdx];
      return ['almaty', 'istanbul', 'milan', 'zurich', leg.from, leg.to];
    }
    return ['milan', 'venice', 'rome', 'paris', 'basel', 'zurich', 'lauterbrunnen'];
  }

  private clearTrails(): void {
    this.glowLines.forEach((l) => l.setLatLngs([]));
    this.coreLines.forEach((l) => l.setLatLngs([]));
  }

  private paintFullRoute(): void {
    this.paths.forEach((p, i) => {
      this.glowLines[i]?.setLatLngs(p);
      this.coreLines[i]?.setLatLngs(p);
      this.coreLines[i]?.setStyle({ opacity: 0.9 });
    });
  }

  private paintTrails(activeIndex: number, currentSlice: L.LatLng[]): void {
    const returning = activeIndex >= 9;
    this.paths.forEach((p, i) => {
      if (i < activeIndex) {
        this.glowLines[i].setLatLngs(p);
        this.coreLines[i].setLatLngs(p);
        const dim = returning && i < 9 ? 0.28 : 0.54;
        this.coreLines[i].setStyle({ opacity: dim });
        this.glowLines[i].setStyle({ opacity: dim * 0.25 });
      } else if (i === activeIndex) {
        this.glowLines[i].setLatLngs(currentSlice);
        this.coreLines[i].setLatLngs(currentSlice);
        this.coreLines[i].setStyle({ opacity: 1 });
        this.glowLines[i].setStyle({ opacity: 0.3 });
      } else {
        this.glowLines[i].setLatLngs([]);
        this.coreLines[i].setLatLngs([]);
      }
    });
  }

  private highlightCities(visible: string[], fromId: string, toId: string): void {
    this.cityMarks.forEach((mark, key) => {
      const el = mark.getElement();
      if (!el) {
        return;
      }
      el.classList.toggle('is-on', visible.includes(key));
      el.classList.toggle('is-active', key === fromId || key === toId);
    });
  }

  private setCraftVisible(on: boolean): void {
    this.vehicle?.getElement()?.classList.toggle('is-hidden', !on);
  }

  private setCraftVisual(kind: 'plane' | 'train', angle: number): void {
    const rot = this.vehicle?.getElement()?.querySelector('.craft-rot') as HTMLElement | null;
    if (!rot) {
      return;
    }
    if (this.snapHeading) {
      this.heading = angle;
      this.snapHeading = false;
    } else {
      this.heading = lerpAngle(this.heading, angle, kind === 'train' ? 0.3 : 0.16);
    }
    rot.dataset['kind'] = kind;
    rot.style.transform = `rotate(${this.heading}deg)`;
  }
}
