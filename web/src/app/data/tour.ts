export type PlaceKind = 'sight' | 'food';
export type TransitMode = 'plane' | 'train';

export interface Place {
  title: string;
  kind: PlaceKind;
  image: string;
  caption: string;
  location: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  kicker: string;
  story: string;
  lon: number;
  lat: number;
  places: Place[];
}

export interface Leg {
  from: string;
  to: string;
  mode: TransitMode;
  label: string;
}

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMAGE = img('photo-1530122037265-a5f1f91d3b99', 2400);
export const ALMATY_IMAGE = img('photo-1565008576549-57569a49371d', 1800);

export const CITIES: City[] = [
  {
    id: 'almaty',
    name: 'Алматы',
    country: 'Казахстан',
    kicker: 'Точка отправления',
    story: 'Рассвет над Тянь-Шанем. Чемодан, паспорт, и длинная дуга на запад — так начинается евротур.',
    lon: 76.89,
    lat: 43.24,
    places: [],
  },
  {
    id: 'istanbul',
    name: 'Стамбул',
    country: 'Турция',
    kicker: 'Пересадка',
    story: 'Стыковка. Кофе, коридор, снова борт — и дальше на запад или домой.',
    lon: 28.98,
    lat: 41.01,
    places: [],
  },
  {
    id: 'rome',
    name: 'Рим',
    country: 'Италия',
    kicker: 'Глава I · самолёт',
    story:
      'Камень, который помнит империю. Колизей на закате, Ватикан без спешки, Трастевере после десяти. Рим не фотографируют — в него входят.',
    lon: 12.5,
    lat: 41.9,
    places: [
      {
        title: 'Колизей',
        kind: 'sight',
        location: 'Roma',
        image: img('photo-1552832230-c0197dd311b5'),
        caption: 'Аркады в тёплом свете. Главный кадр, который все ждут — и он всё равно работает.',
      },
      {
        title: 'Ватикан',
        kind: 'sight',
        location: 'Città del Vaticano',
        image: img('photo-1531572753322-ad063cecc140'),
        caption: 'Собор Святого Петра и площадь Бернини. Плечи закрыты, глаза — открыты.',
      },
      {
        title: 'Фонтан Треви',
        kind: 'sight',
        location: 'Fontana di Trevi',
        image: img('photo-1529260830199-42c24126f198'),
        caption: 'Монета через плечо. Лучше на рассвете, пока город ещё не выстроился в очередь.',
      },
      {
        title: 'Пантеон',
        kind: 'sight',
        location: 'Piazza della Rotonda',
        image: img('photo-1662406427153-f9c18cf0a1c5'),
        caption: 'Окулус, дождь внутри храма, кофе на площади. Рим в одном кадре.',
      },
      {
        title: 'Da Enzo al 29',
        kind: 'food',
        location: 'Trastevere',
        image: img('photo-1414235077428-338989a2e8c0'),
        caption: 'Трастевере, бумажные скатерти, карбонара без спектакля. Как рилс, только съедобно.',
      },
      {
        title: 'Aperitivo на крыше',
        kind: 'food',
        location: 'Centro Storico',
        image: img('photo-1559339352-11d035aa65de'),
        caption: 'Неон бокала, купол на горизонте, золотой час. Атмосфера, ради которой летят.',
      },
    ],
  },
  {
    id: 'venice',
    name: 'Венеция',
    country: 'Италия',
    kicker: 'Глава II · поезд',
    story:
      'Из Рима на север — Frecciarossa, и через несколько часов город без машин. Каналы, цикетти, тишина после круизных толп.',
    lon: 12.32,
    lat: 45.44,
    places: [
      {
        title: 'Гранд-канал',
        kind: 'sight',
        location: 'Canal Grande',
        image: img('photo-1523906834658-6e24ef2386f9'),
        caption: 'Вапоретто вместо такси. Фасады, которые лучше смотрятся с воды.',
      },
      {
        title: 'Площадь Сан-Марко',
        kind: 'sight',
        location: 'Piazza San Marco',
        image: img('photo-1514890547357-a9ee288728e0'),
        caption: 'Базилика, кампанила, оркестры кафе. Венеция в парадном костюме.',
      },
      {
        title: 'Риальто',
        kind: 'sight',
        location: 'Ponte di Rialto',
        image: img('photo-1756399040276-7b986a6851e3'),
        caption: 'Мост, рынок, утренние рыбаки. Пока туристы ещё спят.',
      },
      {
        title: 'Cicchetti у стойки',
        kind: 'food',
        location: 'San Polo',
        image: img('photo-1533777857889-4be7c70b33f7'),
        caption: 'Бакалла, просекко, теснота остеррии. Венеция ест стоя — и это красиво.',
      },
      {
        title: 'Caffè Florian',
        kind: 'food',
        location: 'San Marco',
        image: img('photo-1570227923466-c86256715853'),
        caption: 'Старейшее кафе города. Дорого, театрально, один раз — надо.',
      },
    ],
  },
  {
    id: 'paris',
    name: 'Париж',
    country: 'Франция',
    kicker: 'Глава III · самолёт',
    story:
      'Короткий перелёт, и Италия сменяется другим светом. Набережные, кафе-террасы, башня, которая не надоедает, если смотреть с Трокадеро на закате.',
    lon: 2.35,
    lat: 48.86,
    places: [
      {
        title: 'Эйфелева башня',
        kind: 'sight',
        location: 'Trocadéro',
        image: img('photo-1502602898657-3e91760cbb34'),
        caption: 'Не с самой башни — на неё. Золотой час и первый вечерний блеск.',
      },
      {
        title: 'Лувр',
        kind: 'sight',
        location: '1er arrondissement',
        image: img('photo-1499856871958-5b9627545d1a'),
        caption: 'Пирамида, двор, не обязательно Мона Лиза. Париж как декорация.',
      },
      {
        title: 'Монмартр',
        kind: 'sight',
        location: 'Sacré-Cœur',
        image: img('photo-1757162381660-5fd3d391bcb4'),
        caption: 'Узкие улицы, белый купол, гитары на ступенях. Город сверху.',
      },
      {
        title: 'Café de Flore',
        kind: 'food',
        location: 'Saint-Germain',
        image: img('photo-1517248135467-4c7edcad34c4'),
        caption: 'Красные банкетки, кофе, люди, которые делают вид, что не позируют. Классика ленты.',
      },
      {
        title: 'Ужин у Сены',
        kind: 'food',
        location: 'Quai de la Tournelle',
        image: img('photo-1414235077428-338989a2e8c0'),
        caption: 'Вино, багет, огни мостов. Париж не объясняет — он светится.',
      },
    ],
  },
  {
    id: 'zurich',
    name: 'Цюрих',
    country: 'Швейцария',
    kicker: 'Глава IV · поезд',
    story:
      'TGV / ICE, и Франция складывается в точность Швейцарии. Озеро, старый город, витрины, от которых спокойно. Отсюда — в Альпы и домой.',
    lon: 8.54,
    lat: 47.37,
    places: [
      {
        title: 'Озеро Цюрих',
        kind: 'sight',
        location: 'Zürichsee',
        image: img('photo-1528722828814-77b9b83aafb2'),
        caption: 'Променад, лебеди, Альпы если повезёт с погодой. Город, который умеет молчать.',
      },
      {
        title: 'Альтштадт',
        kind: 'sight',
        location: 'Niederdorf',
        image: img('photo-1467269204594-9661b134dd2b'),
        caption: 'Узкие улицы, Grossmünster, витрины Sprüngli. Чистота как эстетика.',
      },
      {
        title: 'Kronenhalle',
        kind: 'food',
        location: 'Rämistrasse',
        image: img('photo-1416453072034-c8dbfa2856b5'),
        caption: 'Старый зал, искусство на стенах, швейцарская плотность вкуса.',
      },
      {
        title: 'Кофе у озера',
        kind: 'food',
        location: 'Bürkliplatz',
        image: img('photo-1495474472287-4d71bcdd2085'),
        caption: 'Утро перед поездом в долину. Последний городской кадр.',
      },
    ],
  },
  {
    id: 'lauterbrunnen',
    name: 'Лаутербруннен',
    country: 'Швейцария',
    kicker: 'Глава V · поезд',
    story:
      'Сорок минут из Цюриха — и стена водопадов. Долина, из которой, кажется, срисовали фэнтези. Здесь заканчивается маршрут по Европе и начинается тишина.',
    lon: 7.91,
    lat: 46.59,
    places: [
      {
        title: 'Долина 72 водопадов',
        kind: 'sight',
        location: 'Lauterbrunnen',
        image: img('photo-1530122037265-a5f1f91d3b99'),
        caption: 'Staubbach падает с обрыва. Тот самый кадр, ради которого едут в Альпы.',
      },
      {
        title: 'Юнгфрау и гребень',
        kind: 'sight',
        location: 'Jungfrau region',
        image: img('photo-1464822759023-fed622ff2c3b'),
        caption: 'Снег даже летом, воздух, от которого кружится голова.',
      },
      {
        title: 'Мюррен / Гриммельвальд',
        kind: 'sight',
        location: 'Bernese Oberland',
        image: img('photo-1506905925346-21bda4d32df4'),
        caption: 'Деревни без машин, зелень, тишина. Швейцария без витрин.',
      },
      {
        title: 'Ужин в шале',
        kind: 'food',
        location: 'Lauterbrunnen village',
        image: img('photo-1470770841072-f978cf4d019e'),
        caption: 'Раклет, дерево, окно в водопад. Атмосфера, которую не ставят на фильтр.',
      },
    ],
  },
];

