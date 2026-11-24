export type PlaceKind = 'sight' | 'food';
export type TransitMode = 'plane' | 'train';
export type CountryFilter = 'all' | 'italy' | 'france' | 'switzerland';

export interface TourWave {
  id: string;
  dates: string;
  duration: string;
  price: string;
  tag?: string;
}

export interface Place {
  title: string;
  kind: PlaceKind;
  image: string;
  caption: string;
  location: string;
}

export interface CityPoint {
  id: string;
  code: string;
  flag: string;
  name: string;
  airport: string;
  country: string;
  lon: number;
  lat: number;
  hub?: boolean;
}

export interface Chapter {
  id: string;
  countryKey: Exclude<CountryFilter, 'all'>;
  country: string;
  flag: string;
  kicker: string;
  title: string;
  subtitle: string;
  story: string;
  featured?: boolean;
  places: Place[];
}

export interface Leg {
  id: string;
  from: string;
  to: string;
  mode: TransitMode;
  alpine?: boolean;
  label: string;
  chipLabel: string;
  carrier: string;
  story: string;
  distanceKm: number;
  durationMin: number;
  maxAltitudeM: number;
  startElevM: number;
  peakElevM: number;
  endElevM: number;
  maxSpeedKmh: number;
  overviewZoom: number;
  ms: number;
}

export interface MomentPhoto {
  id: string;
  city: string;
  tag: string;
  image: string;
  caption: string;
}

export interface HotelTier {
  id: string;
  country: string;
  flag: string;
  title: string;
  stars: string;
  description: string;
  photos: { url: string; label: string }[];
}

export interface Advantage {
  num: string;
  title: string;
  text: string;
}

export interface OtherOffering {
  id: string;
  tag: string;
  title: string;
  meta: string;
  price: string;
  description: string;
  phone: string;
  waText: string;
}

const img = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;

export const INSTAGRAM = 'https://www.instagram.com/arala.tours/';
export const WHATSAPP_TOURS = '77066089508';
export const WHATSAPP_VISA = '77772057252';

export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const HERO_IMAGE = img('photo-1530122037265-a5f1f91d3b99', 1800);
export const HERO_SECONDARY_IMAGE = img('photo-1502602898657-3e91760cbb34', 1200);

export const ROUTE_SUMMARY =
  'Алматы → Милан → Венеция → Рим (Ватикан) → Париж → Базель → Цюрих → Лаутербруннен → Мюррен → Алматы';

export const TOUR_WAVES: TourWave[] = [
  {
    id: 'jan',
    dates: '21–29 января',
    duration: '9 дней / 8 ночей',
    price: '1 190 000 ₸',
    tag: 'Зимняя сказка',
  },
  {
    id: 'mar',
    dates: '4–13 марта',
    duration: '10 дней / 9 ночей',
    price: '1 190 000 ₸',
    tag: 'Выгодный тариф',
  },
  {
    id: 'apr',
    dates: '14–22 апреля',
    duration: '9 дней / 8 ночей',
    price: '1 230 000 ₸',
    tag: 'Весенний Париж',
  },
  {
    id: 'may',
    dates: '5–15 мая',
    duration: '11 дней / 10 ночей',
    price: '1 250 000 ₸',
    tag: 'Максимум дней',
  },
];

