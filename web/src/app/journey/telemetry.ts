export interface TelemetrySample {
  alt: number;
  speed: number;
}

export interface TelemetryPaths {
  altLine: string;
  altArea: string;
  speedLine: string;
}

export interface PhaseStatus {
  label: string;
  tone: 'ground' | 'air' | 'rail' | 'alpine' | 'arrived';
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) {
    return 0;
  }
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) {
    return x < edge0 ? 0 : 1;
  }
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Realistic takeoff → climb → cruise → descent → touchdown altitude in meters. */
export function flightAltitude(t: number, cruiseMeters: number): number {
  const x = clamp01(t);
  if (x <= 0.015 || x >= 0.985) {
    return 0;
  }
  const climb = smoothstep(0.015, 0.24, x);
  const descend = 1 - smoothstep(0.74, 0.985, x);
  const envelope = Math.min(climb, descend);
  const micro = Math.sin(x * Math.PI * 3) * 0.012 * envelope;
  return Math.max(0, Math.round(cruiseMeters * clamp01(envelope + micro)));
}

/** Smooth topographic elevation profile between origin, midpoint/pass, and destination. */
export function railElevation(t: number, startM: number, peakM: number, endM: number): number {
  const x = clamp01(t);
  if (x === 0) {
    return Math.round(startM);
  }
  if (x === 1) {
    return Math.round(endM);
  }
  const oneMinus = 1 - x;
  const val = oneMinus * oneMinus * startM + 2 * oneMinus * x * peakM + x * x * endM;
  return Math.max(0, Math.round(val));
}

/** Smooth speed ramp (km/h) for aircraft or high-speed / alpine trains. */
export function craftSpeed(t: number, maxKmh: number): number {
  const x = clamp01(t);
  if (x <= 0.01 || x >= 0.99) {
    return 0;
  }
  const accel = smoothstep(0.01, 0.16, x);
  const decel = 1 - smoothstep(0.82, 0.99, x);
  return Math.max(0, Math.round(maxKmh * Math.min(accel, decel)));
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) {
    return `${m}m`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Builds clean SVG path strings for the F1-style bottom live telemetry graph. */
export function buildTelemetryPaths(
  samples: TelemetrySample[],
  maxAlt: number,
  maxSpeed: number,
  width: number,
  height: number,
): TelemetryPaths {
  if (!samples.length || width <= 0 || height <= 0) {
    return { altLine: '', altArea: '', speedLine: '' };
  }

  const padTop = 6;
  const padBottom = 6;
  const usableH = Math.max(1, height - padTop - padBottom);
  const altCap = Math.max(1, maxAlt);
  const spdCap = Math.max(1, maxSpeed);
  const denom = Math.max(1, samples.length - 1);

  const altPts: string[] = [];
  const spdPts: string[] = [];
  let lastX = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const x = samples.length === 1 ? 0 : (i / denom) * width;
    lastX = x;
    const ay = padTop + usableH * (1 - clamp01(s.alt / altCap));
    const sy = padTop + usableH * (1 - clamp01(s.speed / spdCap));
    const cmd = i === 0 ? 'M' : 'L';
    altPts.push(`${cmd}${x.toFixed(1)},${ay.toFixed(1)}`);
    spdPts.push(`${cmd}${x.toFixed(1)},${sy.toFixed(1)}`);
  }

  const altLine = altPts.join(' ');
  const altArea = `${altLine} L${lastX.toFixed(1)},${height.toFixed(1)} L0.0,${height.toFixed(1)} Z`;
  const speedLine = spdPts.join(' ');

  return { altLine, altArea, speedLine };
}

/**
 * Computes F1 Jet Tracker-style dynamic zoom:
 * tight on takeoff/departure → pulls back cleanly for cruise → zooms tightly on approach/landing.
 */
export function cameraZoomForPhase(t: number, isFlight: boolean, overviewZoom: number): number {
  const x = clamp01(t);
  const tightBoost = isFlight ? 2.2 : 1.5;
  const maxClose = Math.min(9.2, overviewZoom + tightBoost);
  const depBlend = 1 - smoothstep(0.04, 0.24, x);
  const arrBlend = smoothstep(0.76, 0.96, x);
  const boost = Math.max(depBlend, arrBlend);
  return Number((overviewZoom + (maxClose - overviewZoom) * boost).toFixed(2));
}

export function statusForPhase(t: number, mode: 'plane' | 'train', alpine = false): PhaseStatus {
  const x = clamp01(t);
  if (x < 0.04) {
    return { label: mode === 'plane' ? 'НА ПОЛОСЕ' : 'ОТПРАВЛЕНИЕ', tone: 'ground' };
  }
  if (x > 0.94) {
    return { label: mode === 'plane' ? 'ПОСАДКА' : 'ПРИБЫТИЕ', tone: 'arrived' };
  }
  if (alpine) {
    return { label: 'АЛЬПИЙСКИЙ ПОДЪЁМ', tone: 'alpine' };
  }
  if (mode === 'plane') {
    return { label: 'В ПОЛЁТЕ', tone: 'air' };
  }
  return { label: 'СКОРОСТНОЙ ПОЕЗД', tone: 'rail' };
}
