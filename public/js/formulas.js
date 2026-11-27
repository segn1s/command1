/**
 * Точные формулы расчёта опыта (AP), совиков (DP), уровня города (G) и лиг,
 * а также определение сезона интерфейса.
 */

export const LEAGUES = [
  { id: 'bronze', name: 'Bronze Owl', ruName: 'Бронзовая лига', roman: 'I', minAP: 0, maxAP: 499, K: 1.0 },
  { id: 'silver', name: 'Silver Owl', ruName: 'Серебряная лига', roman: 'II', minAP: 500, maxAP: 1199, K: 1.05 },
  { id: 'gold', name: 'Gold Owl', ruName: 'Золотая лига', roman: 'III', minAP: 1200, maxAP: 2099, K: 1.1 },
  { id: 'platinum', name: 'Platinum Owl', ruName: 'Платиновая лига', roman: 'IV', minAP: 2100, maxAP: 3199, K: 1.15 },
  { id: 'diamond', name: 'Diamond Owl', ruName: 'Алмазная лига', roman: 'V', minAP: 3200, maxAP: Infinity, K: 1.2 }
];

export const CITY_LEVEL_STEP = 100;

/**
 * Определяет сезон для data-season: сентябрь–ноябрь -> "autumn", иначе "base".
 */
export function getSeason(date = new Date()) {
  const month = date.getMonth(); // 0..11
  return month >= 8 && month <= 10 ? 'autumn' : 'base';
}

export function getLeagueByAP(totalAP) {
  const ap = Math.max(0, Number(totalAP) || 0);
  return LEAGUES.find((l) => ap >= l.minAP && ap <= l.maxAP) || LEAGUES[0];
}

/**
 * Расчёт наград за мероприятие:
 *   Â = A / 3
 *   r = R / 3
 *   D̂ = 0.6 * r + 0.4 * L
 *   B = round_0.1(V * 10 * (0.1 + 0.3 * Â + 0.6 * D̂))
 *   AP = round(10 * B)
 *   DP = round(B * K)  [уменьшенное начисление совиков с учётом коэффициента лиги K]
 */
export function calculateEventRewards({ V, A, L, R, currentTotalAP }) {
  const vVal = V ? 1 : 0;
  const aVal = Math.min(3, Math.max(1, Number(A) || 1));
  const lVal = Number(L) || 0.25;
  const rVal = Number(R) || 0;

  const aHat = aVal / 3;
  const rNorm = rVal / 3;
  const dHat = 0.6 * rNorm + 0.4 * lVal;

  const rawB = vVal * 10 * (0.1 + 0.3 * aHat + 0.6 * dHat);
  const B = Math.round(rawB * 10) / 10;

  const leagueBefore = getLeagueByAP(currentTotalAP);
  const K = leagueBefore.K;

  const AP = Math.round(10 * B);
  const DP = vVal ? Math.max(1, Math.round(B * K)) : 0;

  return {
    aHat: Math.round(aHat * 100) / 100,
    rNorm: Math.round(rNorm * 100) / 100,
    dHat: Math.round(dHat * 100) / 100,
    B,
    K,
    AP,
    DP,
    leagueBefore
  };
}

export function getCityLevel(cityAP, step = CITY_LEVEL_STEP) {
  const ap = Math.max(0, Number(cityAP) || 0);
  const G = Math.floor(ap / step);
  const progressInLevel = ap % step;
  const toNext = step - progressInLevel;
  const nextThreshold = (G + 1) * step;
  return {
    G,
    ap,
    step,
    progressInLevel,
    toNext,
    nextThreshold,
    unlockedDistricts: Math.min(4, G)
  };
}

const ADJECTIVES = [
  'Алая', 'Звёздное', 'Изумрудный', 'Добрый', 'Смелый', 'Мудрый',
  'Яркая', 'Лунный', 'Тихий', 'Стремительный', 'Уютная', 'Солнечный'
];

const NOUNS = [
  'Сова', 'Пёрышко', 'Академик', 'Исследователь', 'Магистр', 'Филин',
  'Мечтатель', 'Навигатор', 'Мыслитель', 'Крыло', 'Компас', 'Звездочёт'
];

export function generateRandomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

export function getInitials(nickname) {
  const parts = String(nickname || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'АС';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