export const CITIES: CityPoint[] = [
  {
    id: 'almaty',
    code: 'ALA',
    flag: '🇰🇿',
    name: 'Алматы',
    airport: 'Almaty Int’l',
    country: 'Казахстан',
    lon: 76.94,
    lat: 43.35,
  },
  {
    id: 'istanbul',
    code: 'IST',
    flag: '🇹🇷',
    name: 'Стамбул',
    airport: 'Istanbul Hub',
    country: 'Турция',
    lon: 28.75,
    lat: 41.27,
    hub: true,
  },
  {
    id: 'milan',
    code: 'MXP',
    flag: '🇮🇹',
    name: 'Милан',
    airport: 'Milano Malpensa',
    country: 'Италия',
    lon: 9.19,
    lat: 45.46,
  },
  {
    id: 'venice',
    code: 'VCE',
    flag: '🇮🇹',
    name: 'Венеция',
    airport: 'Santa Lucia',
    country: 'Италия',
    lon: 12.32,
    lat: 45.44,
  },
  {
    id: 'rome',
    code: 'FCO',
    flag: '🇮🇹',
    name: 'Рим · Ватикан',
    airport: 'Roma Termini / FCO',
    country: 'Италия',
    lon: 12.49,
    lat: 41.9,
  },
  {
    id: 'paris',
    code: 'CDG',
    flag: '🇫🇷',
    name: 'Париж',
    airport: 'Paris Charles de Gaulle',
    country: 'Франция',
    lon: 2.35,
    lat: 48.86,
  },
  {
    id: 'basel',
    code: 'BSL',
    flag: '🇨🇭',
    name: 'Базель',
    airport: 'Basel SBB',
    country: 'Швейцария',
    lon: 7.59,
    lat: 47.55,
  },
  {
    id: 'zurich',
    code: 'ZRH',
    flag: '🇨🇭',
    name: 'Цюрих',
    airport: 'Zürich HB / ZRH',
    country: 'Швейцария',
    lon: 8.54,
    lat: 47.37,
  },
  {
    id: 'lauterbrunnen',
    code: 'LBR',
    flag: '🇨🇭',
    name: 'Лаутербруннен · Мюррен',
    airport: 'Swiss Alps · 1 650 м',
    country: 'Швейцария',
    lon: 7.9,
    lat: 46.59,
  },
];

