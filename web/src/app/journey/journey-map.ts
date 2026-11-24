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

interface LonLat {
  lon: number;
  lat: number;
}

interface VectorWorld {
  countries: [number, number][][];
  lakes: [number, number][][];
}

interface MercRing {
  xs: Float32Array;
  ys: Float32Array;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const CITY_MAP = new Map<string, CityPoint>(CITIES.map((c) => [c.id, c]));

const COUNTRY_MARKS: Array<{ name: string; lon: number; lat: number; minZoom: number }> = [
  { name: 'ITALY', lon: 12.6, lat: 43.1, minZoom: 3.4 },
  { name: 'FRANCE', lon: 2.4, lat: 46.7, minZoom: 3.4 },
  { name: 'SWITZERLAND', lon: 8.2, lat: 46.85, minZoom: 4.5 },
  { name: 'GERMANY', lon: 10.4, lat: 50.8, minZoom: 3.6 },
  { name: 'AUSTRIA', lon: 14.3, lat: 47.6, minZoom: 4.4 },
  { name: 'SPAIN', lon: -3.2, lat: 40.4, minZoom: 3.4 },
  { name: 'TURKEY', lon: 34.5, lat: 39.2, minZoom: 2.8 },
  { name: 'KAZAKHSTAN', lon: 65.5, lat: 47.6, minZoom: 2.2 },
  { name: 'GREECE', lon: 22.4, lat: 39.4, minZoom: 3.8 },
  { name: 'CROATIA', lon: 15.8, lat: 44.8, minZoom: 4.8 },
  { name: 'UK', lon: -1.8, lat: 52.8, minZoom: 3.6 },
];

const RADAR_WAYPOINTS: Array<{ code: string; name: string; lon: number; lat: number; minZoom: number }> = [
  { code: 'LSGG', name: 'Geneva', lon: 6.11, lat: 46.24, minZoom: 5.5 },
  { code: 'LSZB', name: 'Bern', lon: 7.5, lat: 46.91, minZoom: 6.1 },
  { code: 'EDDM', name: 'Munich', lon: 11.79, lat: 48.35, minZoom: 5.2 },
  { code: 'LOWI', name: 'Innsbruck', lon: 11.34, lat: 47.26, minZoom: 5.8 },
  { code: 'LIRQ', name: 'Florence', lon: 11.2, lat: 43.81, minZoom: 5.4 },
  { code: 'LIPE', name: 'Bologna', lon: 11.29, lat: 44.53, minZoom: 5.8 },
  { code: 'LIMF', name: 'Turin', lon: 7.65, lat: 45.2, minZoom: 5.6 },
  { code: 'LFMN', name: 'Nice', lon: 7.21, lat: 43.66, minZoom: 5.3 },
  { code: 'LFLL', name: 'Lyon', lon: 5.09, lat: 45.73, minZoom: 5.2 },
  { code: 'LFST', name: 'Strasbourg', lon: 7.63, lat: 48.54, minZoom: 5.6 },
  { code: 'UBBB', name: 'Baku', lon: 50.05, lat: 40.47, minZoom: 3.6 },
  { code: 'UTTT', name: 'Tashkent', lon: 69.28, lat: 41.26, minZoom: 3.6 },
  { code: 'UACC', name: 'Astana', lon: 71.47, lat: 51.02, minZoom: 3.4 },
];

const DWELL_MS = 950;
const OVERVIEW_MS = 1700;
const CHART_W = 600;
const CHART_H = 62;

function mercX(lon: number): number {
  return (lon + 180) / 360;
}

function mercY(lat: number): number {
  const rad = (Math.max(-82, Math.min(82, lat)) * Math.PI) / 180;
  return 0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI);
}

function invMercLon(mx: number): number {
  return mx * 360 - 180;
}

