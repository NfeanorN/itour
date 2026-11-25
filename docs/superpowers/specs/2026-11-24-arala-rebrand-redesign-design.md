# ARALA Tours — Rebrand, Editorial Redesign & Live Route Telemetry Spec

**Date:** 2026-11-24  
**Project:** `iTour` → **ARALA** (`@arala.tours`)  
**Stack:** Angular 22 (`web/`), Leaflet (`1.9.4`), Lenis (`1.3.26`), Vercel Serverless Functions (`web/api/`), Go + SQLite API (`server/`).

---

## 1. Intent & Why

Refresh the existing dark Apple-style single-tour `iTour` prototype into an authentic, high-trust website for **ARALA** (`@arala.tours`, founded by Ернұр & Қайрат — 3+ years living in Europe, 200+ travelers, 100+ visas).

The user wants:
- **Complete rebrand** from `iTour` to **ARALA** (`@arala.tours`), including identity, logo, favicons, contacts, copy, routes, and backend metadata.
- **Light boutique-editorial direction** inspired by `inspiring-chimera-537b74.netlify.app` (*Uya Trip*) — clean, airy, warm, conversion-oriented — **without literally cloning it**, shaped instead with ARALA's own identity and visual character.
- **Flagship focus on the Classic Eurotour** (Италия, Франция, Швейцария: Милан, Венеция, Рим + Ватикан, Париж, Базель, Цюрих, Лаутербруннен, Мюррен; 4 dates January–May, from `1 190 000 ₸`), incorporating real traveler photography uploaded from past tours.
- **Evolved animated route map**: keep the animated map centerpiece, but redesign its look and motion in the spirit of the **F1 Jet Tracker** reference video — dark minimalist telemetry map, dynamic takeoff/cruise/landing zoom choreography, top `FROM → TO` live progress strip, and bottom real-time telemetry with an animated SVG graph — harmonized into the new light editorial site.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Replace all `iTour` branding, old Instagram/WhatsApp links, old 5-city tour copy, and dark-only styling across the entire Angular frontend (`Home`, `Nav`, `Footer`, `JourneyMap`, `CityChapter`, `Guides`, `GuideDetail`, `Login`, `Admin`), favicons, `index.html`, API endpoints, `vercel.json`, `render.yaml`, and `README.md`.
- Build an original **ARALA Editorial** visual system ("Alpine Paper, Midnight Ink & Ruby Pulse") that feels boutique, luminous, and unmistakably ARALA.
- Upgrade `JourneyMap` into a cockpit-style **ARALA Flight & Rail Telemetry Tracker** covering the new 8-destination Eurotour (`Almaty → Istanbul → Milan → Venice → Rome → Paris → Basel → Zürich → Lauterbrunnen / Mürren → Zürich → Istanbul → Almaty`), with dynamic camera zoom, glowing trajectories, live metrics, animated SVG chart, play/pause/replay, and clickable legs.
- Present all Eurotour details accurately: 4 date waves + prices, what is included/excluded, 6 advantages, founder credibility block, hotel comfort tier switcher, city chapters with real imagery, all 8 uploaded real traveler tour photos, and a compact section for ARALA's other offerings (Christmas Eurotour, America Tour, Visa/Custom Route).
- Support frictionless booking via both an inline form and a reusable `<dialog>` booking modal (pre-selecting a clicked date wave) that persists leads to `POST /api/leads` (visible in `/admin`) and immediately offers a pre-filled WhatsApp handoff (`+7 706 608 9508`).
- Keep the existing gated visa guide (`/guide`, `/guide/:slug`) and admin panel (`/admin`) fully functional and seamlessly restyled in the new light theme.

### Non-Goals
- Online payment gateway or automated checkout integration.
- Full separate detail subpages for Christmas Eurotour or America Tour (the user selected **Классический Евротур** as the active site focus; other offerings appear as compact WhatsApp inquiry cards).
- Replacing Leaflet with a paid WebGL map SDK (Mapbox/Google Maps) requiring API keys.
- Full bilingual Kazakh/Russian CMS duplication in v1 *(builder call — see Section 7: Russian is the primary site language matching the complete Eurotour copy provided, while preserving authentic Kazakh captions on the real traveler photos; easy to extend with i18n later)*.