export const LEGS: Leg[] = [
  {
    id: 'ala-ist',
    from: 'almaty',
    to: 'istanbul',
    mode: 'plane',
    label: 'Алматы → Стамбул',
    chipLabel: 'Алматы',
    carrier: 'Международный рейс · стыковка',
    story: 'Взлёт из Алматы, курс на запад над Каспием — стартуем наш авторский Евротур.',
    distanceKm: 3920,
    durationMin: 350,
    maxAltitudeM: 11200,
    startElevM: 681,
    peakElevM: 11200,
    endElevM: 99,
    maxSpeedKmh: 845,
    overviewZoom: 4.1,
    ms: 4200,
  },
  {
    id: 'ist-mxp',
    from: 'istanbul',
    to: 'milan',
    mode: 'plane',
    label: 'Стамбул → Милан',
    chipLabel: 'Милан',
    carrier: 'Перелёт в Италию',
    story: 'Приземляемся в столице моды: Дуомо, Галерея Витторио Эмануэле II и первый эспрессо.',
    distanceKm: 1680,
    durationMin: 175,
    maxAltitudeM: 10800,
    startElevM: 99,
    peakElevM: 10800,
    endElevM: 234,
    maxSpeedKmh: 815,
    overviewZoom: 4.9,
    ms: 3600,
  },
  {
    id: 'mxp-vce',
    from: 'milan',
    to: 'venice',
    mode: 'train',
    label: 'Милан → Венеция',
    chipLabel: 'Венеция',
    carrier: 'Frecciarossa · скоростной поезд',
    story: 'Через Северную Италию прямо к воде: Гранд-канал, гондолы и площадь Сан-Марко.',
    distanceKm: 270,
    durationMin: 145,
    maxAltitudeM: 280,
    startElevM: 122,
    peakElevM: 165,
    endElevM: 2,
    maxSpeedKmh: 250,
    overviewZoom: 6.5,
    ms: 3000,
  },
  {
    id: 'vce-fco',
    from: 'venice',
    to: 'rome',
    mode: 'train',
    label: 'Венеция → Рим · Ватикан',
    chipLabel: 'Рим',
    carrier: 'Frecciarossa · 290 км/ч',
    story: 'На юг в Вечный город: Колизей, Собор Святого Петра, Фонтан Треви и римская пицца.',
    distanceKm: 530,
    durationMin: 235,
    maxAltitudeM: 420,
    startElevM: 2,
    peakElevM: 340,
    endElevM: 37,
    maxSpeedKmh: 295,
    overviewZoom: 6.0,
    ms: 3200,
  },
  {
    id: 'fco-cdg',
    from: 'rome',
    to: 'paris',
    mode: 'plane',
    label: 'Рим → Париж',
    chipLabel: 'Париж',
    carrier: 'Прямой перелёт над Альпами',
    story: 'Два часа в небе — и мы у Эйфелевой башни, Лувра и вечерних огней Сены.',
    distanceKm: 1110,
    durationMin: 130,
    maxAltitudeM: 10400,
    startElevM: 37,
    peakElevM: 10400,
    endElevM: 119,
    maxSpeedKmh: 790,
    overviewZoom: 5.4,
    ms: 3600,
  },
  {
    id: 'cdg-bsl',
    from: 'paris',
    to: 'basel',
    mode: 'train',
    label: 'Париж → Базель',
    chipLabel: 'Базель',
    carrier: 'TGV Lyria · 300 км/ч',
    story: 'Скоростным поездом из Франции на границу трёх стран — уютный Базель на Рейне.',
    distanceKm: 510,
    durationMin: 185,
    maxAltitudeM: 420,
    startElevM: 35,
    peakElevM: 380,
    endElevM: 260,
    maxSpeedKmh: 300,
    overviewZoom: 6.1,
    ms: 3000,
  },
  {
    id: 'bsl-zrh',
    from: 'basel',
    to: 'zurich',
    mode: 'train',
    label: 'Базель → Цюрих',
    chipLabel: 'Цюрих',
    carrier: 'SBB InterCity · Швейцария',
    story: 'Швейцарская точность: озеро, старый город, шоколадная фабрика Lindt и атмосфера спокойствия.',
    distanceKm: 88,
    durationMin: 55,
    maxAltitudeM: 520,
    startElevM: 260,
    peakElevM: 460,
    endElevM: 408,
    maxSpeedKmh: 160,
    overviewZoom: 7.4,
    ms: 2500,
  },
  {
    id: 'zrh-lbr',
    from: 'zurich',
    to: 'lauterbrunnen',
    mode: 'train',
    alpine: true,
    label: 'Цюрих → Лаутербруннен · Мюррен',
    chipLabel: 'Альпы 1650м',
    carrier: 'Панорамный поезд + канатная дорога',
    story: 'Сердце тура: долина 72 водопадов и высокогорная деревушка Мюррен без машин на 1 650 м.',
    distanceKm: 135,
    durationMin: 135,
    maxAltitudeM: 1650,
    startElevM: 408,
    peakElevM: 1220,
    endElevM: 1650,
    maxSpeedKmh: 95,
    overviewZoom: 7.2,
    ms: 3400,
  },
  {
    id: 'lbr-zrh',
    from: 'lauterbrunnen',
    to: 'zurich',
    mode: 'train',
    label: 'Альпы → Цюрих',
    chipLabel: 'Вылет',
    carrier: 'Спуск к аэропорту Цюриха',
    story: 'Прощальный взгляд на снежные вершины и возвращаемся в Цюрих на рейс домой.',
    distanceKm: 135,
    durationMin: 135,
    maxAltitudeM: 1650,
    startElevM: 1650,
    peakElevM: 1120,
    endElevM: 432,
    maxSpeedKmh: 95,
    overviewZoom: 7.2,
    ms: 2300,
  },
  {
    id: 'zrh-ist',
    from: 'zurich',
    to: 'istanbul',
    mode: 'plane',
    label: 'Цюрих → Стамбул',
    chipLabel: 'Стыковка',
    carrier: 'Обратный рейс · стыковка',
    story: 'Перелёт на восток с сотнями живых кадров и историями на всю жизнь.',
    distanceKm: 1760,
    durationMin: 175,
    maxAltitudeM: 11000,
    startElevM: 432,
    peakElevM: 11000,
    endElevM: 99,
    maxSpeedKmh: 840,
    overviewZoom: 4.8,
    ms: 3200,
  },
  {
    id: 'ist-ala',
    from: 'istanbul',
    to: 'almaty',
    mode: 'plane',
    label: 'Стамбул → Алматы',
    chipLabel: 'Домой',
    carrier: 'Возвращение в Казахстан',
    story: 'Ночной борт домой — приземляемся в Алматы уже одной компанией «своих людей».',
    distanceKm: 3920,
    durationMin: 340,
    maxAltitudeM: 11200,
    startElevM: 99,
    peakElevM: 11200,
    endElevM: 681,
    maxSpeedKmh: 855,
    overviewZoom: 4.1,
    ms: 3800,
  },
];