function invMercLat(my: number): number {
  const n = Math.PI - 2 * Math.PI * my;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function precomputeRings(polys: [number, number][][]): MercRing[] {
  const out: MercRing[] = [];
  for (const ring of polys) {
    const n = ring.length;
    if (n < 3) {
      continue;
    }
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    for (let i = 0; i < n; i++) {
      const x = mercX(ring[i][0]);
      const y = mercY(ring[i][1]);
      xs[i] = x;
      ys[i] = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    out.push({ xs, ys, minX, maxX, minY, maxY });
  }
  return out;
}

function cityOf(id: string): CityPoint {
  return CITY_MAP.get(id)!;
}

function ll(id: string): LonLat {
  const c = cityOf(id);
  return { lon: c.lon, lat: c.lat };
}

function pt(lat: number, lon: number): LonLat {
  return { lon, lat };
}

function haversine(a: LonLat, b: LonLat): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function toXYZ(lat: number, lon: number) {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;
  return { x: Math.cos(phi) * Math.cos(lam), y: Math.cos(phi) * Math.sin(lam), z: Math.sin(phi) };
}

function fromXYZ(v: { x: number; y: number; z: number }): LonLat {
  return {
    lat: (Math.atan2(v.z, Math.hypot(v.x, v.y)) * 180) / Math.PI,
    lon: (Math.atan2(v.y, v.x) * 180) / Math.PI,
  };
}

function greatCircle(a: LonLat, b: LonLat, steps: number): LonLat[] {
  const va = toXYZ(a.lat, a.lon);
  const vb = toXYZ(b.lat, b.lon);
  const dot = Math.min(1, Math.max(-1, va.x * vb.x + va.y * vb.y + va.z * vb.z));
  const omega = Math.acos(dot);
  if (omega < 1e-6 || steps < 2) {
    return [a, b];
  }
  const sinO = Math.sin(omega);
  const out: LonLat[] = [];
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

function stitchFlight(waypoints: LonLat[]): LonLat[] {
  const pts: LonLat[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const km = haversine(waypoints[i], waypoints[i + 1]);
    const steps = Math.max(24, Math.round(km / 20));
    const seg = greatCircle(waypoints[i], waypoints[i + 1], steps);
    if (i > 0) {
      seg.shift();
    }
    pts.push(...seg);
  }
  return pts;
}

function densifyRail(waypoints: LonLat[], everyKm: number): LonLat[] {
  const pts: LonLat[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const steps = Math.max(10, Math.round(haversine(a, b) / everyKm));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push({ lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t });
    }
  }
  pts.push(waypoints[waypoints.length - 1]);
  return pts;
}

function cumulativeKm(path: LonLat[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    acc.push(acc[i - 1] + haversine(path[i - 1], path[i]));
  }
  return acc;
}

function sampleAlong(path: LonLat[], dist: number[], t: number): LonLat {
  const target = Math.min(1, Math.max(0, t)) * dist[dist.length - 1];
  let i = 1;
  while (i < dist.length && dist[i] < target) {
    i++;
  }
  const a = path[i - 1];
  const b = path[Math.min(path.length - 1, i)];
  const span = dist[i] - dist[i - 1] || 1;
  const f = (target - dist[i - 1]) / span;
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

function slicePrefix(path: LonLat[], dist: number[], t: number): LonLat[] {
  const end = sampleAlong(path, dist, t);
  const target = Math.min(1, Math.max(0, t)) * dist[dist.length - 1];
  const out: LonLat[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    if (dist[i] >= target) {
      break;
    }
    out.push(path[i]);
  }
  out.push(end);
  return out;
}

function easeRoute(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function lerpAngleRad(from: number, to: number, k: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * k;
}

const CORRIDORS: Record<string, LonLat[]> = {
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
let cachedWorldPromise: Promise<{ countries: MercRing[]; lakes: MercRing[] }> | null = null;

function loadVectorWorld(): Promise<{ countries: MercRing[]; lakes: MercRing[] }> {
  if (!cachedWorldPromise) {
    cachedWorldPromise = fetch('/data/eurasia-map.json')
      .then((r) => (r.ok ? (r.json() as Promise<VectorWorld>) : { countries: [], lakes: [] }))
      .then((data) => ({
        countries: precomputeRings(data.countries ?? []),
        lakes: precomputeRings(data.lakes ?? []),
      }))
      .catch(() => ({ countries: [], lakes: [] }));
  }
  return cachedWorldPromise;
}

@Component({
  selector: 'app-journey-map',
  templateUrl: './journey-map.html',
  styleUrl: './journey-map.scss',
})
export class JourneyMap {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>('viewport');

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

  private countries: MercRing[] = [];
  private lakes: MercRing[] = [];
  private paths: LonLat[][] = [];
  private dists: number[][] = [];

  private raf = 0;
  private elapsedMs = 0;
  private lastTs = 0;
  private pulseClock = 0;
  private started = false;
  private headingRad = 0;
  private snapHeading = true;

  // Smooth spring camera state in Web Mercator coordinates + zoom
  private camMx = mercX(32);
  private camMy = mercY(45.5);
  private camZoom = 3.4;
  private targetMx = mercX(32);
  private targetMy = mercY(45.5);
  private targetZoom = 3.4;
  private camInit = false;

  // Interactive pan state when paused or finished
  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragBaseMx = 0;
  private dragBaseMy = 0;

  private cssW = 900;
  private cssH = 440;
  private dpr = 1;
  private craftPos: LonLat | null = null;
  private craftMode: 'plane' | 'train' = 'plane';
  private activeSlice: LonLat[] = [];
  private activeIdx = 0;

  constructor() {
    this.paths = LEGS.map((leg) => CORRIDORS[leg.id] ?? stitchFlight([ll(leg.from), ll(leg.to)]));
    this.dists = this.paths.map(cumulativeKm);

    // Preload vector Eurasia geometry immediately (before scrolling into view!)
    if (typeof window !== 'undefined') {
      void loadVectorWorld().then((w) => {
        this.countries = w.countries;
        this.lakes = w.lakes;
        this.draw();
      });
    }

    effect(() => {
      this.i18n.lang();
      this.draw();
    });

    afterNextRender(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.reducedMotion.set(reduced);
      this.resizeCanvas();

      const ro = new ResizeObserver(() => {
        this.resizeCanvas();
        if (!this.playing()) {
          this.draw();
        }
      });
      const vp = this.viewportRef()?.nativeElement;
      if (vp) {
        ro.observe(vp);
      }

      let io: IntersectionObserver | undefined;
      this.destroyRef.onDestroy(() => {
        io?.disconnect();
        ro.disconnect();
        cancelAnimationFrame(this.raf);
      });

      this.fitOverviewImmediate();
      this.draw();

      if (reduced) {
        this.renderStaticLeg(1);
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting) && !this.started) {
            this.started = true;
            this.replay();
          }
        },
        { threshold: 0.2 },
      );
      io.observe(this.host.nativeElement);
    });
  }

  countryIso(cityId: string): string {
    switch (cityId) {
      case 'almaty':
        return 'kz';
      case 'istanbul':
        return 'tr';
      case 'milan':
      case 'venice':
      case 'rome':
        return 'it';
      case 'paris':
        return 'fr';
      default:
        return 'ch';
    }
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
      this.draw();
      return;
    }
    this.playing.set(true);
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  replay(): void {
    cancelAnimationFrame(this.raf);
    this.done.set(false);
    this.inOverview.set(true);
    this.elapsedMs = 0;
    this.snapHeading = true;
    this.camInit = false;
    this.craftPos = null;
    this.activeSlice = [];
    this.activeIdx = 0;
    if (this.reducedMotion()) {
      this.renderStaticLeg(0);
      return;
    }
    this.playing.set(true);
    this.lastTs = performance.now();
    this.applyAt(0, 16);
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  }

  jumpToLeg(index: number): void {
    const safe = Math.max(0, Math.min(LEGS.length - 1, index));
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
    this.snapHeading = true;
    this.playing.set(true);
    this.lastTs = performance.now();
    this.applyAt(this.elapsedMs, 16);
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  }

  nudgeZoom(delta: number): void {
    if (this.playing()) {
      cancelAnimationFrame(this.raf);
      this.playing.set(false);
    }
    this.camZoom = Math.max(2.0, Math.min(9.5, this.camZoom + delta));
    this.targetZoom = this.camZoom;
    this.draw();
  }

  onPointerDown(e: PointerEvent): void {
    if (this.playing()) {
      return;
    }
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragBaseMx = this.camMx;
    this.dragBaseMy = this.camMy;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const worldPx = 256 * Math.pow(2, this.camZoom);
    const dx = (e.clientX - this.dragStartX) / worldPx;
    const dy = (e.clientY - this.dragStartY) / worldPx;
    this.camMx = Math.max(mercX(-16), Math.min(mercX(90), this.dragBaseMx - dx));
    this.camMy = Math.max(mercY(65), Math.min(mercY(27), this.dragBaseMy - dy));
    this.targetMx = this.camMx;
    this.targetMy = this.camMy;
    this.draw();
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  formatNum(val: number): string {
    return val.toLocaleString('ru-RU');
  }

  private resizeCanvas(): void {
    const vp = this.viewportRef()?.nativeElement;
    const cv = this.canvasRef()?.nativeElement;
    if (!vp || !cv) {
      return;
    }
    const rect = vp.getBoundingClientRect();
    this.cssW = Math.max(300, Math.round(rect.width));
    this.cssH = Math.max(280, Math.round(rect.height));
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    cv.width = Math.round(this.cssW * this.dpr);
    cv.height = Math.round(this.cssH * this.dpr);
  }

  private fitBoundsCamera(points: LonLat[], padFrac = 0.22, maxZoom = 7.4): { mx: number; my: number; zoom: number } {
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    for (const p of points) {
      const x = mercX(p.lon);
      const y = mercY(p.lat);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const spanX = Math.max(0.002, maxX - minX);
    const spanY = Math.max(0.002, maxY - minY);
    const usableW = Math.max(120, this.cssW * (1 - padFrac * 2));
    const usableH = Math.max(120, this.cssH * (1 - padFrac * 2));
    const zoomX = Math.log2(usableW / (256 * spanX));
    const zoomY = Math.log2(usableH / (256 * spanY));
    const zoom = Math.max(1.9, Math.min(maxZoom, Math.min(zoomX, zoomY)));
    return { mx: (minX + maxX) / 2, my: (minY + maxY) / 2, zoom };
  }

  private fitOverviewImmediate(): void {
    const fit = this.fitBoundsCamera(
      CITIES.map((c) => ({ lon: c.lon, lat: c.lat })),
      0.14,
      4.4,
    );
    this.camMx = fit.mx;
    this.camMy = fit.my;
    this.camZoom = fit.zoom;
    this.targetMx = fit.mx;
    this.targetMy = fit.my;
    this.targetZoom = fit.zoom;
    this.camInit = true;
  }

  private tick = (now: number) => {
    const dt = Math.min(64, Math.max(1, now - this.lastTs));
    this.lastTs = now;
    this.pulseClock = now * 0.0032;
    this.elapsedMs = Math.min(SCHEDULE.totalMs, this.elapsedMs + dt);
    this.applyAt(this.elapsedMs, dt);
    this.draw();

    if (this.elapsedMs >= SCHEDULE.totalMs) {
      this.playing.set(false);
      this.done.set(true);
      this.inOverview.set(false);
      this.craftPos = null;
      this.activeIdx = LEGS.length;
      const fit = this.fitBoundsCamera(
        CITIES.map((c) => ({ lon: c.lon, lat: c.lat })),
        0.14,
        4.4,
      );
      this.camMx = fit.mx;
      this.camMy = fit.my;
      this.camZoom = fit.zoom;
      this.draw();
      return;
    }

    this.raf = requestAnimationFrame(this.tick);
  };

  private applyAt(ms: number, dt: number): void {
    const smooth = 1 - Math.exp(-dt * 0.0068);

    if (ms < OVERVIEW_MS) {
      this.inOverview.set(true);
      this.activeLegIndex.set(0);
      this.activeIdx = -1;
      this.legProgress.set(0);
      this.distanceKm.set(0);
      this.totalTraveledKm.set(0);
      this.altitudeM.set(LEGS[0].startElevM);
      this.speedKmh.set(0);
      this.elapsedLabel.set('0m');
      this.updateChart(LEGS[0], 0);
      this.craftPos = null;
      this.activeSlice = [];

      const fit = this.fitBoundsCamera(
        CITIES.map((c) => ({ lon: c.lon, lat: c.lat })),
        0.14,
        4.4,
      );
      this.stepCamera(fit.mx, fit.my, fit.zoom, smooth);
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
    this.activeIdx = legIdx;
    this.legProgress.set(t);

    const path = this.paths[legIdx];
    const dist = this.dists[legIdx];
    const pos = sampleAlong(path, dist, t);
    const nextPos = sampleAlong(path, dist, Math.min(1, t + 0.016));

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

    this.activeSlice = slicePrefix(path, dist, t);
    const moving = ms < win.moveEndMs && t > 0.005 && t < 0.995;
    this.craftPos = moving ? pos : null;
    this.craftMode = leg.mode;

    if (moving) {
      const dx = mercX(nextPos.lon) - mercX(pos.lon);
      const dy = mercY(nextPos.lat) - mercY(pos.lat);
      const angle = Math.atan2(dy, dx);
      if (this.snapHeading) {
        this.headingRad = angle;
        this.snapHeading = false;
      } else {
        this.headingRad = lerpAngleRad(this.headingRad, angle, leg.mode === 'train' ? 0.28 : 0.16);
      }
    }

    // 60fps F1 Jet Tracker continuous dynamic zoom & framing
    const legFit = this.fitBoundsCamera(path, 0.2, leg.overviewZoom + 0.35);
    const targetZ = cameraZoomForPhase(t, leg.mode === 'plane', legFit.zoom);
    const cruiseBlend = Math.sin(Math.PI * t);
    const posMx = mercX(pos.lon);
    const posMy = mercY(pos.lat);
    const aimMx = posMx * (1 - 0.36 * cruiseBlend) + legFit.mx * (0.36 * cruiseBlend);
    const aimMy = posMy * (1 - 0.36 * cruiseBlend) + legFit.my * (0.36 * cruiseBlend);
    this.stepCamera(aimMx, aimMy, targetZ, smooth);
  }

  private stepCamera(mx: number, my: number, zoom: number, factor: number): void {
    this.targetMx = mx;
    this.targetMy = my;
    this.targetZoom = zoom;
    if (!this.camInit) {
      this.camMx = mx;
      this.camMy = my;
      this.camZoom = zoom;
      this.camInit = true;
    } else {
      this.camMx += (mx - this.camMx) * factor;
      this.camMy += (my - this.camMy) * factor;
      this.camZoom += (zoom - this.camZoom) * factor;
    }
  }

  private renderStaticLeg(legIdx: number): void {
    const leg = LEGS[legIdx];
    this.inOverview.set(false);
    this.activeLegIndex.set(legIdx);
    this.activeIdx = LEGS.length;
    this.legProgress.set(1);
    this.playing.set(false);
    this.done.set(true);
    this.craftPos = null;
    this.activeSlice = this.paths[legIdx];

    const prevTotal = LEGS.slice(0, legIdx + 1).reduce((s, l) => s + l.distanceKm, 0);
    this.distanceKm.set(leg.distanceKm);
    this.totalTraveledKm.set(prevTotal);
    this.altitudeM.set(leg.mode === 'plane' ? leg.maxAltitudeM : leg.endElevM);
    this.speedKmh.set(leg.maxSpeedKmh);
    this.elapsedLabel.set(formatDuration(leg.durationMin));
    this.updateChart(leg, 1);

    const fit = this.fitBoundsCamera(this.paths[legIdx], 0.22, leg.overviewZoom + 0.4);
    this.camMx = fit.mx;
    this.camMy = fit.my;
    this.camZoom = fit.zoom;
    this.camInit = true;
    this.draw();
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

  private draw(): void {
    const cv = this.canvasRef()?.nativeElement;
    if (!cv) {
      return;
    }
    const ctx = cv.getContext('2d');
    if (!ctx) {
      return;
    }

    const w = this.cssW;
    const h = this.cssH;
    const dpr = this.dpr;
    const worldPx = 256 * Math.pow(2, this.camZoom);
    const cx = w * 0.5;
    const cy = h * 0.5;

    const toSX = (mx: number) => cx + (mx - this.camMx) * worldPx;
    const toSY = (my: number) => cy + (my - this.camMy) * worldPx;
    const proj = (p: LonLat) => [toSX(mercX(p.lon)), toSY(mercY(p.lat))] as const;

    // Visible Mercator bounds for fast polygon culling
    const viewMinX = this.camMx - (cx + 40) / worldPx;
    const viewMaxX = this.camMx + (cx + 40) / worldPx;
    const viewMinY = this.camMy - (cy + 40) / worldPx;
    const viewMaxY = this.camMy + (cy + 40) / worldPx;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Deep midnight ocean canvas
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.85, 20, cx, cy, Math.max(w, h) * 0.78);
    bgGrad.addColorStop(0, '#101827');
    bgGrad.addColorStop(1, '#090e18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle aviation lat/lon graticule
    const stepDeg = this.camZoom >= 6.2 ? 2 : this.camZoom >= 4.6 ? 5 : 10;
    const minLon = Math.floor(invMercLon(viewMinX) / stepDeg) * stepDeg;
    const maxLon = Math.ceil(invMercLon(viewMaxX) / stepDeg) * stepDeg;
    const minLat = Math.floor(invMercLat(viewMaxY) / stepDeg) * stepDeg;
    const maxLat = Math.ceil(invMercLat(viewMinY) / stepDeg) * stepDeg;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let lon = minLon; lon <= maxLon; lon += stepDeg) {
      const sx = toSX(mercX(lon));
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let lat = Math.max(20, minLat); lat <= Math.min(70, maxLat); lat += stepDeg) {
      const sy = toSY(mercY(lat));
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // 3. Vector landmass polygons & country borders (Natural Earth 50m)
    if (this.countries.length) {
      ctx.fillStyle = '#1e2636';
      ctx.strokeStyle = '#384661';
      ctx.lineWidth = this.camZoom >= 5.5 ? 1.15 : 0.9;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (const ring of this.countries) {
        if (ring.maxX < viewMinX || ring.minX > viewMaxX || ring.maxY < viewMinY || ring.minY > viewMaxY) {
          continue;
        }
        const xs = ring.xs;
        const ys = ring.ys;
        ctx.moveTo(toSX(xs[0]), toSY(ys[0]));
        for (let i = 1; i < xs.length; i++) {
          ctx.lineTo(toSX(xs[i]), toSY(ys[i]));
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }

    // 4. Natural Earth Lakes (Swiss lakes, Caspian cutouts, Balkhash, etc.)
    if (this.lakes.length) {
      ctx.fillStyle = '#0c1322';
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.32)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (const ring of this.lakes) {
        if (ring.maxX < viewMinX || ring.minX > viewMaxX || ring.maxY < viewMinY || ring.minY > viewMaxY) {
          continue;
        }
        const xs = ring.xs;
        const ys = ring.ys;
        ctx.moveTo(toSX(xs[0]), toSY(ys[0]));
        for (let i = 1; i < xs.length; i++) {
          ctx.lineTo(toSX(xs[i]), toSY(ys[i]));
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
    }

    // 5. Subtle Alpine relief highlight in the Swiss Alps region
    const [alpsX, alpsY] = proj({ lon: 8.15, lat: 46.55 });
    const alpsR = Math.max(24, worldPx * 0.0052);
    if (alpsX > -alpsR && alpsX < w + alpsR && alpsY > -alpsR && alpsY < h + alpsR) {
      const aGrad = ctx.createRadialGradient(alpsX, alpsY, 2, alpsX, alpsY, alpsR);
      aGrad.addColorStop(0, 'rgba(200, 168, 107, 0.14)');
      aGrad.addColorStop(1, 'rgba(200, 168, 107, 0)');
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(alpsX, alpsY, alpsR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Subtle Country Watermarks
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 10.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.34)';
    for (const c of COUNTRY_MARKS) {
      if (this.camZoom < c.minZoom) continue;
      const [x, y] = proj(c);
      if (x < -40 || x > w + 40 || y < -20 || y > h + 20) continue;
      ctx.fillText(c.name.split('').join(' '), x, y);
    }

    // 7. F1-style secondary aviation radar waypoints (visible as camera zooms in)
    ctx.textAlign = 'left';
    ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    for (const wp of RADAR_WAYPOINTS) {
      if (this.camZoom < wp.minZoom) continue;
      const [x, y] = proj(wp);
      if (x < 12 || x > w - 60 || y < 12 || y > h - 12) continue;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.46)';
      ctx.fillText(`${wp.code} ${wp.name}`, x + 6, y);
    }

    // 8. Route Polylines (Ghost preview + Traveled history + Luminous active leg)
    const strokePath = (pts: LonLat[]) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      const [sx, sy] = proj(pts[0]);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = proj(pts[i]);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    // Ghost preview of full Eurotour
    for (let i = 0; i < this.paths.length; i++) {
      const isPlane = LEGS[i].mode === 'plane';
      ctx.save();
      ctx.strokeStyle = isPlane ? 'rgba(244, 63, 94, 0.18)' : 'rgba(229, 198, 135, 0.22)';
      ctx.lineWidth = 1.3;
      if (isPlane) ctx.setLineDash([4, 6]);
      strokePath(this.paths[i]);
      ctx.restore();
    }

    // Traveled legs
    const returning = this.activeIdx >= 9;
    for (let i = 0; i < this.paths.length; i++) {
      if (i >= this.activeIdx) continue;
      const isPlane = LEGS[i].mode === 'plane';
      const alpha = this.activeIdx >= LEGS.length ? 0.86 : returning && i < 9 ? 0.3 : 0.62;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isPlane ? `rgba(244, 63, 94, ${alpha * 0.28})` : `rgba(229, 198, 135, ${alpha * 0.28})`;
      ctx.lineWidth = 6.5;
      strokePath(this.paths[i]);
      ctx.strokeStyle = isPlane ? `rgba(244, 63, 94, ${alpha})` : `rgba(229, 198, 135, ${alpha})`;
      ctx.lineWidth = isPlane ? 2.2 : 2.6;
      strokePath(this.paths[i]);
      ctx.restore();
    }

    // Active leg luminous beam
    if (this.activeIdx >= 0 && this.activeIdx < LEGS.length && this.activeSlice.length >= 2) {
      const isPlane = LEGS[this.activeIdx].mode === 'plane';
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isPlane ? 'rgba(244, 63, 94, 0.24)' : 'rgba(229, 198, 135, 0.26)';
      ctx.lineWidth = 10;
      strokePath(this.activeSlice);
      ctx.strokeStyle = isPlane ? '#f43f5e' : '#e5c687';
      ctx.lineWidth = isPlane ? 2.8 : 3.2;
      strokePath(this.activeSlice);
      ctx.restore();
    }

    // 9. City Beacons & Collision-Free Active Pill Labels
    const curLeg = this.currentLeg();
    const lang = this.i18n.lang();
    const activeFrom = this.inOverview() ? 'almaty' : curLeg.from;
    const activeTo = this.inOverview() ? 'milan' : curLeg.to;
    const pulse = 0.5 + 0.5 * Math.sin(this.pulseClock * 2.2);

    const pillBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];

    for (const c of CITIES) {
      const [x, y] = proj(c);
      if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;
      const isActive = c.id === activeFrom || c.id === activeTo;

      // Halo
      ctx.beginPath();
      if (isActive) {
        ctx.fillStyle = `rgba(244, 63, 94, ${0.18 + pulse * 0.14})`;
        ctx.arc(x, y, 10 + pulse * 5, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.14)';
        ctx.arc(x, y, c.hub ? 4.5 : 6, 0, Math.PI * 2);
      }
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = isActive ? '#f43f5e' : c.hub ? '#94a3b8' : '#e2e8f0';
      ctx.arc(x, y, isActive ? 4.5 : c.hub ? 2.4 : 3.1, 0, Math.PI * 2);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }

    // Draw pill tags ONLY for active endpoints (plus major hubs when zoomed in cleanly without overlapping)
    const labelCandidates = CITIES.filter(
      (c) =>
        c.id === activeFrom ||
        c.id === activeTo ||
        (this.camZoom >= 5.3 && !c.hub) ||
        (this.inOverview() && (c.id === 'almaty' || c.id === 'paris' || c.id === 'rome')),
    );

    // Prioritize active endpoints first
    labelCandidates.sort((a, b) => {
      const aAct = a.id === activeFrom || a.id === activeTo ? 0 : 1;
      const bAct = b.id === activeFrom || b.id === activeTo ? 0 : 1;
      return aAct - bAct;
    });

    for (const c of labelCandidates) {
      const [x, y] = proj(c);
      if (x < 16 || x > w - 16 || y < 16 || y > h - 16) continue;
      const isActive = c.id === activeFrom || c.id === activeTo;
      const cityLabel = c.hub ? (lang === 'kk' ? 'ауысу' : 'стыковка') : c.name[lang].split(' · ')[0];

      ctx.font = '700 10.5px "IBM Plex Mono", monospace';
      const codeW = ctx.measureText(c.code).width;
      ctx.font = '600 11px "Golos Text", sans-serif';
      const nameW = ctx.measureText(cityLabel).width;
      const padX = 8;
      const gap = 6;
      const boxW = padX * 2 + codeW + gap + nameW;
      const boxH = 22;

      // Try 4 quadrants around the pin to prevent overlaps and edge clipping
      const offsets: Array<[number, number]> = [
        [10, -boxH - 6],
        [-boxW - 10, -boxH - 6],
        [10, 8],
        [-boxW - 10, 8],
      ];
      let chosen: { x: number; y: number } | null = null;
      for (const [ox, oy] of offsets) {
        const bx = Math.max(8, Math.min(w - boxW - 8, x + ox));
        const by = Math.max(8, Math.min(h - boxH - 8, y + oy));
        const collides = pillBoxes.some(
          (b) => bx < b.x + b.w + 4 && bx + boxW + 4 > b.x && by < b.y + b.h + 4 && by + boxH + 4 > b.y,
        );
        if (!collides) {
          chosen = { x: bx, y: by };
          break;
        }
      }
      if (!chosen && !isActive) continue;
      const posBox = chosen ?? {
        x: Math.max(8, Math.min(w - boxW - 8, x + 10)),
        y: Math.max(8, Math.min(h - boxH - 8, y - boxH - 6)),
      };
      pillBoxes.push({ x: posBox.x, y: posBox.y, w: boxW, h: boxH });

      // Rounded dark glass badge
      ctx.save();
      ctx.fillStyle = isActive ? 'rgba(9, 15, 29, 0.92)' : 'rgba(9, 15, 29, 0.72)';
      ctx.strokeStyle = isActive ? 'rgba(244, 63, 94, 0.55)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(posBox.x, posBox.y, boxW, boxH, 7);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '700 10.5px "IBM Plex Mono", monospace';
      ctx.fillStyle = isActive ? '#fda4af' : '#e2e8f0';
      ctx.fillText(c.code, posBox.x + padX, posBox.y + boxH / 2 + 0.5);

      ctx.font = '600 11px "Golos Text", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(cityLabel, posBox.x + padX + codeW + gap, posBox.y + boxH / 2 + 0.5);
      ctx.restore();
    }

    // 10. Rotating Vector Aircraft / Train Craft with Bloom
    if (this.craftPos) {
      const [cxPos, cyPos] = proj(this.craftPos);
      ctx.save();
      ctx.translate(cxPos, cyPos);
      ctx.rotate(this.headingRad + Math.PI / 2);

      if (this.craftMode === 'plane') {
        // Soft radar glow
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        g.addColorStop(0, 'rgba(244, 63, 94, 0.52)');
        g.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Crisp jet silhouette pointing -Y
        ctx.fillStyle = '#f43f5e';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(2.4, -4);
        ctx.lineTo(12, 2.5);
        ctx.lineTo(12, 5);
        ctx.lineTo(2.4, 2);
        ctx.lineTo(2, 8.5);
        ctx.lineTo(5.5, 11.2);
        ctx.lineTo(5.5, 13);
        ctx.lineTo(0, 11.2);
        ctx.lineTo(-5.5, 13);
        ctx.lineTo(-5.5, 11.2);
        ctx.lineTo(-2, 8.5);
        ctx.lineTo(-2.4, 2);
        ctx.lineTo(-12, 5);
        ctx.lineTo(-12, 2.5);
        ctx.lineTo(-2.4, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
        g.addColorStop(0, 'rgba(229, 198, 135, 0.55)');
        g.addColorStop(1, 'rgba(229, 198, 135, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Sleek high-speed rail capsule pointing -Y
        ctx.fillStyle = '#e5c687';
        ctx.strokeStyle = '#090f1d';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-4.5, -11, 9, 22, 4.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#090f1d';
        ctx.fillRect(-2.4, -7, 4.8, 3.2);
        ctx.fillRect(-2.4, -1.5, 4.8, 4);
      }

      ctx.restore();
    }
  }
}
