# ARALA Tours Rebrand & Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand and redesign `iTour` into **ARALA** (`@arala.tours`) with a bespoke light editorial aesthetic ("Alpine Paper, Midnight Ink & Ruby Pulse"), complete Classic Eurotour content (8 destinations, 4 date waves, 8 real traveler collages, booking modal + WhatsApp handoff), an F1 Jet Tracker-inspired live route telemetry map, restyled `/guide`, `/login`, `/admin`, updated visa guides, and production Vercel deployment.

**Architecture:** Modular Angular 22 standalone components with signals and CSS custom properties (`styles.scss`), pure TypeScript telemetry/camera math (`journey/telemetry.ts`) unit-tested via Node's native test runner, Leaflet CartoDB DarkMatter cockpit map (`journey-map`), and synced dual backends (`web/api/` for Vercel + `server/` in Go/SQLite).

**Tech Stack:** Angular 22, TypeScript 6, SCSS, Leaflet 1.9.4, Lenis 1.3.26, Node 24 (`node:test`), Go 1.26, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-24-arala-rebrand-redesign-design.md`

## Global Constraints

- Angular 22 standalone components + signals; zero new paid SDKs or API keys.
- Production build budgets in `web/angular.json` must pass: `initial <= 1MB` (`warning 500kB`), `anyComponentStyle <= 32kB` (`warning 16kB`).
- All 8 uploaded traveler collages copied to `web/public/media/moments/{venice,milan,paris,barcelona,vatican,swiss-alps,zurich,rome}.jpg` and rendered in `#moments` with lightbox.
- Exact offer terms verbatim: 4 waves (21–29 янв `1 190 000 ₸`, 4–13 мар `1 190 000 ₸`, 14–22 апр `1 230 000 ₸`, 5–15 мая `1 250 000 ₸`), 7 included items, 6 excluded items, 6 numbered reasons.
- Honor `prefers-reduced-motion: reduce` across Lenis, reveal directive, and `JourneyMap`.
- Dual backend parity (`web/api/` and `server/`) for auth, leads, guides, and 10 guide Markdown files.

## Review Focus

1. **Map rapid click / leg switching mid-flight:** Clicking route chips or Replay while `requestAnimationFrame` and Leaflet `flyTo`/camera interpolation are active must cleanly cancel stale animation state without jitter, orphaned timers, or NaN coordinates.
2. **Booking modal & inline form error/offline handling:** Submitting invalid inputs (missing name or missing both phone and Telegram) blocks submission with Russian validation errors; API failure still offers the 1-click pre-filled WhatsApp handoff so no lead is stranded.
3. **Mobile viewport (`375px`) overflow & touch targets:** F1 telemetry header/footer, floating header dropdown, 4-wave pricing strip, and `9:16` moments gallery must never cause horizontal page overflow (`overflow-x: clip`) or unreadable overlapping map labels.
4. **Auth token migration & route guards:** Users with an old `itour_token` in `localStorage` seamlessly restore or fall back cleanly without crashing `/guide` or `/admin`, and logout clears both `arala_token` and `itour_token`.
5. **Dual-backend guide sync:** All 5 guide slugs (`visa-overview`, `visa-documents`, `visa-italy`, `after-approval`, `packing`) exist identically in both `web/api/content/` and `server/content/guides/` and contain zero stale `iTour` / Rome-start itinerary contradictions.

---

### Task 1: Brand Assets, Global Editorial Theme & Favicons

**Files:**
- Create: `web/public/media/moments/{venice,milan,paris,barcelona,vatican,swiss-alps,zurich,rome}.jpg`
- Modify: `web/public/favicon.svg`, `web/public/favicon.png`, `web/public/apple-touch-icon.png`, `web/public/favicon.ico`
- Modify: `web/src/index.html`
- Modify: `web/src/styles.scss`
- Create: `web/src/app/shared/arala-logo.ts`