export const CHAPTERS: Chapter[] = [
  {
    id: 'milan',
    countryKey: 'italy',
    country: 'Италия',
    flag: '🇮🇹',
    kicker: 'Глава I · старт в Италии',
    title: 'Милан',
    subtitle: 'Столица моды, мраморной готики и идеального первого утра в Европе',
    story:
      'Здесь начинается наш европейский ритм: шпили Дуомо, стеклянный купол Галереи Витторио Эмануэле II, кофейный театр Starbucks Reserve и улочки квартала Брера.',
    places: [
      {
        title: 'Миланский собор Дуомо',
        kind: 'sight',
        location: 'Piazza del Duomo',
        image: img('photo-1610016302534-6f67f1c968d8'),
        caption: 'Белоснежная готика и террасы на крыше — тот самый первый кадр, от которого перехватывает дыхание.',
      },
      {
        title: 'Галерея Витторио Эмануэле II',
        kind: 'sight',
        location: 'Centro Storico',
        image: img('photo-1513581166391-887a96ddeafd'),
        caption: 'Старейший пассаж Европы, мозаичный пол и витрины высокой моды под стеклянным небом.',
      },
      {
        title: 'Аперитив и кофейни Милана',
        kind: 'food',
        location: 'Brera & Cordusio',
        image: img('photo-1495474472287-4d71bcdd2085'),
        caption: 'Знаменитый Starbucks Reserve Roastery и вечерний аперитив, когда вся группа знакомится за одним столом.',
      },
    ],
  },
  {
    id: 'venice',
    countryKey: 'italy',
    country: 'Италия',
    flag: '🇮🇹',
    kicker: 'Глава II · скоростной поезд',
    title: 'Венеция',
    subtitle: 'Город без машин, где улицы — это каналы, а фасады отражаются в воде',
    story:
      'Переезжаем на поезде Frecciarossa — и попадаем в декорации открытки. Гранд-канал, гондолы на закате, площадь Сан-Марко и уютные переулки вдали от толп.',
    places: [
      {
        title: 'Гранд-канал и гондолы',
        kind: 'sight',
        location: 'Canal Grande',
        image: img('photo-1523906834658-6e24ef2386f9'),
        caption: 'Палаццо прямо над водой и прогулка по каналам в мягком вечернем свете.',
      },
      {
        title: 'Площадь Сан-Марко',
        kind: 'sight',
        location: 'Piazza San Marco',
        image: img('photo-1514890547357-a9ee288728e0'),
        caption: 'Базилика, живая музыка оркестров на террасах и парадная классика Венеции.',
      },
      {
        title: 'Чикетти и террасы на воде',
        kind: 'food',
        location: 'San Polo',
        image: img('photo-1533777857889-4be7c70b33f7'),
        caption: 'Местные закуски у стойки и неспешные посиделки у канала — показываем места, где едят сами итальянцы.',
      },
    ],
  },
  {
    id: 'rome',
    countryKey: 'italy',
    country: 'Италия',
    flag: '🇮🇹',
    kicker: 'Глава III · Вечный город + Ватикан',
    title: 'Рим и Ватикан',
    subtitle: 'Имперская история под ногами, шедевры Ватикана и лучшая пицца мира',
    story:
      'Колизей на закате, величие Собора Святого Петра в Ватикане, монетка в Фонтан Треви, Пантеон и живые ужины в Трастевере с настоящим римским джелато.',
    places: [
      {
        title: 'Колизей',
        kind: 'sight',
        location: 'Roma',
        image: img('photo-1552832230-c0197dd311b5'),
        caption: 'Тёплый свет вечерних арок — главный символ Италии, который вживую сильнее любых фото.',
      },
      {
        title: 'Ватикан и Собор Святого Петра',
        kind: 'sight',
        location: 'Città del Vaticano',
        image: img('photo-1531572753322-ad063cecc140'),
        caption: 'Купол Микеланджело, площадь Бернини и масштаб, который запоминается навсегда.',
      },
      {
        title: 'Фонтан Треви и Пантеон',
        kind: 'sight',
        location: 'Centro Storico',
        image: img('photo-1529260830199-42c24126f198'),
        caption: 'Барокко, античные купола и прогулки по узким улочкам Рима с лучшими точками для фото.',
      },
      {
        title: 'Трастевере, пицца и джелато',
        kind: 'food',
        location: 'Trastevere',
        image: img('photo-1414235077428-338989a2e8c0'),
        caption: 'Шоу пиццайоло, тёплые траттории и настоящая итальянская атмосфера без туристических ловушек.',
      },
    ],
  },
  {
    id: 'paris',
    countryKey: 'france',
    country: 'Франция',
    flag: '🇫🇷',
    kicker: 'Глава IV · перелёт во Францию',
    title: 'Париж',
    subtitle: 'Романтика бульваров, золотой закат у башни и огни ночной Сены',
    story:
      'Короткий перелёт меняет ритм и свет: пирамида Лувра, Эйфелева башня с лучших ракурсов Трокадеро и Марсова поля, Монмартр и атмосферные парижские террасы.',
    places: [
      {
        title: 'Эйфелева башня',
        kind: 'sight',
        location: 'Trocadéro & Champ de Mars',
        image: img('photo-1502602898657-3e91760cbb34'),
        caption: 'Золотой час и момент, когда башня начинает мерцать тысячами огней.',
      },
      {
        title: 'Лувр и сад Тюильри',
        kind: 'sight',
        location: '1er arrondissement',
        image: img('photo-1499856871958-5b9627545d1a'),
        caption: 'Стеклянная пирамида, королевский двор и культовые кадры в самом сердце Парижа.',
      },
      {
        title: 'Парижские террасы и набережные',
        kind: 'food',
        location: 'Saint-Germain & Seine',
        image: img('photo-1517248135467-4c7edcad34c4'),
        caption: 'Круассан утром, уютное бистро вечером и вечерняя прогулка вдоль освещённых мостов.',
      },
    ],
  },
  {
    id: 'basel-zurich',
    countryKey: 'switzerland',
    country: 'Швейцария',
    flag: '🇨🇭',
    kicker: 'Глава V · поезд в Швейцарию',
    title: 'Базель и Цюрих',
    subtitle: 'Швейцарская точность, архитектура на Рейне, озеро и мир шоколада',
    story:
      'Мы не ограничиваемся одним городом: сначала уютный Базель на стыке трёх границ, а затем Цюрих — кристальное озеро, Альтштадт и легендарный шоколадный дом Lindt.',
    places: [
      {
        title: 'Озеро Цюрих и Альтштадт',
        kind: 'sight',
        location: 'Zürichsee & Niederdorf',
        image: img('photo-1528722828814-77b9b83aafb2'),
        caption: 'Променад у воды, башни соборов, тихие улочки и безупречная швейцарская эстетика.',
      },
      {
        title: 'Базель и набережная Рейна',
        kind: 'sight',
        location: 'Basel Altstadt',
        image: img('photo-1467269204594-9661b134dd2b'),
        caption: 'Старый город с красной ратушей и атмосфера, которую редко включают в стандартные туры.',
      },
      {
        title: 'Lindt и швейцарская кухня',
        kind: 'food',
        location: 'Zürich',
        image: img('photo-1416453072034-c8dbfa2856b5'),
        caption: 'Шоколадный фонтан, сырные специалитеты и уютные кофейни перед подъёмом в Альпы.',
      },
    ],
  },
  {
    id: 'swiss-alps',
    countryKey: 'switzerland',
    country: 'Швейцария',
    flag: '🇨🇭',
    kicker: 'Глава VI · особенная часть маршрута',
    title: 'Лаутербруннен и Мюррен',
    subtitle: 'Полноценная программа в Швейцарских Альпах: 72 водопада, скалы и деревня в облаках',
    story:
      'Главная гордость маршрута ARALA — мы едем вглубь Альп. Изумрудная долина Лаутербруннен с падающим со скалы водопадом Штауббах и сказочная деревушка Мюррен без машин на высоте 1 650 м.',
    featured: true,
    places: [
      {
        title: 'Долина 72 водопадов',
        kind: 'sight',
        location: 'Lauterbrunnen',
        image: img('photo-1530122037265-a5f1f91d3b99'),
        caption: 'Отвесные скалы, шале и водопад Штауббах — пейзаж, который кажется нереальным.',
      },
      {
        title: 'Высокогорная деревня Мюррен',
        kind: 'sight',
        location: 'Mürren · 1 650 м',
        image: img('photo-1506905925346-21bda4d32df4'),
        caption: 'Деревня без автомобилей прямо напротив вершин Айгер, Мёнх и Юнгфрау.',
      },
      {
        title: 'Панорамы региона Юнгфрау',
        kind: 'sight',
        location: 'Bernese Oberland',
        image: img('photo-1464822759023-fed622ff2c3b'),
        caption: 'Кристальный горный воздух, красные альпийские поезда и кадры уровня National Geographic.',
      },
      {
        title: 'Ужин в альпийском шале',
        kind: 'food',
        location: 'Lauterbrunnen Valley',
        image: img('photo-1470770841072-f978cf4d019e'),
        caption: 'Фондю, раклет и тёплый финальный вечер всей компанией с видом на горы.',
      },
    ],
  },
];