export const LEGS: Leg[] = [
  { from: 'almaty', to: 'istanbul', mode: 'plane', label: 'Алматы → Стамбул · самолёт' },
  { from: 'istanbul', to: 'rome', mode: 'plane', label: 'Стамбул → Рим · самолёт' },
  { from: 'rome', to: 'venice', mode: 'train', label: 'Рим → Венеция · поезд' },
  { from: 'venice', to: 'paris', mode: 'plane', label: 'Венеция → Париж · самолёт' },
  { from: 'paris', to: 'zurich', mode: 'train', label: 'Париж → Цюрих · поезд' },
  { from: 'zurich', to: 'lauterbrunnen', mode: 'train', label: 'Цюрих → Лаутербруннен · поезд' },
  { from: 'lauterbrunnen', to: 'zurich', mode: 'train', label: 'Лаутербруннен → Цюрих · поезд' },
  { from: 'zurich', to: 'istanbul', mode: 'plane', label: 'Цюрих → Стамбул · самолёт' },
  { from: 'istanbul', to: 'almaty', mode: 'plane', label: 'Стамбул → Алматы · самолёт домой' },
];

export const INSTAGRAM = 'https://www.instagram.com/qairattt_t.e/';
export const WHATSAPP = 'https://wa.me/message/2UBIBW6WROJXP1';