### Anti-Goals
- **Clone look:** Do NOT copy `Uya Trip`'s exact layout/colors verbatim or leave generic blue/gold template vibes disconnected from `@arala.tours`.
- **Visual dissonance:** Do NOT leave `/login`, `/guide`, or `/admin` in the old `#000` Apple dark theme while the home page is light editorial.
- **Cluttered/noisy map:** Do NOT keep Esri satellite tiles with muddied labels; the F1 telemetry map must stay razor-sharp, high-contrast, and legible on desktop and mobile.
- **Broken or stock-only trust:** Do NOT ignore the 8 real customer tour photos or leave dead links/placeholder text.
- **Budget regressions:** Do NOT break Angular production build budgets (`anyComponentStyle` warning `16kB`, error `32kB`; `initial` error `1MB`) or leave TypeScript/Go build failures.

---

## 3. Constraints

- **Framework & Dependencies:** Keep Angular 22 standalone components + signals, Leaflet `1.9.4`, Lenis `1.3.26`, Go `1.26` API, and Vercel Node serverless functions (`web/api/`). No paid third-party API keys.
- **Assets (Exact Source → Target Mapping):** Copy the 8 user-uploaded real customer `9:16` collages into `web/public/media/moments/` so Angular bundles them at `/media/moments/*.jpg`. Note that authentic Kazakh city captions are **already baked into the collage artwork** — HTML overlays should only add subtle pill/city labels or lightbox headers without duplicating or clashing with the baked-in yellow script lettering:
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327273_5460fede.jpg` → `web/public/media/moments/venice.jpg` (*Венеция*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327280_10b6c932.jpg` → `web/public/media/moments/milan.jpg` (*Милан*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327283_281b5c69.jpg` → `web/public/media/moments/paris.jpg` (*Париж*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327293_4a7410a8.jpg` → `web/public/media/moments/barcelona.jpg` (*Барселона · прошлые евротуры*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327305_bdb26d21.jpg` → `web/public/media/moments/vatican.jpg` (*Ватикан*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327313_7129f459.jpg` → `web/public/media/moments/swiss-alps.jpg` (*Швейцарские Альпы*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327318_300ae3be.jpg` → `web/public/media/moments/zurich.jpg` (*Цюрих*)
  - `C:/Users/Feanor/.gemini/antigravity/brain/9a962386-eeb9-4ea5-b480-7ee763a989bf/.user_uploaded/media_1795474327325_97150317.jpg` → `web/public/media/moments/rome.jpg` (*Рим*)
- **Accessibility & Motion:** Honor `prefers-reduced-motion: reduce` (disable Lenis smooth scroll, skip scroll-reveal hiding, and render the complete F1 map route with interactive leg selection instead of continuous rapid camera motion). Maintain AA text contrast on both light paper and dark ink surfaces.
- **Responsive Design:** First-class mobile experience (`360px`–`1440px+`), especially for the sticky header, booking modal, F1 telemetry HUD, city photo grids, and `9:16` traveler gallery.
- **Dual Backend Parity:** Both `web/api/` (Vercel) and `server/` (Go/Render) must stay in sync for auth, leads, guides, and tour metadata.

---

## 4. Approaches Considered

| Approach | Summary | Trade-offs |
|---|---|---|
| **1. ARALA Editorial + Ruby Pulse *(Selected & Evolved)*** | Original light editorial design inspired by Uya Trip's clarity (warm alabaster paper `#FAF9F6`, inset midnight-ink hero `#0B1324`, champagne warmth `#C8A86B`, `Manrope` + italic `Cormorant Garamond` + `JetBrains Mono`) infused with ARALA's SVG emblem and ruby pulse `#C8102E` inside the brand mark and dark F1 telemetry card. Focused on Classic Eurotour + compact card row for other ARALA directions. | Best balance of boutique luxury trust, recognizable ARALA brand identity (not a clone), dramatic light/dark contrast around the F1 map centerpiece, and laser-focused single-tour conversion. |
| **2. Pure Monochrome + Crimson Only** | Uya Trip layout recolored strictly into white + obsidian `#0E1117` + `#C8102E` crimson everywhere, removing warm champagne/navy tones. | Maximum 1:1 match with Instagram avatar and red F1 video, but feels sharper/sportier and less like quiet boutique European travel. |
| **3. Multi-Tour Switchable Hub** | Top-level tour switcher toggling Hero, dates, cities, and F1 tracker live between Classic Eurotour and Christmas 6-country Eurotour (+ America teaser). | Showcases both European itineraries equally, but dilutes first-screen conversion and user explicitly chose **Классический Евротур** as the focus. |

**Decision:** The user selected **Классический Евротур** and instructed *"не надо с точностью копировать этот сайт — делай так как ты рекомендуешь"*, confirming **Approach 1 (evolved bespoke ARALA Editorial)**.

---

## 5. Detailed Design

### 5.1 Design System Tokens (`web/src/styles.scss`)
Define CSS custom properties on `:root`:
- **Surfaces:**
  - `--bg: #FAF9F6` (warm alabaster page canvas)
  - `--surface: #FFFFFF` (elevated crisp cards, modals, inputs)
  - `--surface-soft: #F2F0EB` (warm stone bento blocks & soft pills)
  - `--ink-dark: #0B1324` (inset hero, F1 cockpit container, alpine spotlight, footer)
  - `--ink-dark-2: #121D33` (dark inner panels, telemetry cells)
- **Text:**
  - `--text: #0F172A` (primary ink on light)
  - `--text-muted: #475569` (secondary body on light)
  - `--text-subtle: #64748B` (captions, kickers)
  - `--text-on-dark: #F8FAFC`
  - `--text-on-dark-muted: #CBD5E1`
  - `--text-on-dark-subtle: #94A3B8`
- **Brand Accents:**
  - `--ruby: #C8102E` (ARALA emblem, live pulse dot, primary brand badge)
  - `--ruby-hover: #A80D26`
  - `--ruby-glow: #F43F5E` (high-visibility luminous flight trail & active pill on dark map)
  - `--gold: #C8A86B` (editorial hairline accents, highlight price badge, train route line, section underline bars)
  - `--gold-deep: #8C6B2F` (AA-accessible uppercase kickers on light paper)
  - `--alpine: #234766` (subtle ambient radial aura in hero, checkmarks, secondary links)
  - `--danger: #B42318` (excluded `✕` markers & form errors)
- **Borders & Radii:**
  - `--border: rgba(15, 23, 42, 0.08)`
  - `--border-strong: rgba(15, 23, 42, 0.14)`
  - `--border-dark: rgba(255, 255, 255, 0.10)`
  - `--r-xl: 28px` (hero, F1 cockpit card)
  - `--r-lg: 22px` (bento cards, modals, CTA box)
  - `--r-md: 16px` (photo frames, inputs)
  - `--r-pill: 999px`
- **Typography (`web/src/index.html` Google Fonts):**
  - `--font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif` (weights `500;600;700;800`)
  - `--font-serif: 'Cormorant Garamond', Georgia, serif` (italic `600`, full Cyrillic — used sparingly on hero italic accent, city editorial subtitles, and pull quotes)
  - `--font-mono: 'JetBrains Mono', ui-monospace, monospace` (weights `500;600;700`, `font-variant-numeric: tabular-nums` — used in F1 tracker codes, telemetry numbers, and leg timing)
- **Container & Rhythm:**
  - `.wrap { max-width: 1160px; margin: 0 auto; padding: 0 28px; }` (`0 16px` on `<720px`)
  - Section spacing: `56px 0` desktop / `40px 0` mobile
  - Editorial section headings (`h2`): bold `Manrope 800`, `clamp(28px, 4.4vw, 44px)`, `-0.03em` tracking, paired with a compact `40px × 3px` gold/ruby accent rule underneath.

### 5.2 Custom ARALA SVG Logo & Favicons
Create a reusable standalone component `AralaLogo` (`web/src/app/shared/arala-logo.ts`) rendering `@arala.tours`'s mountain-"A" + winding road + ascending airplane emblem + lowercase geometric `arala` wordmark in crisp SVG, supporting `variant: 'badge' | 'light' | 'dark'`.
Replace `web/public/favicon.svg`, `favicon.png`, `apple-touch-icon.png`, and `favicon.ico` with the new ARALA ruby-background (`#C8102E`) white-line emblem.

### 5.3 Navigation (`web/src/app/layout/nav.ts`) & Footer (`web/src/app/layout/footer.ts`)
- **Sticky Translucent Header (`76px`):**
  - Warm alabaster glass (`rgba(250, 249, 246, 0.88)`, `backdrop-filter: blur(14px)`, subtle bottom hairline on scroll).
  - Left: `AralaLogo` linking to `/`.
  - Center (desktop `≥960px`): clean links `Даты`, `Маршрут`, `Города`, `Впечатления`, `Гайд` (+ `Админ` if `auth.isAdmin`).
  - Right: compact `WhatsApp` link (`https://wa.me/77066089508`), `Войти` / user menu, primary `Записаться` pill, and on `<960px` a circular `#F2F0EB` menu button toggling a crisp floating rounded white dropdown panel (with click-outside and `Escape` close).
- **Footer:**
  - Deep midnight ink `#0B1324` full-width band inside clean generous spacing: `AralaLogo`, brand tagline (`ARALA · Авторские туры из Казахстана · Ернұр и Қайрат`), navigation links (`Маршрут`, `Даты и цены`, `Визовый гайд`, `Войти`), and direct contact pills (`Instagram @arala.tours`, `WhatsApp туры +7 706 608 9508`, `WhatsApp визы +7 777 205 7252`).

### 5.4 Home Page Architecture (`web/src/app/pages/home.*`)

Ordered flow on `/`:

1. **Inset Midnight-Ink Hero Card (`#top`):**
   - Rounded `28px` `#0B1324` container inside `.wrap` with subtle `#234766` radial top-right ambient glow and warm ruby whisper bottom-right.
   - Desktop asymmetric 2-column grid (`1.25fr 0.75fr`):
     - Left: Country pill (`🇮🇹 Италия · 🇫🇷 Франция · 🇨🇭 Швейцария`), bold H1 (`Путешествие мечты` + italic Cormorant Garamond `по Европе` `за одну поездку`), crisp subtitle naming the 3 countries & Swiss Alps highlight, 4 metric pills (`9–11 дней`, `8 городов`, **`от 1 190 000 ₸`** champagne highlight, `Виза бесплатно`), primary CTA `Забронировать место` (opens booking modal) + secondary ghost CTA `Смотреть маршрут` (`#route`).
     - Right (desktop & compact strip on mobile): atmospheric visual card featuring an iconic Swiss Alps / European frame with floating live stats badge (`200+ туристов · 100+ виз · 3+ года в Европе`).
2. **Даты, стоимость и ключевые детали (`#dates`):**
   - Interactive 4-card wave strip (clicking any card opens the booking modal pre-filled with that exact date wave):
     - `21–29 января` · `9 дней / 8 ночей` · **`1 190 000 ₸`**
     - `4–13 марта` · `10 дней / 9 ночей` · **`1 190 000 ₸`**
     - `14–22 апреля` · `9 дней / 8 ночей` · **`1 230 000 ₸`**
     - `5–15 мая` · `11 дней / 10 ночей` · **`1 250 000 ₸`**
   - Note: `Стоимость указана за 1 человека · Количество мест в авторской группе ограничено`.
   - Supporting 3-card bento row below: `Отели 3–4★` (комфортные городские и альпийские отели), `Транспорт и перелёты` (авиабилеты туда-обратно + все переезды между странами и городами), and a dark-ink highlight card **`Бонус: бесплатное визовое сопровождение`** (полная подготовка документов на шенген + доступ к закрытому гайду после оплаты).
3. **ARALA Live Flight & Rail Telemetry Tracker (`#route` — `<app-journey-map />`):**
   - Detailed in Section 5.5 below.
4. **Маршрут и города (`#cities` — `<app-city-chapter />`):**
   - Route pill breadcrumb in `#234766`: `Алматы → Милан → Венеция → Рим (Ватикан) → Париж → Базель → Цюрих → Лаутербруннен → Мюррен → Алматы`.
   - Country filter tabs (`Все 6 глав` | `🇮🇹 Италия` | `🇫🇷 Франция` | `🇨🇭 Швейцария`) so visitors can browse smoothly or jump by country.
   - **6 rich chapters covering all 8 destinations from the user's brief:**
     1. **Милан** *(Италия · Глава I · самолёт)* — Дуомо, Галерея Витторио Эмануэле II, Starbucks Reserve Roastery, квартал Брера.
     2. **Венеция** *(Италия · Глава II · поезд)* — Гранд-канал, Площадь Сан-Марко, Мост Риальто, Чикетти у канала.
     3. **Рим и Ватикан** *(Италия · Глава III · поезд)* — Колизей, Ватикан и Собор Святого Петра, Фонтан Треви, Пантеон, ужин в Трастевере.
     4. **Париж** *(Франция · Глава IV · самолёт)* — Эйфелева башня на закате, Лувр, Монмартр, набережные Сены и кафе-террасы.
     5. **Базель и Цюрих** *(Швейцария · Глава V · поезд)* — Набережная Рейна и Старый Базель, Озеро Цюрих, Альтштадт, Lindt Home of Chocolate.
     6. **Швейцарские Альпы: Лаутербруннен и Мюррен** *(Швейцария · Глава VI · горный поезд — special editorial spotlight styling!)* — Долина 72 водопадов (Штауббах), высокогорная деревня Мюррен без машин (1 650 м), панорама Юнгфрау, альпийский вечер.
   - Each chapter uses clean light editorial cards (sharp `3:4` and `4:3` rounded photos, location tag in `--gold-deep`, title, concise caption, optional `Все / Места / Атмосфера` filter chips).
5. **Живые кадры наших туристов (`#moments`):**
   - Dedicated light-editorial showcase of all **8 real customer collages** from `web/public/media/moments/`:
     - `venice.jpg` (Венеция), `milan.jpg` (Милан), `rome.jpg` (Рим), `vatican.jpg` (Ватикан), `paris.jpg` (Париж), `zurich.jpg` (Цюрих), `swiss-alps.jpg` (Швейцария · Альпы), `barcelona.jpg` (Барселона · прошлые евротуры).
   - Responsive `9:16` editorial cards (4-col desktop grid / swipeable horizontal snap rail on mobile) with subtle bottom gradient label and **click-to-zoom lightbox `<dialog>`** so users can inspect every photo full-screen.
6. **Уровень отелей 3–4★ (`#hotels`):**
   - 3-column bento cards representing the accommodation vibe across the 3 countries (**Италия · 3–4★ в ритме города**, **Париж · уютный бутик-формат**, **Швейцария · стиль и альпийский комфорт**) — each with a main `4:3` photo and an **interactive 3-thumbnail switcher strip** (adapted cleanly from the reference concept).
7. **Что входит и что не входит (`#included`):**
   - Clean 2-column comparison cards with the **exact verbatim offer terms** from the user's Classic Eurotour brief:
     - **Что входит в стоимость (`✓` in `--alpine`):**
       1. Авиабилеты туда и обратно
       2. Трансферы между странами и городами по маршруту
       3. Индивидуальное сопровождение гида 24/7
       4. Полностью организованный авторский тур с готовой программой
       5. Проживание в отелях 3–4★
       6. Ручная кладь весом до 5–7 кг
       7. Полное визовое сопровождение
     - **Что не входит в стоимость (`✕` in `--danger`):**
       1. Питание
       2. Личные и карманные расходы
       3. Консульский сбор — 90 €
       4. Дополнительный багаж
       5. Туристический налог в каждом отеле
       6. Местный транспорт: метро, автобусы, такси и другие виды городского транспорта
8. **Почему ARALA: 6 причин + Основатели (`#why`):**
   - 3×2 numbered bento grid (`01`–`06`) using the **exact 6 reasons** from the user's Eurotour text:
     1. **Полная организация путешествия** — Мы берём на себя всю организацию тура: авиаперелёты, визовое сопровождение, трансферы, бронирование отелей и готовую программу путешествия. Вам остаётся только наслаждаться Европой и новыми впечатлениями!
     2. **Турлидер рядом 24/7** — На протяжении всего путешествия с вами будет турлидер. Поможет с организационными вопросами, подскажет красивые места для фотографий, поможет снять контент и обеспечит сопровождение в каждой стране.
     3. **Атмосфера «своих людей»** — Путешествие в компании единомышленников, новые знакомства, искренние эмоции и яркие воспоминания. Мы собираем авторскую группу, чтобы каждый участник чувствовал себя комфортно.
     4. **Три страны за одно путешествие** — Италия, Франция и Швейцария — три совершенно разные атмосферы, архитектура, культура и природа. За одну поездку вы сможете увидеть всё это!
     5. **Особенная Швейцария** — Мы не ограничиваемся одним Цюрихом! В нашей программе — Базель, Лаутербруннен и Мюррен. Вас ждут Альпы, водопады, горные пейзажи и невероятная красота швейцарской природы.
     6. **Не просто тур, а впечатления на всю жизнь** — Мы хотим, чтобы вы не просто посетили новые страны, а почувствовали их атмосферу, сделали красивые фотографии, познакомились с интересными людьми и вернулись домой с историями, которые захочется рассказывать снова и снова!
   - Below it: a warm-accent dark-ink **Founders Card** introducing **Ернұр и Қайрат** (`3+ года живём в Европе · +200 счастливых туристов · +100 виз · говорим на местных языках, знаем скрытые локации, помогаем с шопингом, контентом и любым вопросом 24/7`).
9. **Другие направления ARALA + Визовый гайд (`#more`):**
   - 3 compact cards:
     - **Рождественский Евротур** (6 стран · 9 дней · декабрь · от 1 190 000 ₸ → WhatsApp pre-filled inquiry)
     - **Америка Тур** (12 дней · главные города и штаты США · 2 490 000 ₸ → WhatsApp pre-filled inquiry)
     - **Виза во все страны + индивидуальный маршрут** (от 150 000 ₸ → WhatsApp `+7 777 205 7252`)
   - Clean horizontal banner for the **Закрытый визовый гайд** (`/guide`): *"Шенген, пакет документов, подача в Италию и чек-лист сборов — открываем доступ в личном кабинете сразу после оплаты тура."* with button `Открыть гайд`.
10. **Записаться в группу (`#book`) + Reusable Booking Modal (`<app-booking-modal />`):**
    - Inline split section on `#book`: left editorial callout + instant WhatsApp & Instagram buttons; right clean light form (`Имя`, `Телефон`, `Telegram`, `Удобные даты` dropdown, `Комментарий`).
    - Same form available inside a clean native `<dialog>` booking modal triggered from Hero CTA, Header `Записаться`, and any of the 4 Date cards (auto-selecting that wave!).
    - On submission: sends lead to `POST /api/leads` (packing selected date into `message` so backend schema stays 100% compatible with Go SQLite & Vercel API without breaking changes!) and shows a clear confirmation state with a 1-click **"Дублировать в WhatsApp"** button pre-filled with the guest's name & selected dates.

### 5.5 F1 Jet Tracker-Inspired Route Map (`web/src/app/journey/journey-map.*`)

Rebuilt as a signature dark cockpit card (`border-radius: 28px`, `#080D18` surface) embedded cleanly inside the light `#FAF9F6` page:

- **Base Map:** Leaflet with CartoDB DarkMatter No-Labels (`https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png`), tuned CSS contrast (`brightness(1.06) contrast(1.08)`), subtle radar/coordinate vignette, and custom crisp Leaflet divIcon markers for cities, hubs, and faint ambient European country labels (`ITALY`, `FRANCE`, `SWITZERLAND`, `TURKEY`, `KAZAKHSTAN`).
- **Route Legs (10 realistic legs matching the full Classic Eurotour):**
  0. `ALA` Алматы → `IST` Стамбул (`plane`, ~4 120 km, 5h 40m, cruise 11 000 m, 840 km/h)
  1. `IST` Стамбул → `MXP` Милан (`plane`, ~1 670 km, 2h 55m, cruise 10 800 m, 810 km/h)
  2. `MXP` Милан → `VCE` Венеция (`train` Frecciarossa, ~270 km, 2h 25m, elev 120→5 m, 245 km/h)
  3. `VCE` Венеция → `FCO` Рим · Ватикан (`train` Frecciarossa, ~530 km, 3h 55m, elev 5→220→35 m, 290 km/h)
  4. `FCO` Рим → `CDG` Париж (`plane`, ~1 110 km, 2h 10m, cruise 10 400 m, 790 km/h)
  5. `CDG` Париж → `BSL` Базель (`train` TGV Lyria, ~510 km, 3h 05m, elev 35→260 m, 300 km/h)
  6. `BSL` Базель → `ZRH` Цюрих (`train` SBB InterCity, ~87 km, 0h 55m, elev 260→408 m, 155 km/h)
  7. `ZRH` Цюрих → `LBR` Лаутербруннен · Мюррен (`train` Alpine Rail + Cable Car, ~135 km, 2h 15m, elev 408→1 650 m, 85 km/h)
  8. `LBR` Мюррен → `ZRH` Цюрих (`train`, ~135 km, 2h 15m, elev 1 650→408 m, 85 km/h)
  9. `ZRH` Цюрих → `ALA` Алматы *(через Стамбул — 2 smooth connected return flight beats: `ZRH → IST` & `IST → ALA`)*
- **Top Telemetry Header Bar:**
  - Left: Origin code (`ALA`), flag, airport/station name.
  - Center: Animated progress track bar with moving plane/train badge, live elapsed leg time (`01h 18m`), and status pill (`● НА ЗЕМЛЕ` / `● В ПОЛЁТЕ` crimson pulse / `● ПОЕЗД` gold pulse / `● АЛЬПЫ` / `● ПРИБЫТИЕ`).
  - Right: Destination code (`MXP`), flag, airport/station name.
- **Dynamic F1 Camera Choreography:**
  - Instead of holding a static European bounding box for the whole trip, each leg uses **3-phase dynamic camera framing**:
    - Departure phase (`t: 0.0 → 0.16`): zoomed tightly on origin city (`zoom ~7.8–8.8` for European hops, `~6.0` for intercontinental) so you watch takeoff/departure like in the F1 video.
    - Cruise phase (`t: 0.16 → 0.80`): pulls back smoothly to fit the curved trajectory and surrounding countries (`zoom ~4.3–6.5`) while the glowing trail (`#F43F5E` crimson for flights, `#C8A86B` champagne for trains) draws smoothly behind the rotating craft icon.
    - Approach/Arrival phase (`t: 0.80 → 1.0`): zooms smoothly back into the destination city (`zoom ~8.0–9.0`) as altitude & speed drop to 0 and status switches to `● ПРИБЫТИЕ`.
  - Smooth throttled camera interpolation (`setView` / `flyTo` carefully coordinated without jank or tile flashing; `keepBuffer: 6`).
- **Bottom Live Telemetry Dashboard:**
  - 4 tabular-nums metric blocks: `ДИСТАНЦИЯ` (cumulative / leg km), `ВЫСОТА` (live climbing/cruising/descending meters — or Alpine climb to `1 650 м`!), `СКОРОСТЬ` (live km/h), and `ЭТАП` (mode + city story caption).
  - **Live SVG Telemetry Chart** (`viewBox="0 0 600 68"`): renders the live altitude/elevation curve (luminous crimson stroke + subtle gradient fill) and secondary speed profile (subtle white/gold dashed curve) drawing from left to right in sync with leg progress!
- **Interactive Controls:**
  - Play / Pause toggle, Replay button, and a sleek scrollable strip of **clickable route chips** (`Алматы`, `Милан`, `Венеция`, `Рим`, `Париж`, `Базель`, `Цюрих`, `Альпы`, `Домой`) allowing users to jump straight to any segment at any time; after completion, map dragging unlocks for free exploration.

### 5.6 Secondary Pages & Backend Updates
- **Frontend Pages (`/login`, `/guide`, `/guide/:slug`, `/admin`):**
  - Restyle all 4 pages using the new CSS custom properties (`--bg`, `--surface`, `--text`, `--ruby`, `--gold`, `--border`, `--r-lg`) so the entire application shares one cohesive light editorial identity.
  - Update `web/src/app/core/auth.ts` and `auth.interceptor.ts` to store tokens under `arala_token` while checking `itour_token` as fallback on restore so existing logged-in browsers don't break abruptly.
- **Gated Visa Guide Markdown Sync (10 files: `web/api/content/*.md` and `server/content/guides/*.md`):**
  - Update all 5 guides identically across both directories to align with the new ARALA Classic Eurotour without inventing embassy policy:
    - Entry/primary Schengen country remains **Италия** (first stop **Милан**, plus Венеция and Рим/Ватикан — 3 Italian cities).
    - Update route references from old 5-city Rome-start (`Рим → Венеция → Париж → Цюрих → Лаутербруннен`) to the new 8-destination route (`Милан → Венеция → Рим (Ватикан) → Париж → Базель → Цюрих → Лаутербруннен и Мюррен`).
    - Reflect consular fee `90 €`, free ARALA visa accompaniment, hand-luggage norm (`ручная кладь до 5–7 кг включена, доп. багаж отдельно`), and seasonal Jan–May layering advice for Alps/Mürren (`1 650 м`).
- **Backend Persistence Scope (Builder Call):**
  - Keep the existing lightweight deployment topology intact (Go + SQLite in `server/`, stateless/in-memory Vercel serverless in `web/api/_lib.js`) without introducing paid external databases in this redesign pass.
  - Because Vercel serverless isolates function memory across cold starts, the frontend booking flow submits to `POST /api/leads` (working end-to-end with Go+SQLite locally/on persistent hosts) **and** immediately gives the guest a 1-click pre-filled WhatsApp handoff (`+7 706 608 9508`) so no live lead is ever lost. (If ARALA later wants production persistent `/admin` accounts on Vercel, migrating `web/api/_lib.js` to Turso/Postgres or proxying `/api/*` to a persistent host is a clean follow-up task.)
- **API & Metadata Rebrand:**
  - `web/api/_lib.js`: update seeded accounts to use environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`) without hardcoded production credentials.
  - `server/internal/store/store.go`: seed admin only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars are provided.
  - `server/cmd/api/main.go`: update log banner to `ARALA API on %s` and default SQLite filename to `arala.db`.
  - `server/internal/httpserver/server.go`: update `/api/tour` metadata to return ARALA's new Eurotour name, Instagram (`https://www.instagram.com/arala.tours/`), WhatsApp (`https://wa.me/77066089508`), and 8-destination route.
  - `web/vercel.json`, `render.yaml`, `README.md`: update project names (`arala-tours`, `arala-api`) and documentation credentials/descriptions.

---

## 6. What's Left to the Builder

- Exact Unsplash photo IDs for Milan, Basel, and hotel comfort tier cards (using verified high-resolution architectural/landscape photos with `referrerpolicy="no-referrer"` and clean CSS gradient fallbacks).
- Exact Leaflet cubic easing constants and camera zoom tuning per leg to guarantee silky 60fps smoothness without tile flicker on desktop and mobile.
- Component breakdown inside `web/src/app/` (e.g., splitting `booking-modal`, `arala-logo`, `moments-gallery`, `hotel-showcase`, `city-chapter`, `journey-map`) so every component stays crisp, readable, and well under Angular's `16kB` per-component stylesheet warning budget.
- Exact SVG path geometry for the ARALA mountain-road-plane logo and favicon exports.

---

## 7. Builder Calls Made (For User Review)

1. **Primary Language = Russian** (with authentic Kazakh captions preserved naturally on the 8 real traveler photos). Adding a full `RU / KZ` switcher can be done if requested before planning.
2. **Primary WhatsApp = `+7 706 608 9508`** for tour bookings (matching ARALA's Taplink primary tour CTA), and **`+7 777 205 7252`** for the Visa / Custom Route card (matching Taplink's visa CTA).
3. **Keep & Restyle `/guide`, `/login`, `/admin`:** Preserve the paid-traveler visa guide and admin panel, fully restyled in the new light ARALA aesthetic, with leads from both the inline form and booking modal stored in `/admin` plus optional 1-click WhatsApp handoff.
4. **Seeded Demo Credentials:** Removed hardcoded demo credentials in favor of environment-only configuration (and later removed `/admin` and `/login` routes while bookings go straight to WhatsApp).
5. **Other ARALA Offerings:** Placed cleanly as a compact 3-card strip near the bottom (*Рождественский Евротур*, *Америка Тур*, *Виза + индивидуальный маршрут от 150 000 ₸*) so the Classic Eurotour stays the undisputed hero while showcasing ARALA's full brand breadth.
6. **Gated Guide Markdown Updates:** Synchronize all 5 guide `.md` files in both `web/api/content/` and `server/content/guides/` to reflect the Milan-first 8-city route, `90 €` consular fee, `5–7 кг` hand-luggage norm, and Jan–May Alpine packing (keeping Italy as main Schengen consulate).
7. **Backend Persistence Topology:** Keep existing Go+SQLite + Vercel serverless setup without adding paid/external DBs in this pass; guarantee zero lost leads via dual submission (`POST /api/leads` + immediate pre-filled WhatsApp handoff).