export const MOMENTS: MomentPhoto[] = [
  {
    id: 'milan',
    city: 'Милан',
    tag: 'Италия',
    image: '/media/moments/milan.jpg',
    caption: 'Наша группа у собора Дуомо и утренний кофе в Starbucks Reserve',
  },
  {
    id: 'venice',
    city: 'Венеция',
    tag: 'Италия',
    image: '/media/moments/venice.jpg',
    caption: 'Прогулки на гондолах, мосты и вечерние каналы вместе с туристами ARALA',
  },
  {
    id: 'rome',
    city: 'Рим',
    tag: 'Италия',
    image: '/media/moments/rome.jpg',
    caption: 'Вечерний Колизей, шоу-пицца и настоящее итальянское джелато',
  },
  {
    id: 'vatican',
    city: 'Ватикан',
    tag: 'Италия',
    image: '/media/moments/vatican.jpg',
    caption: 'Собор Святого Петра и площадь Бернини глазами участников тура',
  },
  {
    id: 'paris',
    city: 'Париж',
    tag: 'Франция',
    image: '/media/moments/paris.jpg',
    caption: 'Закат у Эйфелевой башни, Лувр и вечерняя романтика Парижа',
  },
  {
    id: 'zurich',
    city: 'Цюрих',
    tag: 'Швейцария',
    image: '/media/moments/zurich.jpg',
    caption: 'Старый Цюрих, мастер-шоколатье Lindt и прогулки у реки Лиммат',
  },
  {
    id: 'swiss-alps',
    city: 'Швейцарские Альпы',
    tag: 'Лаутербруннен · Мюррен',
    image: '/media/moments/swiss-alps.jpg',
    caption: 'Красные горные поезда, Лаутербруннен и облака над Мюрреном',
  },
  {
    id: 'barcelona',
    city: 'Барселона',
    tag: 'Из прошлых евротуров',
    image: '/media/moments/barcelona.jpg',
    caption: 'Саграда Фамилия и живые эмоции из наших расширенных европейских заездов',
  },
];