**Interfaces:**
- Produces: `:root` CSS variables (`--bg`, `--surface`, `--surface-soft`, `--ink-dark`, `--ink-dark-2`, `--text`, `--text-muted`, `--text-subtle`, `--ruby`, `--ruby-hover`, `--ruby-glow`, `--gold`, `--gold-deep`, `--alpine`, `--danger`, `--border`, `--r-xl`, `--r-lg`, `--r-md`, `--r-pill`, `--font-sans`, `--font-serif`, `--font-mono`), `.wrap`, `.btn`, `.section-head`, and `<app-arala-logo [variant]="'badge' | 'dark' | 'light'" />`.

- [ ] **Step 1:** Copy the 8 real customer collages from `.user_uploaded/` into `web/public/media/moments/` with exact spec filenames and verify all 8 files are non-empty.
- [ ] **Step 2:** Create the crisp ARALA mountain-peak-"A" + road + airplane SVG emblem in `web/public/favicon.svg`, regenerate `favicon.png`, `apple-touch-icon.png`, `favicon.ico`, and build standalone `<app-arala-logo />` component (`web/src/app/shared/arala-logo.ts`).
- [ ] **Step 3:** Update `web/src/index.html` (`ARALA — Авторский Евротур`, description, Google Fonts `Manrope`, `Cormorant Garamond`, `JetBrains Mono`) and rewrite `web/src/styles.scss` with full ARALA light editorial tokens and base typography.
- [ ] **Step 4:** Verify assets exist and `web/src/styles.scss` compiles cleanly during build check.

---

### Task 2: Classic Eurotour Data Model & Pure F1 Telemetry Engine (TDD)

**Files:**
- Modify: `web/src/app/data/tour.ts`
- Create: `web/src/app/journey/telemetry.ts`
- Create: `web/src/app/journey/telemetry.test.mjs`

**Interfaces:**
- Produces in `tour.ts`: `INSTAGRAM`, `WHATSAPP_TOURS`, `WHATSAPP_VISA`, `whatsappLink(phone: string, text: string): string`, `TOUR_WAVES`, `CITIES`, `CHAPTERS`, `LEGS`, `MOMENTS`, `HOTEL_TIERS`, `INCLUDED`, `EXCLUDED`, `ADVANTAGES`, `FOUNDERS`, `OTHER_OFFERINGS`, and TypeScript interfaces (`TourWave`, `City`, `Chapter`, `Place`, `Leg`, `MomentPhoto`, `HotelTier`, `Advantage`, `OtherOffering`).
- Produces in `telemetry.ts`: `flightAltitude(t: number, cruiseMeters: number): number`, `railElevation(t: number, startM: number, peakM: number, endM: number): number`, `craftSpeed(t: number, maxKmh: number): number`, `formatDuration(minutes: number): string`, `buildTelemetryPaths(samples: Array<{ alt: number; speed: number }>, maxAlt: number, maxSpeed: number, width: number, height: number): { altLine: string; altArea: string; speedLine: string }`, `cameraZoomForPhase(t: number, isFlight: boolean, overviewZoom: number): number`, `statusForPhase(t: number, mode: 'plane' | 'train', alpine?: boolean): { label: string; tone: 'ground' | 'air' | 'rail' | 'alpine' | 'arrived' }`.

