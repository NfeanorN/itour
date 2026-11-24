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

test('statusForPhase supports both Kazakh (default) and Russian status labels', () => {
  assert.equal(statusForPhase(0.01, 'plane', false, 'kk').label, 'ҰШУ АЛАҢЫНДА');
  assert.equal(statusForPhase(0.45, 'plane', false, 'kk').label, 'ӘУЕДЕ');
  assert.equal(statusForPhase(0.45, 'train', false, 'kk').label, 'ЖЫЛДАМ ПОЙЫЗ');
  assert.equal(statusForPhase(0.45, 'train', true, 'kk').label, 'АЛЬПІГЕ КӨТЕРІЛУ');
  assert.equal(statusForPhase(0.97, 'plane', false, 'kk').label, 'ҚОНДЫ');

  assert.equal(statusForPhase(0.45, 'plane', false, 'ru').label, 'В ПОЛЁТЕ');
  assert.equal(statusForPhase(0.97, 'plane', false, 'ru').tone, 'arrived');
});

test('ARALA bilingual Classic Eurotour data has complete kk & ru pairs', () => {
  assert.equal(TOUR_WAVES.length, 4);
  assert.equal(TOUR_WAVES[0].dates.kk, '21–29 қаңтар');
  assert.equal(TOUR_WAVES[0].dates.ru, '21–29 января');
  assert.equal(TOUR_WAVES[0].price, '1 190 000 ₸');
  assert.equal(TOUR_WAVES[3].price, '1 250 000 ₸');
  assert.equal(INCLUDED.length, 7);
  assert.equal(EXCLUDED.length, 6);
  assert.equal(ADVANTAGES.length, 6);
  assert.equal(MOMENTS.length, 8);
  assert.equal(CHAPTERS.length, 6);
  assert.ok(LEGS.length >= 10);

  for (const item of [...INCLUDED, ...EXCLUDED]) {
    assert.ok(item.kk.trim().length > 0 && item.ru.trim().length > 0);
  }
  const url = whatsappLink(WHATSAPP_TOURS, 'Сәлеметсіз бе! 4–13 наурыз');
  assert.ok(url.startsWith('https://wa.me/77066089508?text='));
  assert.ok(url.includes(encodeURIComponent('4–13 наурыз')));
});

test('map uses Esri Dark Gray Canvas (no API-key CARTO), Kazakh is default lang, and regressions hold', () => {
  const i18nSrc = readFileSync(resolve(import.meta.dirname, '..', 'core', 'i18n.ts'), 'utf8');
  assert.ok(i18nSrc.includes("return 'kk'"), 'Kazakh must be the default language');

  const appCfg = readFileSync(resolve(import.meta.dirname, '..', 'app.config.ts'), 'utf8');
  assert.ok(appCfg.includes("anchorScrolling: 'enabled'"), 'anchorScrolling must be enabled');

  const modalSrc = readFileSync(resolve(import.meta.dirname, '..', 'shared', 'booking-modal.ts'), 'utf8');
  assert.ok(modalSrc.includes('overflow-y: auto'), 'booking modal sheet must scroll vertically on short viewports');

  const mapSrc = readFileSync(resolve(import.meta.dirname, 'journey-map.ts'), 'utf8');
  assert.ok(mapSrc.includes('World_Dark_Gray_Base'), 'map must use Esri World_Dark_Gray_Base tiles');
  assert.ok(!mapSrc.includes('basemaps.cartocdn.com'), 'map must not use CARTO tiles that require an API key');
  assert.ok(mapSrc.includes('updateWhenZooming: false'), 'map tiles must not abort on zoom');
  assert.ok(mapSrc.indexOf('this.destroyRef.onDestroy') < mapSrc.indexOf('if (reduced)'), 'onDestroy before reduced return');
  assert.ok(mapSrc.includes('cancelAnimationFrame(this.initRaf)'), 'initial RAF must be cancelled cleanly');
});