export const HOTEL_TIERS: HotelTier[] = [
  {
    id: 'italy-hotels',
    country: 'Италия',
    flag: '🇮🇹',
    title: 'Городские отели 3–4★',
    stars: 'Милан · Венеция · Рим',
    description:
      'Выбираем проверенные отели с удобной логистикой до центра и вокзалов, чтобы больше времени оставалось на город, а не на дорогу.',
    photos: [
      { url: img('photo-1618773928121-c32242e63f39', 1000), label: 'Светлый номер 4★' },
      { url: img('photo-1590490360182-c33d57733427', 1000), label: 'Уютная спальня' },
      { url: img('photo-1582719478250-c89cae4dc85b', 1000), label: 'Зона отдыха и лобби' },
    ],
  },
  {
    id: 'france-hotels',
    country: 'Франция',
    flag: '🇫🇷',
    title: 'Парижский бутик-комфорт',
    stars: 'Париж · 3–4★',
    description:
      'Стильные аккуратные номера в спокойных районах рядом с метро — приятно вернуться после насыщенного дня у Лувра и Сены.',
    photos: [
      { url: img('photo-1566665797739-1674de7a421a', 1000), label: 'Бутик-интерьер' },
      { url: img('photo-1631049307264-da0ec9d70304', 1000), label: 'Комфорт после прогулок' },
      { url: img('photo-1551882547-ff40c63fe5fa', 1000), label: 'Атмосфера отеля' },
    ],
  },
  {
    id: 'swiss-hotels',
    country: 'Швейцария',
    flag: '🇨🇭',
    title: 'Швейцарский уют и Альпы',
    stars: 'Цюрих · Базель · Альпы',
    description:
      'Безупречная чистота, тишина и тёплый альпийский сервис — идеальный отдых после горных панорам Лаутербруннена и Мюррена.',
    photos: [
      { url: img('photo-1542314831-068cd1dbfeeb', 1000), label: 'Альпийский стиль' },
      { url: img('photo-1596394516093-501ba68a0ba6', 1000), label: 'Чистый дизайн номеров' },
      { url: img('photo-1578683010236-d716f9a3f461', 1000), label: 'Уют и тишина' },
    ],
  },
];