- [ ] **Step 1:** Write failing unit tests in `web/src/app/journey/telemetry.test.mjs` pinning takeoff/cruise/landing altitude profiles, alpine elevation ramp (`408 → 1650 m`), speed profile, zero-NaN SVG path generation (including empty/single sample edge cases), dynamic F1 camera zoom phases (`t=0`, `t=0.5`, `t=1`), status badge transitions, and `whatsappLink` URL encoding.
- [ ] **Step 2:** Run `node --test web/src/app/journey/telemetry.test.mjs` and confirm FAIL before implementation.
- [ ] **Step 3:** Implement `web/src/app/journey/telemetry.ts` and rewrite `web/src/app/data/tour.ts` with all verified Classic Eurotour content, coordinates, 10 realistic legs (`ALA → IST → MXP → VCE → FCO → CDG → BSL → ZRH → LBR/MUR → ZRH → IST → ALA`), 6 curated chapters covering all 8 cities, 8 moments, 3 hotel tiers, verbatim 7 included / 6 excluded / 6 advantages, founders, and 3 other offerings.
- [ ] **Step 4:** Run `node --test web/src/app/journey/telemetry.test.mjs` (via TypeScript strip-types in Node 24!) and verify ALL tests PASS.

---

### Task 3: F1 Jet Tracker-Inspired Route Telemetry Map (`JourneyMap`)

**Files:**
- Modify: `web/src/app/journey/journey-map.ts`
- Modify: `web/src/app/journey/journey-map.html`
- Modify: `web/src/app/journey/journey-map.scss`

**Interfaces:**
- Consumes: `CITIES`, `LEGS` from `web/src/app/data/tour.ts`; pure telemetry functions from `web/src/app/journey/telemetry.ts`.
- Produces: `<app-journey-map />` standalone cockpit card component with top `FROM → TO` telemetry bar, live animated Leaflet CartoDB DarkMatter map with 3-phase F1 dynamic zoom, glowing ruby/gold trails, bottom 4-metric tabular HUD + live dual-curve SVG chart, Play/Pause/Replay controls, clickable leg pills, and `prefers-reduced-motion` graceful full-route view.

- [ ] **Step 1:** Implement `journey-map.ts` with clean RAF lifecycle, race-free `jumpToLeg(index)` / `togglePlay()` / `replay()` controls, CartoDB DarkMatter No-Labels tiles, ambient country labels, 3-phase F1 camera interpolation, cumulative & leg distance/altitude/speed computation, and live SVG sparkline path updates.
- [ ] **Step 2:** Implement `journey-map.html` and `journey-map.scss` matching the dark `#080D18` cockpit card framed cleanly inside the light page, responsive down to `360px`, staying well under `16kB` SCSS budget.
- [ ] **Step 3:** Verify TypeScript compilation via `cd web && npm run build`.

---

### Task 4: Navigation, Footer, Shared Interactive Components & Home Landing

**Files:**
- Modify: `web/src/app/layout/nav.ts`
- Modify: `web/src/app/layout/footer.ts`
- Create: `web/src/app/shared/booking-modal.ts`
- Create: `web/src/app/shared/moments-gallery.ts`
- Create: `web/src/app/shared/hotel-showcase.ts`
- Modify: `web/src/app/journey/city-chapter.ts`, `city-chapter.html`, `city-chapter.scss`
- Modify: `web/src/app/pages/home.ts`, `home.html`, `home.scss`

**Interfaces:**
- Consumes: `AralaLogo`, `tour.ts` exports, `JourneyMap`, `ApiService.sendLead`.
- Produces: `<app-booking-modal />` (exposes `open(waveLabel?: string)` method), `<app-moments-gallery [moments]="..." />` (9:16 wall + lightbox `<dialog>`), `<app-hotel-showcase [tiers]="..." />` (interactive thumbnail switcher), restyled `<app-city-chapter [chapter]="..." />`, sticky `<app-nav />` with mobile floating dropdown, `<app-footer />`, and complete `<app-home />`.

