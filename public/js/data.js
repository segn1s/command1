/**
 * Каталоги городов, кастомизации комнаты (цвет, свет, мебель, декор, ковёр),
 * событий афиши и рейтинга.
 */

export const CITIES = {
  sport: {
    id: 'sport',
    shortName: 'Качалово',
    title: 'Качалово',
    stages: ['Старт', 'Разминка', 'Арена', 'Чемпионы', 'Олимп'],
    buildings: [
      { level: 1, name: 'Беговая дорожка', desc: 'Утренние пробежки и первые рекорды' },
      { level: 2, name: 'Фитнес-павильон', desc: 'Тренировки и командный дух' },
      { level: 3, name: 'Баскетбольная площадка', desc: 'Межфакультетские турниры' },
      { level: 4, name: 'Главный стадион', desc: 'Большие победы университета' }
    ]
  },
  creativity: {
    id: 'creativity',
    shortName: 'Фантазерск',
    title: 'Фантазерск',
    stages: ['Старт', 'Эскизы', 'Вдохновение', 'Сцена', 'Мастерство'],
    buildings: [
      { level: 1, name: 'Студия скетчей', desc: 'Первые зарисовки и идеи' },
      { level: 2, name: 'Мастерская керамики', desc: 'Ремесло и арт-проекты' },
      { level: 3, name: 'Арт-галерея', desc: 'Выставки студенческих работ' },
      { level: 4, name: 'Концертный зал', desc: 'Фестивали и главная сцена' }
    ]
  },
  science: {
    id: 'science',
    shortName: 'Любознайка',
    title: 'Любознайка',
    stages: ['Старт', 'Открытия', 'Эксперименты', 'Горизонты', 'Академия'],
    buildings: [
      { level: 1, name: 'Библиотека', desc: 'База знаний и конспектов' },
      { level: 2, name: 'Лаборатория', desc: 'Опыты, хакатоны и исследования' },
      { level: 3, name: 'Обсерватория', desc: 'Взгляд на далёкие горизонты' },
      { level: 4, name: 'Исследовательский центр', desc: 'Крупные научные гранты и статьи' }
    ]
  },
  social: {
    id: 'social',
    shortName: 'Движняково',
    title: 'Движняково',
    stages: ['Старт', 'Инициатива', 'Сообщество', 'Лидерство', 'Форум'],
    buildings: [
      { level: 1, name: 'Штаб волонтёров', desc: 'Добрые дела и помощь кампусу' },
      { level: 2, name: 'Дискуссионный клуб', desc: 'Дебаты и открытые лекции' },
      { level: 3, name: 'Студенческий совет', desc: 'Управление проектами и событиями' },
      { level: 4, name: 'Дом инициатив', desc: 'Городские и всероссийские форумы' }
    ]
  }
};

export const DECOR_SHOP = {
  wallColor: {
    slotShort: 'Цвет',
    slotTitle: 'Цвет стен и пола',
    items: [
      {
        id: 'wall-fog',
        name: 'Светлый туман',
        price: 0,
        swatch: '#EBF2FC',
        wallLeft: '#F4F7FC',
        wallRight: '#E7EEF9',
        floor: '#D5DEE8',
        trim: '#BAC6D6'
      },
      {
        id: 'wall-sand',
        name: 'Тёплый пергамент',
        price: 12,
        swatch: '#F7EBD2',
        wallLeft: '#FCF5E3',
        wallRight: '#F4E7C8',
        floor: '#D9BD96',
        trim: '#B8986E'
      },
      {
        id: 'wall-sage',
        name: 'Спокойный шалфей',
        price: 15,
        swatch: '#DFECE3',
        wallLeft: '#EEF6F0',
        wallRight: '#DFECE3',
        floor: '#C2D1C6',
        trim: '#9EB3A4'
      },
      {
        id: 'wall-night',
        name: 'Ночная обсерватория',
        price: 22,
        swatch: '#2C3E66',
        wallLeft: '#354A78',
        wallRight: '#293B61',
        floor: '#4B5570',
        trim: '#202B45'
      }
    ]
  },
  lighting: {
    slotShort: 'Свет',
    slotTitle: 'Освещение и атмосфера',
    items: [
      { id: 'light-day', name: 'Дневной свет', price: 0, swatch: '#C7DBF7', sky: '#B7D4FA', mode: 'day' },
      { id: 'light-warm', name: 'Тёплая лампа', price: 14, swatch: '#F9D78E', sky: '#8BAAD8', mode: 'warm' },
      { id: 'light-stars', name: 'Звёздная гирлянда', price: 20, swatch: '#FFE885', sky: '#243B6B', mode: 'stars' },
      { id: 'light-moon', name: 'Лунное сияние', price: 26, swatch: '#9DB9F0', sky: '#1A274A', mode: 'moon' }
    ]
  },
  chair: {
    slotShort: 'Кресло',
    slotTitle: 'Кресло и уют',
    items: [
      { id: 'chair-blue', name: 'Синее кресло', price: 0, swatch: '#5E8CE0', color: '#5E8CE0' },
      { id: 'chair-amber', name: 'Янтарный пуф', price: 12, swatch: '#D4A13E', color: '#D4A13E' },
      { id: 'chair-violet', name: 'Фиолетовое кресло', price: 18, swatch: '#7C5AC2', color: '#7C5AC2' }
    ]
  },
  plant: {
    slotShort: 'Растение',
    slotTitle: 'Растения',
    items: [
      { id: 'plant-ficus', name: 'Домашний фикус', price: 0, swatch: '#2E8B57', color: '#2E8B57', variant: 'ficus' },
      { id: 'plant-bluebell', name: 'Колокольчики', price: 14, swatch: '#4B7BE5', color: '#4B7BE5', variant: 'flowers' },
      { id: 'plant-astro', name: 'Астро-террариум', price: 22, swatch: '#16A34A', color: '#16A34A', variant: 'terrarium' }
    ]
  },
  poster: {
    slotShort: 'Декор',
    slotTitle: 'Декор стены',
    items: [
      { id: 'poster-star', name: 'Звезда в рамке', price: 0, swatch: '#C99A2E', color: '#C99A2E', variant: 'star' },
      { id: 'poster-orbit', name: 'Карта созвездий', price: 16, swatch: '#0059DA', color: '#0059DA', variant: 'orbit' },
      { id: 'poster-banner', name: 'Знамя Астросовья', price: 24, swatch: '#5B21B6', color: '#5B21B6', variant: 'banner' }
    ]
  },
  rug: {
    slotShort: 'Ковёр',
    slotTitle: 'Ковёр',
    items: [
      { id: 'rug-brand', name: 'Синий овал', price: 0, swatch: '#C7DBF7', outer: '#A3C4F3', inner: '#DCE9FC', pattern: 'plain' },
      { id: 'rug-amber', name: 'Золотой ковёр', price: 10, swatch: '#F0D78C', outer: '#D4AF4A', inner: '#F4E1A6', pattern: 'rings' },
      { id: 'rug-orbit', name: 'Орбитальный узор', price: 18, swatch: '#5B21B6', outer: '#6D43C2', inner: '#B8A2E8', pattern: 'orbit' }
    ]
  }
};