export const INCLUDED: string[] = [
  'Авиабилеты туда и обратно',
  'Трансферы между странами и городами по маршруту',
  'Индивидуальное сопровождение гида 24/7',
  'Полностью организованный авторский тур с готовой программой',
  'Проживание в отелях 3–4★',
  'Ручная кладь весом до 5–7 кг',
  'Полное визовое сопровождение',
];

export const EXCLUDED: string[] = [
  'Питание',
  'Личные и карманные расходы',
  'Консульский сбор — 90 €',
  'Дополнительный багаж',
  'Туристический налог в каждом отеле',
  'Местный транспорт: метро, автобусы, такси и другие виды городского транспорта',
];

export const ADVANTAGES: Advantage[] = [
  {
    num: '01',
    title: 'Полная организация путешествия',
    text: 'Мы берём на себя всю организацию тура: авиаперелёты, визовое сопровождение, трансферы, бронирование отелей и готовую программу путешествия. Вам остаётся только наслаждаться Европой и новыми впечатлениями!',
  },
  {
    num: '02',
    title: 'Турлидер рядом 24/7',
    text: 'На протяжении всего путешествия с вами будет турлидер. Поможет с организационными вопросами, подскажет красивые места для фотографий, поможет снять контент и обеспечит сопровождение в каждой стране.',
  },
  {
    num: '03',
    title: 'Атмосфера «своих людей»',
    text: 'Путешествие в компании единомышленников, новые знакомства, искренние эмоции и яркие воспоминания. Мы собираем авторскую группу, чтобы каждый участник чувствовал себя комфортно.',
  },
  {
    num: '04',
    title: 'Три страны за одно путешествие',
    text: 'Италия, Франция и Швейцария — три совершенно разные атмосферы, архитектура, культура и природа. За одну поездку вы сможете увидеть всё это!',
  },
  {
    num: '05',
    title: 'Особенная Швейцария',
    text: 'Мы не ограничиваемся одним Цюрихом! В нашей программе — Базель, Лаутербруннен и Мюррен. Вас ждут Альпы, водопады, горные пейзажи и невероятная красота швейцарской природы.',
  },
  {
    num: '06',
    title: 'Не просто тур, а впечатления на всю жизнь',
    text: 'Мы хотим, чтобы вы не просто посетили новые страны, а почувствовали их атмосферу, сделали красивые фотографии, познакомились с интересными людьми и вернулись домой с историями, которые захочется рассказывать снова и снова!',
  },
];

