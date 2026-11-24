import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  buildTelemetryPaths,
  cameraZoomForPhase,
  craftSpeed,
  flightAltitude,
  formatDuration,
  railElevation,
  statusForPhase,
} from './telemetry.ts';
import {
  ADVANTAGES,
  CHAPTERS,
  EXCLUDED,
  INCLUDED,
  LEGS,
  MOMENTS,
  TOUR_WAVES,
  WHATSAPP_TOURS,
  whatsappLink,
} from '../data/tour.ts';

test('flightAltitude climbs from 0, cruises near peak, and lands cleanly at 0', () => {
  assert.equal(flightAltitude(0, 11000), 0);
  assert.equal(flightAltitude(1, 11000), 0);
  const cruise = flightAltitude(0.5, 11000);
  assert.ok(cruise >= 10800 && cruise <= 11000, `expected cruise near 11000, got ${cruise}`);
  assert.ok(flightAltitude(0.12, 11000) > 1000 && flightAltitude(0.12, 11000) < 9500);
});

test('railElevation interpolates smoothly from Zürich to Mürren (408m → 1650m)', () => {
  assert.equal(railElevation(0, 408, 1200, 1650), 408);
  assert.equal(railElevation(1, 408, 1200, 1650), 1650);
  const mid = railElevation(0.5, 408, 1200, 1650);
  assert.ok(mid > 900 && mid < 1400, `unexpected mid elevation ${mid}`);
});

test('craftSpeed ramps up and down smoothly without negative values or NaN', () => {
  assert.equal(craftSpeed(0, 840), 0);
  assert.equal(craftSpeed(1, 840), 0);
  const mid = craftSpeed(0.5, 840);
  assert.ok(mid >= 820 && mid <= 840);
  assert.equal(craftSpeed(-0.5, 300), 0);
  assert.equal(craftSpeed(1.5, 300), 0);
});

test('formatDuration renders human-readable flight and rail durations', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(55), '55m');
  assert.equal(formatDuration(145), '2h 25m');
  assert.equal(formatDuration(340), '5h 40m');
});

test('buildTelemetryPaths handles empty, single, and multi-point samples without NaN', () => {
  const empty = buildTelemetryPaths([], 11000, 840, 600, 64);
  assert.equal(empty.altLine, '');
  assert.equal(empty.altArea, '');
  assert.equal(empty.speedLine, '');

  const single = buildTelemetryPaths([{ alt: 5000, speed: 420 }], 11000, 840, 600, 64);
  assert.ok(single.altLine.startsWith('M'));
  assert.ok(!single.altLine.includes('NaN'));

  const multi = buildTelemetryPaths(
    [
      { alt: 0, speed: 0 },
      { alt: 5500, speed: 500 },
      { alt: 11000, speed: 840 },
      { alt: 0, speed: 0 },
    ],
    11000,
    840,
    600,
    64,
  );
  assert.ok(multi.altLine.includes('L') && !multi.altLine.includes('NaN'));
  assert.ok(multi.altArea.endsWith('Z') && !multi.altArea.includes('NaN'));
  assert.ok(multi.speedLine.includes('L') && !multi.speedLine.includes('NaN'));
});

test('cameraZoomForPhase zooms tight on departure & arrival and pulls back at cruise', () => {
  const dep = cameraZoomForPhase(0.02, true, 5.2);
  const cruise = cameraZoomForPhase(0.5, true, 5.2);
  const arr = cameraZoomForPhase(0.98, true, 5.2);
  assert.ok(dep > cruise + 1.0, `expected departure zoom ${dep} > cruise ${cruise}`);
  assert.ok(arr > cruise + 1.0, `expected arrival zoom ${arr} > cruise ${cruise}`);
  assert.ok(Math.abs(cruise - 5.2) < 0.25);
});

test('statusForPhase transitions cleanly from ground to en-route to arrived', () => {
  assert.equal(statusForPhase(0.01, 'plane').tone, 'ground');
  assert.equal(statusForPhase(0.45, 'plane').tone, 'air');
  assert.equal(statusForPhase(0.45, 'train').tone, 'rail');
  assert.equal(statusForPhase(0.45, 'train', true).tone, 'alpine');
  assert.equal(statusForPhase(0.97, 'plane').tone, 'arrived');
});

test('ARALA Classic Eurotour data matches spec counts and WhatsApp encoding', () => {
  assert.equal(TOUR_WAVES.length, 4);
  assert.equal(TOUR_WAVES[0].price, '1 190 000 ₸');
  assert.equal(TOUR_WAVES[3].price, '1 250 000 ₸');
  assert.equal(INCLUDED.length, 7);
  assert.equal(EXCLUDED.length, 6);
  assert.equal(ADVANTAGES.length, 6);
  assert.equal(MOMENTS.length, 8);
  assert.equal(CHAPTERS.length, 6);
  assert.ok(LEGS.length >= 10);
  const url = whatsappLink(WHATSAPP_TOURS, 'Привет, хочу в Евротур 4–13 марта!');
  assert.ok(url.startsWith('https://wa.me/77066089508?text='));
  assert.ok(url.includes(encodeURIComponent('4–13 марта')));
});

test('review regressions: anchorScrolling enabled, modal scrolls on short screens, map cleans up under reduced motion', () => {
  const appCfg = readFileSync(resolve(import.meta.dirname, '..', 'app.config.ts'), 'utf8');
  assert.ok(appCfg.includes("anchorScrolling: 'enabled'"), 'anchorScrolling must be enabled for cross-route fragments');

  const modalSrc = readFileSync(resolve(import.meta.dirname, '..', 'shared', 'booking-modal.ts'), 'utf8');
  assert.ok(modalSrc.includes('overflow-y: auto'), 'booking modal sheet must scroll vertically on short viewports');

  const mapSrc = readFileSync(resolve(import.meta.dirname, 'journey-map.ts'), 'utf8');
  assert.ok(mapSrc.indexOf('this.destroyRef.onDestroy') < mapSrc.indexOf('if (reduced)'), 'onDestroy must register before reduced-motion early return');
  assert.ok(mapSrc.includes('cancelAnimationFrame(this.initRaf)'), 'initial RAF must be cancelled cleanly');
  assert.ok(mapSrc.includes('getBoundsZoom'), 'overview zoom must adapt to mobile viewport width');
});
