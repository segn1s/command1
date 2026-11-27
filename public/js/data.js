/**
 * Static catalogs for cities, decor shop items, upcoming calendar events,
 * mock leaderboard peers, and Schedion student lookup fallback.
 */

export const CITIES = {
  sport: {
    id: 'sport',
    shortName: 'Спорт',
    title: 'Город спорта',
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
    shortName: 'Творчество',
    title: 'Город творчества',
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
    shortName: 'Наука',
    title: 'Город науки',
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
    shortName: 'Общество',
    title: 'Город общества',
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
  chair: {
    slotTitle: 'Кресло и уют',
    items: [
      { id: 'chair-lavender', name: 'Лавандовое кресло', icon: '🪑', price: 0, color: '#B8AEDB' },
      { id: 'chair-sage', name: 'Шалфейный пуф', icon: '🛋️', price: 150, color: '#9FC4A5' },
      { id: 'chair-gold', name: 'Кресло-трон', icon: '👑', price: 320, color: '#E8C568' }
    ]
  },
  plant: {
    slotTitle: 'Растение',
    items: [
      { id: 'plant-ficus', name: 'Домашний фикус', icon: '🪴', price: 0, color: '#4E8762' },
      { id: 'plant-hydrangea', name: 'Гортензия', icon: '💐', price: 300, color: '#A389D4' },
      { id: 'plant-tulip', name: 'Тюльпаны', icon: '🌷', price: 350, color: '#E87A82' }
    ]
  },
  lamp: {
    slotTitle: 'Освещение',
    items: [
      { id: 'lamp-day', name: 'Дневное окно', icon: '🪟', price: 0, color: '#9FD3F2' },
      { id: 'lamp-warm', name: 'Лампа «Тёплый свет»', icon: '💡', price: 220, color: '#FFD27D' },
      { id: 'lamp-stars', name: 'Гирлянда звёзд', icon: '✨', price: 400, color: '#FFE885' }
    ]
  },
  poster: {
    slotTitle: 'Декор стены',
    items: [
      { id: 'poster-star', name: 'Рамка со звездой', icon: '🖼️', price: 0, color: '#E8C568' },
      { id: 'poster-grad', name: 'Диплом почёта', icon: '🎓', price: 250, color: '#6E85B7' },
      { id: 'poster-owl', name: 'Знамя Совы', icon: '🦉', price: 450, color: '#7A5EA7' }
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
    categoryLabel: 'Спорт',
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
    categoryLabel: 'Наука',
    title: 'Научный квиз',
    location: 'Корпус Б · аудитория 204',
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
    categoryLabel: 'Творчество',
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
    categoryLabel: 'Общество',
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
    categoryLabel: 'Наука',
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

export const MOCK_SCHEDION_FALLBACK = {
  '123': { id: '123', fullName: 'Иванов Иван Иванович', group: 'ИВТ-21', faculty: 'ФКТИ' },
  '204': { id: '204', fullName: 'Смирнова Анна Сергеевна', group: 'ПИ-31', faculty: 'ФКТИ' },
  '315': { id: '315', fullName: 'Козлов Дмитрий Алексеевич', group: 'БТ-12', faculty: 'ФЭА' },
  '408': { id: '408', fullName: 'Петрова Мария Викторовна', group: 'АД-22', faculty: 'ГФ' }
};