export const FOUNDERS = {
  names: 'Ернұр и Қайрат',
  role: 'Основатели и турлидеры ARALA',
  bio: 'Более 3 лет живём в Европе и свободно говорим на местных языках. Знаем нетуристические локации, проверенные рестораны, лучшие точки для контента и помогаем решить любой вопрос 24/7 — от шопинга до визы.',
  stats: [
    { value: '200+', label: 'счастливых туристов' },
    { value: '100+', label: 'одобренных виз' },
    { value: '3+ года', label: 'живём в Европе' },
  ],
};

export const OTHER_OFFERINGS: OtherOffering[] = [
  {
    id: 'christmas-euro',
    tag: 'Сезонный заезд · декабрь',
    title: 'Рождественский Евротур · 6 стран',
    meta: '9 дней · Милан, Цюрих, Альпы, Страсбург, Париж, Брюссель, Амстердам',
    price: 'от 1 190 000 ₸',
    description:
      'Главные рождественские ярмарки Европы, огни Парижа и Амстердама + бонус: бесплатное сопровождение на визу США после тура.',
    phone: WHATSAPP_TOURS,
    waText: 'Здравствуйте! Интересует Рождественский Евротур ARALA (6 стран). Расскажите подробнее о датах и местах.',
  },
  {
    id: 'america-tour',
    tag: 'США · авторская группа',
    title: 'Америка Тур · 12 дней',
    meta: 'Самые известные города и штаты США · бесплатная визовая поддержка',
    price: '2 490 000 ₸',
    description:
      'Большое путешествие по знаковым локациям Америки в компании команды ARALA с полным сопровождением и помощью по визе.',
    phone: WHATSAPP_TOURS,
    waText: 'Здравствуйте! Хочу узнать детали и ближайшие даты по туру Америка 12 дней (ARALA).',
  },
  {
    id: 'visa-custom',
    tag: 'Индивидуально · все страны',
    title: 'Виза + индивидуальный маршрут',
    meta: 'Шенген, США и другие страны · персональный план поездки',
    price: 'от 150 000 ₸',
    description:
      'Для тех, кто планирует путешествие самостоятельно: соберём сильный пакет документов на визу и продумаем маршрут по дням.',
    phone: WHATSAPP_VISA,
    waText: 'Здравствуйте! Нужна помощь с визой / индивидуальным маршрутом через ARALA.',
  },
];