- [ ] **Step 1:** Implement `booking-modal.ts`, `moments-gallery.ts`, and `hotel-showcase.ts`.
- [ ] **Step 2:** Rewrite `nav.ts` (connecting `Записаться` CTA smoothly to `#book` / modal event and adding clean mobile floating menu) and `footer.ts`.
- [ ] **Step 3:** Rewrite `city-chapter.ts/html/scss` (light editorial layout, gold accent dash, special Alpine highlight for Lauterbrunnen & Mürren, `Все / Места / Атмосфера` filter chips).
- [ ] **Step 4:** Rewrite `home.ts/html/scss` uniting all 10 sections (Inset Midnight-Ink Hero, 4 interactive date-wave cards + bento details, F1 `JourneyMap`, country-filtered City Chapters, 8 real traveler `MomentsGallery`, `HotelShowcase`, verbatim Included/Excluded, 6 Advantages + Founders card, Other ARALA Offerings + Visa Guide CTA, Inline Booking Form + `BookingModal` with dual API + WhatsApp handoff).
- [ ] **Step 5:** Run `cd web && npm run build` and verify zero TypeScript/template/budget errors.

---

### Task 5: Restyle Secondary Pages, Auth Token Migration, Visa Guides & Dual Backends

**Files:**
- Modify: `web/src/app/core/auth.ts`, `web/src/app/core/auth.interceptor.ts`
- Modify: `web/src/app/pages/login.ts`, `guides.ts`, `guide-detail.ts`, `admin.ts`
- Modify: `web/api/_lib.js`, `web/vercel.json`
- Modify: `web/api/content/{visa-overview,visa-documents,visa-italy,after-approval,packing}.md`
- Modify: `server/content/guides/{visa-overview,visa-documents,visa-italy,after-approval,packing}.md`
- Modify: `server/cmd/api/main.go`, `server/internal/store/store.go`, `server/internal/httpserver/server.go`
- Modify: `render.yaml`, `README.md`
- Create: `web/api/_lib.test.mjs`

**Interfaces:**
- Produces: Cohesive light ARALA theme on `/login`, `/guide`, `/guide/:slug`, `/admin`; `arala_token` with `itour_token` migration fallback; synced ARALA Milan-first 8-city visa guides across all 10 Markdown files; rebranded Go & Vercel API defaults (`admin@arala.tours`, `guest@arala.tours`, `@arala.tours`, `+7 706 608 9508`).

- [ ] **Step 1:** Write failing test `web/api/_lib.test.mjs` verifying `admin@arala.tours` & `guest@arala.tours` seeded accounts, JWT sign/parse roundtrip, `addLead`/`listLeads`, and verifying all 5 guide Markdown files match byte-for-byte between `web/api/content/` and `server/content/guides/` and contain `Милан`, `Мюррен`, `Базель`, `90 €` without stale `iTour` branding.
- [ ] **Step 2:** Run `node --test web/api/_lib.test.mjs` and confirm FAIL.
- [ ] **Step 3:** Update `auth.ts`, `auth.interceptor.ts`, restyle `login.ts`, `guides.ts`, `guide-detail.ts`, `admin.ts`, update all 10 guide `.md` files, and rebrand `web/api/_lib.js`, `server/` files, `render.yaml`, `README.md` (preserving `web/vercel.json` compatibility with existing Vercel project!).
- [ ] **Step 4:** Run `node --test web/api/_lib.test.mjs`, `cd server && go build ./...`, and `cd web && npm run build` — verify all pass with exit 0.

---

### Task 6: Verification, Live Chrome Visual Audit, Final Branch Review & Vercel Deployment

- [ ] **Step 1:** Run full automated verification suite (`node --test`, `cd server && go build ./...`, `cd web && npm run build`).
- [ ] **Step 2:** Start local preview server and inspect desktop + mobile views in Chrome (checking Hero, Dates, F1 Jet Tracker animation frames, City Chapters, 8 real Moments + Lightbox, Hotel Switcher, Booking Modal, `/login`, `/guide`, `/admin`, zero console errors, zero broken images).
- [ ] **Step 3:** Dispatch fresh reviewer subagent over full git diff against spec + Review Focus; address any Critical/Important findings with tests and re-verify.
- [ ] **Step 4:** Commit all changes cleanly on `main`, push to `origin main`, and deploy/verify live production update on Vercel.