export const CALENDAR_EVENTS = [
  {
    id: 'ev-run',
    dayOffset: 0,
    dateLabel: '27 ноя',
    time: '08:00',
    category: 'sport',
    categoryLabel: 'Качалово',
    title: 'Утренняя пробежка',
    location: 'Стадион кампуса',
    L: 0.25,
    A: 1,
    R: 0,
    xpPreview: 26
  },
  {
    id: 'ev-quiz',
    dayOffset: 0,
    dateLabel: '27 ноя',
    time: '13:00',
    category: 'science',
    categoryLabel: 'Любознайка',
    title: 'Научный квиз',
    location: 'Корпус Б, аудитория 204',
    L: 0.50,
    A: 2,
    R: 2,
    xpPreview: 82
  },
  {
    id: 'ev-ceramic',
    dayOffset: 1,
    dateLabel: '28 ноя',
    time: '16:00',
    category: 'creativity',
    categoryLabel: 'Фантазерск',
    title: 'Мастерская керамики',
    location: 'Арт-пространство',
    L: 0.25,
    A: 1,
    R: 0,
    xpPreview: 26
  },
  {
    id: 'ev-volunteer',
    dayOffset: 2,
    dateLabel: '29 ноя',
    time: '18:00',
    category: 'social',
    categoryLabel: 'Движняково',
    title: 'Встреча волонтёров',
    location: 'Студенческий центр',
    L: 0.50,
    A: 2,
    R: 0,
    xpPreview: 42
  },
  {
    id: 'ev-hackathon',
    dayOffset: 3,
    dateLabel: '30 ноя',
    time: '10:00',
    category: 'science',
    categoryLabel: 'Любознайка',
    title: 'Университетский хакатон',
    location: 'Точка кипения',
    L: 0.75,
    A: 2,
    R: 3,
    xpPreview: 84
  }
];

export const MOCK_PEERS = [
  { id: '101', nickname: 'Изумрудный Порыв', totalAP: 3600, cities: { sport: 900, creativity: 800, science: 1100, social: 800 } },
  { id: '102', nickname: 'Милый Кот', totalAP: 3420, cities: { sport: 600, creativity: 1200, science: 900, social: 720 } },
  { id: '103', nickname: 'Добрый Академик', totalAP: 3180, cities: { sport: 400, creativity: 680, science: 1400, social: 700 } },
  { id: '104', nickname: 'Естественный Магистр', totalAP: 2800, cities: { sport: 700, creativity: 500, science: 1000, social: 600 } },
  { id: '105', nickname: 'Совиный Вундеркинд', totalAP: 2600, cities: { sport: 500, creativity: 700, science: 900, social: 500 } },
  { id: '106', nickname: 'Активный Кандидат', totalAP: 2510, cities: { sport: 810, creativity: 400, science: 600, social: 700 } },
  { id: '107', nickname: 'Звёздное Пёрышко', totalAP: 1480, cities: { sport: 320, creativity: 460, science: 400, social: 300 } },
  { id: '108', nickname: 'Смелый Навигатор', totalAP: 920, cities: { sport: 420, creativity: 150, science: 200, social: 150 } },
  { id: '109', nickname: 'Лунный Филин', totalAP: 410, cities: { sport: 100, creativity: 110, science: 120, social: 80 } }
];
