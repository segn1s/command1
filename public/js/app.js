import {
  LEAGUES,
  getSeason,
  calculateEventRewards,
  getLeagueByAP,
  getCityLevel,
  generateRandomNickname,
  getInitials
} from './formulas.js';
import {
  CITIES,
  DECOR_SHOP,
  CALENDAR_EVENTS,
  MOCK_PEERS
} from './data.js';
import {
  renderMiniIslandSVG,
  renderCityDetailSVG,
  renderOwlRoomSVG
} from './illustrations.js';
import { Match3Game } from './match3.js';

const STORAGE_KEY = 'astrosovye_state_v2';
const CODE_SECRET = 'astrosovye-campus-secret-2026';
const CODE_PERIOD_SECONDS = 30;

function createInitialState() {
  const seedAchievements = [
    {
      id: 'ach-1',
      title: 'Научный квиз факультета',
      category: 'science',
      L: 0.50,
      A: 2,
      R: 2,
      V: 1,
      status: 'approved',
      AP: 70,
      DP: 7,
      createdAt: '18.11.2026'
    },
    {
      id: 'ach-2',
      title: 'Осенний кросс университета',
      category: 'sport',
      L: 0.25,
      A: 1,
      R: 2,
      V: 1,
      status: 'approved',
      AP: 60,
      DP: 6,
      createdAt: '20.11.2026'
    },
    {
      id: 'ach-3',
      title: 'Волонтёрский форум',
      category: 'social',
      L: 0.75,
      A: 2,
      R: 1,
      V: 1,
      status: 'approved',
      AP: 60,
      DP: 6,
      createdAt: '22.11.2026'
    },
    {
      id: 'ach-4',
      title: 'Фестиваль студенческого арта',
      category: 'creativity',
      L: 0.50,
      A: 2,
      R: 2.5,
      V: 1,
      status: 'approved',
      AP: 72,
      DP: 7,
      createdAt: '24.11.2026'
    },
    {
      id: 'ach-5',
      title: 'Доклад на научной конференции',
      category: 'science',
      L: 0.75,
      A: 2,
      R: 3,
      V: 0,
      status: 'pending',
      AP: 84,
      DP: 8,
      createdAt: '26.11.2026'
    }
  ];

  return {
    registered: false,
    profile: {
      id: '123',
      nickname: 'Алая Сова'
    },
    coinsEarned: 18,
    coinsSpent: 0,
    ownedDecor: [
      'wall-fog',
      'light-day',
      'chair-blue',
      'plant-ficus',
      'poster-star',
      'rug-brand'
    ],
    equippedDecor: {
      wallColor: 'wall-fog',
      lighting: 'light-day',
      chair: 'chair-blue',
      plant: 'plant-ficus',
      poster: 'poster-star',
      rug: 'rug-brand'
    },
    achievements: seedAchievements
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      equippedDecor: { ...base.equippedDecor, ...(parsed.equippedDecor || {}) },
      ownedDecor: Array.from(new Set([...base.ownedDecor, ...(parsed.ownedDecor || [])]))
    };
  } catch {
    return createInitialState();
  }
}

let state = loadState();
let currentCityId = 'science';
let activeScreen = 'home';
let owlMood = 'happy';
let ratingTab = 'league';
let calendarSelectedDay = 0;
let calendarCategory = 'all';
let currentShopSlot = 'wallColor';
let codeTimerHandle = null;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCityAP(cityId) {
  return state.achievements
    .filter((a) => a.status === 'approved' && a.category === cityId)
    .reduce((sum, a) => sum + a.AP, 0);
}

function getTotalAP() {
  return state.achievements
    .filter((a) => a.status === 'approved')
    .reduce((sum, a) => sum + a.AP, 0);
}

function getCoinsBalance() {
  return Math.max(0, state.coinsEarned - state.coinsSpent);
}

function showToast(msg, variant = 'info') {
  const el = document.getElementById('toast');
  const textEl = document.getElementById('toast-text');
  textEl.textContent = msg;
  el.classList.remove('hidden', 'is-success', 'is-error', 'is-warning');
  if (variant === 'success') el.classList.add('is-success');
  if (variant === 'error') el.classList.add('is-error');
  if (variant === 'warning') el.classList.add('is-warning');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

function navigateTo(screenId) {
  activeScreen = screenId;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(`screen-${screenId}`);
  if (target) target.classList.add('active');
  renderAll();
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  if (id === 'modal-verify-code' && codeTimerHandle) {
    clearInterval(codeTimerHandle);
    codeTimerHandle = null;
  }
}

/* ---------- 6-значные коды каждые 30 секунд ---------- */
async function localGenerateTotp(windowIndex) {
  const data = new TextEncoder().encode(`${CODE_SECRET}:${windowIndex}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1000000).padStart(6, '0');
}

async function fetchCurrentCodeInfo() {
  try {
    const res = await fetch('/api/code/current');
    if (res.ok) return await res.json();
  } catch {
    // локальный расчёт без Worker
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const windowIndex = Math.floor(nowSec / CODE_PERIOD_SECONDS);
  const secondsRemaining = CODE_PERIOD_SECONDS - (nowSec % CODE_PERIOD_SECONDS);
  const code = await localGenerateTotp(windowIndex);
  return { code, periodSeconds: CODE_PERIOD_SECONDS, secondsRemaining, windowIndex };
}

async function verifySubmittedCode(submitted) {
  try {
    const res = await fetch('/api/code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: submitted })
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.valid);
    }
  } catch {
    // локальный расчёт без Worker
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const currWindow = Math.floor(nowSec / CODE_PERIOD_SECONDS);
  const [c1, c2] = await Promise.all([
    localGenerateTotp(currWindow),
    localGenerateTotp(currWindow - 1)
  ]);
  return submitted === c1 || submitted === c2;
}

/* ---------- Отрисовка экранов ---------- */
function renderHome() {
  const totalAP = getTotalAP();
  const league = getLeagueByAP(totalAP);
  document.getElementById('home-avatar-initials').textContent = getInitials(state.profile.nickname);
  document.getElementById('home-total-xp').textContent = `${totalAP} XP`;
  document.getElementById('home-total-coins').textContent = String(getCoinsBalance());
  document.getElementById('home-league-short').textContent = league.name.replace(' Owl', '');

  Object.keys(CITIES).forEach((cityId) => {
    const wrap = document.getElementById(`home-svg-${cityId}`);
    if (wrap && !wrap.innerHTML) {
      wrap.innerHTML = renderMiniIslandSVG(cityId);
    }
    const lvlEl = document.querySelector(`[data-city-lvl="${cityId}"]`);
    if (lvlEl) {
      const info = getCityLevel(getCityAP(cityId));
      lvlEl.textContent = `Уровень ${info.G}`;
    }
  });
}

function renderCity() {
  const city = CITIES[currentCityId];
  const cityAP = getCityAP(currentCityId);
  const info = getCityLevel(cityAP);

  document.getElementById('city-title').textContent = city.title;
  const stageName = city.stages[Math.min(info.G, city.stages.length - 1)];
  document.getElementById('city-stage-badge').textContent = `Стадия ${info.G + 1} · ${stageName}`;

  document.getElementById('city-island-stage').innerHTML = renderCityDetailSVG(
    currentCityId,
    info.unlockedDistricts
  );
  document.getElementById('city-districts-pill').textContent =
    `${info.unlockedDistricts} из 4 районов открыто`;

  document.getElementById('city-xp-fraction').textContent =
    `${info.ap} / ${info.nextThreshold} XP`;
  document.getElementById('city-progress-fill').style.width =
    `${Math.max(4, Math.round((info.progressInLevel / info.step) * 100))}%`;
  document.getElementById('city-to-next').textContent =
    `До следующей стадии — ${info.toNext} XP`;

  const nextBuilding = city.buildings[info.G] || {
    name: 'Все районы построены',
    desc: 'Максимальная стадия развития города достигнута'
  };
  document.getElementById('city-next-title').textContent =
    info.G < 4 ? `Далее: ${nextBuilding.name}` : nextBuilding.name;
  document.getElementById('city-next-desc').textContent = nextBuilding.desc;
}

function renderOwlHouse() {
  document.getElementById('owl-coins-balance').textContent = String(getCoinsBalance());
  document.getElementById('owl-room-svg').innerHTML = renderOwlRoomSVG(
    state.equippedDecor,
    DECOR_SHOP,
    owlMood
  );
}

function getAllLeaderboardStudents() {
  const me = {
    id: state.profile.id,
    nickname: state.profile.nickname,
    totalAP: getTotalAP(),
    isMe: true,
    cities: {
      sport: getCityAP('sport'),
      creativity: getCityAP('creativity'),
      science: getCityAP('science'),
      social: getCityAP('social')
    }
  };
  return [...MOCK_PEERS.map((p) => ({ ...p, isMe: false })), me].sort(
    (a, b) => b.totalAP - a.totalAP
  );
}

function renderProfile() {
  const totalAP = getTotalAP();
  const league = getLeagueByAP(totalAP);
  const all = getAllLeaderboardStudents();
  const globalRank = all.findIndex((s) => s.isMe) + 1;
  const leaguePeers = all.filter((s) => getLeagueByAP(s.totalAP).id === league.id);
  const leagueRank = leaguePeers.findIndex((s) => s.isMe) + 1;

  document.getElementById('profile-avatar-circle').textContent = getInitials(state.profile.nickname);
  document.getElementById('profile-nickname').textContent = state.profile.nickname;
  document.getElementById('profile-id-line').textContent = `ID: ${state.profile.id}`;

  document.getElementById('profile-total-xp').textContent = totalAP.toLocaleString('ru-RU');
  const nextLeague = LEAGUES.find((l) => l.minAP > league.minAP);
  const pct = nextLeague
    ? Math.min(100, Math.round(((totalAP - league.minAP) / (nextLeague.minAP - league.minAP)) * 100))
    : 100;
  document.getElementById('profile-xp-fill').style.width = `${Math.max(6, pct)}%`;

  document.getElementById('profile-rank-global').textContent = `#${globalRank}`;
  document.getElementById('profile-rank-league').textContent = `#${leagueRank}`;
  document.getElementById('profile-league-roman').textContent = league.roman;
  document.getElementById('profile-league-name').textContent = `${league.ruName} (${league.name})`;
  document.getElementById('profile-league-hint').textContent = nextLeague
    ? `До ${nextLeague.ruName.toLowerCase()} осталось ${nextLeague.minAP - totalAP} XP`
    : 'Достигнута максимальная лига';
}

function renderCalendar() {
  const days = [
    { offset: 0, dow: 'Пт', num: 27, today: true },
    { offset: 1, dow: 'Сб', num: 28 },
    { offset: 2, dow: 'Вс', num: 29 },
    { offset: 3, dow: 'Пн', num: 30 },
    { offset: 4, dow: 'Вт', num: 1 },
    { offset: 5, dow: 'Ср', num: 2 },
    { offset: 6, dow: 'Чт', num: 3 }
  ];

  const strip = document.getElementById('calendar-week-strip');
  strip.innerHTML = '';
  days.forEach((d) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `day-pill ${d.today ? 'today' : ''} ${calendarSelectedDay === d.offset ? 'active' : ''}`;
    btn.innerHTML = `<span>${d.dow}</span><strong>${d.num}</strong>`;
    btn.addEventListener('click', () => {
      calendarSelectedDay = d.offset;
      renderCalendar();
    });
    strip.appendChild(btn);
  });

  const filtered = CALENDAR_EVENTS.filter((ev) => {
    const catOk = calendarCategory === 'all' || ev.category === calendarCategory;
    const dayOk = calendarSelectedDay === 0 || ev.dayOffset === calendarSelectedDay;
    return catOk && dayOk;
  });

  const list = document.getElementById('calendar-events-list');
  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div class="card"><p class="modal-desc">На выбранный день событий по фильтру нет. Выберите вкладку «Все» или другой день.</p></div>';
    return;
  }

  filtered.forEach((ev) => {
    const card = document.createElement('div');
    card.className = 'card event-card';
    card.innerHTML = `
      <div class="event-time-box">
        <strong>${ev.time}</strong>
        <span>${ev.dateLabel}</span>
      </div>
      <div class="event-info">
        <div class="event-top-row">
          <span>${ev.categoryLabel}</span>
          <span class="event-xp-tag">+${ev.xpPreview} XP</span>
        </div>
        <div class="event-title">${ev.title}</div>
        <div class="event-loc">${ev.location}</div>
      </div>
    `;
    card.addEventListener('click', () => openVerifyModal(ev.id));
    list.appendChild(card);
  });
}

function renderRating() {
  const totalAP = getTotalAP();
  const myLeague = getLeagueByAP(totalAP);
  const all = getAllLeaderboardStudents();
  const listData =
    ratingTab === 'league'
      ? all.filter((s) => getLeagueByAP(s.totalAP).id === myLeague.id)
      : all;

  document.getElementById('rating-league-title').textContent =
    ratingTab === 'league' ? myLeague.ruName : 'Общий рейтинг';
  document.getElementById('rating-league-sub').textContent =
    ratingTab === 'league'
      ? `${myLeague.name} · множитель совиков K = ${myLeague.K.toFixed(2)}`
      : 'Все участники «Астросовья»';

  const podiumEl = document.getElementById('rating-podium');
  podiumEl.innerHTML = '';
  const top3 = listData.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const placeClasses = top3[1] ? ['podium-2', 'podium-1', 'podium-3'] : ['podium-1'];
  const places = top3[1] ? [2, 1, 3] : [1];

  order.forEach((student, idx) => {
    const div = document.createElement('div');
    div.className = `podium-card ${placeClasses[idx]}`;
    div.innerHTML = `
      <div class="podium-avatar">${getInitials(student.nickname)}</div>
      <strong>${student.nickname}</strong>
      <span class="podium-xp">${student.totalAP} XP</span>
      <span class="podium-place">${places[idx]}</span>
    `;
    podiumEl.appendChild(div);
  });

  const listEl = document.getElementById('rating-list');
  listEl.innerHTML = '';
  listData.slice(3).forEach((student, idx) => {
    const rank = idx + 4;
    const lg = getLeagueByAP(student.totalAP);
    const row = document.createElement('div');
    row.className = `rating-row ${student.isMe ? 'is-me' : ''}`;
    row.innerHTML = `
      <span class="rating-row-rank">${rank}</span>
      <div class="rating-row-avatar">${getInitials(student.nickname)}</div>
      <div class="rating-row-info">
        <strong>${student.nickname}</strong>
        <span>${student.isMe ? 'Ваша позиция' : lg.ruName}</span>
      </div>
      <div class="rating-row-xp">${student.totalAP} XP</div>
    `;
    listEl.appendChild(row);
  });

  const nextLeague = LEAGUES.find((l) => l.minAP > myLeague.minAP);
  document.getElementById('rating-promo-title').textContent = nextLeague
    ? `Следующая лига: ${nextLeague.ruName}`
    : 'Достигнута высшая лига Diamond Owl';
  document.getElementById('rating-promo-desc').textContent = nextLeague
    ? `Ещё ${nextLeague.minAP - totalAP} XP до повышения множителя K = ${nextLeague.K.toFixed(2)}`
    : 'Максимальный множитель совиков K = 1.20 активен';
}

function renderAll() {
  renderHome();
  if (activeScreen === 'city') renderCity();
  if (activeScreen === 'owl') renderOwlHouse();
  if (activeScreen === 'profile') renderProfile();
  if (activeScreen === 'calendar') renderCalendar();
  if (activeScreen === 'rating') renderRating();
}

/* ---------- Дневник (без модерации) ---------- */
function renderDiary() {
  const listEl = document.getElementById('diary-items-list');
  listEl.innerHTML = '';

  if (state.achievements.length === 0) {
    listEl.innerHTML = '<p class="modal-desc">В дневнике пока нет записей. Подайте заявку или подтвердите участие на мероприятии.</p>';
    return;
  }

  [...state.achievements].reverse().forEach((a) => {
    const statusMap = {
      approved: { cls: 'pill-success', text: 'Подтверждено' },
      pending: { cls: 'pill-warning', text: 'На проверке' },
      rejected: { cls: 'pill-danger', text: 'Отклонено' }
    };
    const st = statusMap[a.status] || statusMap.pending;
    const cityName = CITIES[a.category]?.shortName || a.category;
    const item = document.createElement('div');
    item.className = 'diary-item';
    item.innerHTML = `
      <div class="diary-item-top">
        <strong>${a.title}</strong>
        <span class="pill ${st.cls}">${st.text}</span>
      </div>
      <div class="diary-meta">${cityName} · ${a.createdAt}</div>
      <div class="diary-meta"><strong>${a.status === 'approved' ? `+${a.AP} XP, +${a.DP} совиков` : a.status === 'pending' ? `Ожидается: +${a.AP} XP, +${a.DP} совиков` : '0 XP'}</strong></div>
    `;
    listEl.appendChild(item);
  });
}

function updateApplicationPreview() {
  const L = Number(document.getElementById('app-level').value);
  const A = Number(document.getElementById('app-activity').value);
  const R = Number(document.getElementById('app-result').value);
  const res = calculateEventRewards({
    V: 1,
    A,
    L,
    R,
    currentTotalAP: getTotalAP()
  });
  document.getElementById('app-formula-preview').innerHTML = `
    <strong>Расчёт награды:</strong><br/>
    D̂ = ${res.dHat} · B = ${res.B} · Коэффициент лиги K = ${res.K.toFixed(2)}<br/>
    Награда после подтверждения: <strong>+${res.AP} XP</strong> и <strong>+${res.DP} совиков</strong>
  `;
}

/* ---------- Кастомизация комнаты ---------- */
function openShop(slot = 'wallColor') {
  currentShopSlot = DECOR_SHOP[slot] ? slot : 'wallColor';
  const slotData = DECOR_SHOP[currentShopSlot];
  document.getElementById('shop-modal-title').textContent = slotData.slotTitle;

  const tabsEl = document.getElementById('shop-slot-tabs');
  tabsEl.innerHTML = '';
  Object.entries(DECOR_SHOP).forEach(([key, cfg]) => {
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `btn-secondary btn-sm ${key === currentShopSlot ? 'active' : ''}`;
    tabBtn.textContent = cfg.slotShort;
    tabBtn.addEventListener('click', () => openShop(key));
    tabsEl.appendChild(tabBtn);
  });

  const grid = document.getElementById('shop-items-grid');
  grid.innerHTML = '';

  slotData.items.forEach((item) => {
    const owned = state.ownedDecor.includes(item.id);
    const equipped = state.equippedDecor[currentShopSlot] === item.id;
    const card = document.createElement('div');
    card.className = `shop-item-card ${equipped ? 'equipped' : ''}`;
    card.innerHTML = `
      <span class="swatch-preview" style="background: ${item.swatch};"></span>
      <strong>${item.name}</strong>
      <span class="diary-meta">${owned ? 'В наличии' : `${item.price} совиков`}</span>
      <button class="${equipped ? 'btn-secondary' : 'btn-primary'} btn-sm full-width" type="button" ${equipped ? 'disabled' : ''}>
        ${equipped ? 'Установлено' : owned ? 'Применить' : `Купить (${item.price})`}
      </button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      if (equipped) return;
      if (!owned) {
        if (getCoinsBalance() < item.price) {
          showToast('Недостаточно совиков. Заработайте их в игре «Три в ряд» или на мероприятиях.', 'warning');
          return;
        }
        state.coinsSpent += item.price;
        state.ownedDecor.push(item.id);
      }
      state.equippedDecor[currentShopSlot] = item.id;
      saveState();
      renderOwlHouse();
      renderHome();
      openShop(currentShopSlot);
      showToast(`Оформление обновлено: ${item.name}`, 'success');
    });
    grid.appendChild(card);
  });

  openModal('modal-shop');
}

/* ---------- 6-значный код подтверждения ---------- */
async function refreshLiveCodeBox() {
  const info = await fetchCurrentCodeInfo();
  document.getElementById('organizer-live-code').textContent = info.code;
  document.getElementById('organizer-code-timer').textContent =
    `Обновление через ${info.secondsRemaining} с`;
  document.getElementById('code-timer-fill').style.width =
    `${Math.round((info.secondsRemaining / info.periodSeconds) * 100)}%`;
}

function openVerifyModal(preselectEventId = null) {
  const select = document.getElementById('verify-event-select');
  select.innerHTML = '';
  CALENDAR_EVENTS.forEach((ev) => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    opt.textContent = `${ev.title} (${ev.categoryLabel})`;
    select.appendChild(opt);
  });
  if (preselectEventId) select.value = preselectEventId;

  document.getElementById('verify-code-input').value = '';
  document.getElementById('verify-code-error').classList.add('hidden');
  openModal('modal-verify-code');
  refreshLiveCodeBox();
  if (codeTimerHandle) clearInterval(codeTimerHandle);
  codeTimerHandle = setInterval(refreshLiveCodeBox, 1000);
}

/* ---------- Поиск студентов ---------- */
function renderStudentSearch(query) {
  const q = String(query || '').trim().toLowerCase();
  const resultsEl = document.getElementById('student-search-results');
  const all = getAllLeaderboardStudents().filter(
    (s) => s.nickname.toLowerCase().includes(q) || String(s.id).includes(q)
  );
  resultsEl.innerHTML = '';
  if (all.length === 0) {
    resultsEl.innerHTML = '<p class="modal-desc">По вашему запросу студенты не найдены.</p>';
    return;
  }
  all.slice(0, 8).forEach((s) => {
    const lg = getLeagueByAP(s.totalAP);
    const row = document.createElement('div');
    row.className = 'diary-item';
    row.innerHTML = `
      <div class="diary-item-top">
        <strong>${s.nickname} (ID: ${s.id})</strong>
        <span class="pill pill-brand">${s.totalAP} XP</span>
      </div>
      <div class="diary-meta">${lg.ruName} · Качалово: ${s.cities.sport} · Любознайка: ${s.cities.science} · Фантазерск: ${s.cities.creativity} · Движняково: ${s.cities.social}</div>
    `;
    resultsEl.appendChild(row);
  });
}

/* ---------- Инициализация ---------- */
function init() {
  document.documentElement.setAttribute('data-season', getSeason());

  document.querySelectorAll('.island-card').forEach((card) => {
    card.addEventListener('click', () => {
      currentCityId = card.dataset.city;
      navigateTo('city');
    });
  });

  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.back));
  });

  document.getElementById('btn-open-profile').addEventListener('click', () => navigateTo('profile'));
  document.getElementById('btn-open-calendar').addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('btn-open-rating').addEventListener('click', () => navigateTo('rating'));
  document.getElementById('btn-enter-owl-house').addEventListener('click', () => navigateTo('owl'));
  document.getElementById('btn-profile-to-rating').addEventListener('click', () => {
    ratingTab = 'global';
    navigateTo('rating');
  });
  document.getElementById('btn-profile-to-league').addEventListener('click', () => {
    ratingTab = 'league';
    navigateTo('rating');
  });

  const owlMessages = [
    ['Приветствуем в «Астросовье»', 'Нажмите на сову для совета или настройте цвет стен, свет и мебель комнаты.'],
    ['Совет по развитию', 'Подтвердите участие в событии из афиши с помощью 6-значного кода, чтобы получить XP и совики.'],
    ['Оформление комнаты', 'Меняйте цвет стен, освещение и декор с помощью кнопок под комнатой или значков «+».']
  ];
  let owlMsgIdx = 0;
  document.getElementById('owl-speech-card').addEventListener('click', () => {
    owlMsgIdx = (owlMsgIdx + 1) % owlMessages.length;
    owlMood = owlMood === 'happy' ? 'excited' : 'happy';
    document.getElementById('owl-speech-title').textContent = owlMessages[owlMsgIdx][0];
    document.getElementById('owl-speech-text').textContent = owlMessages[owlMsgIdx][1];
    renderOwlHouse();
  });

  document.querySelectorAll('[data-slot]').forEach((btn) => {
    btn.addEventListener('click', () => openShop(btn.dataset.slot));
  });

  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.getElementById('btn-open-search').addEventListener('click', () => {
    renderStudentSearch('');
    openModal('modal-search');
  });
  document.getElementById('student-search-input').addEventListener('input', (e) => {
    renderStudentSearch(e.target.value);
  });

  const openAuthModal = () => {
    document.getElementById('auth-nickname-input').value = state.profile.nickname;
    document.getElementById('auth-nick-error').classList.add('hidden');
    openModal('modal-auth');
  };
  document.getElementById('btn-edit-profile').addEventListener('click', openAuthModal);
  document.getElementById('btn-randomize-nick').addEventListener('click', () => {
    document.getElementById('auth-nickname-input').value = generateRandomNickname();
    document.getElementById('auth-nick-error').classList.add('hidden');
  });

  document.getElementById('btn-auth-submit').addEventListener('click', () => {
    const nick = document.getElementById('auth-nickname-input').value.trim();
    const errEl = document.getElementById('auth-nick-error');
    if (!nick) {
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    state.profile.nickname = nick;
    state.registered = true;
    saveState();
    closeModal('modal-auth');
    renderAll();
    showToast(`Профиль сохранён: ${nick}`, 'success');
  });

  const openDiary = () => {
    renderDiary();
    updateApplicationPreview();
    openModal('modal-diary');
  };
  document.getElementById('btn-open-diary').addEventListener('click', openDiary);
  document.getElementById('btn-profile-diary').addEventListener('click', openDiary);

  document.querySelectorAll('[data-diary-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-diary-tab]').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.diary-tab-pane').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`diary-tab-${btn.dataset.diaryTab}`).classList.add('active');
    });
  });

  ['app-level', 'app-activity', 'app-result'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateApplicationPreview);
  });

  document.getElementById('btn-submit-application').addEventListener('click', () => {
    const title = document.getElementById('app-title').value.trim();
    const errEl = document.getElementById('app-form-error');
    if (!title) {
      errEl.textContent = 'Укажите название мероприятия.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');

    const category = document.getElementById('app-category').value;
    const L = Number(document.getElementById('app-level').value);
    const A = Number(document.getElementById('app-activity').value);
    const R = Number(document.getElementById('app-result').value);

    const preview = calculateEventRewards({ V: 1, A, L, R, currentTotalAP: getTotalAP() });

    state.achievements.push({
      id: `ach-${Date.now()}`,
      title,
      category,
      L,
      A,
      R,
      V: 0,
      status: 'pending',
      AP: preview.AP,
      DP: preview.DP,
      createdAt: new Date().toLocaleDateString('ru-RU')
    });
    saveState();
    document.getElementById('app-title').value = '';
    renderDiary();
    document.querySelector('[data-diary-tab="list"]').click();
    showToast('Заявка отправлена и добавлена в дневник', 'success');
  });

  document.getElementById('btn-verify-attendance').addEventListener('click', () => openVerifyModal());
  document.getElementById('btn-confirm-code').addEventListener('click', async () => {
    const code = document.getElementById('verify-code-input').value.trim();
    const errEl = document.getElementById('verify-code-error');
    if (!/^\d{6}$/.test(code)) {
      errEl.textContent = 'Введите 6 цифр кода.';
      errEl.classList.remove('hidden');
      return;
    }
    const valid = await verifySubmittedCode(code);
    if (!valid) {
      errEl.textContent = 'Неверный или устаревший код. Проверьте актуальный код организатора.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    const evId = document.getElementById('verify-event-select').value;
    const ev = CALENDAR_EVENTS.find((e) => e.id === evId) || CALENDAR_EVENTS[0];
    const res = calculateEventRewards({
      V: 1,
      A: ev.A,
      L: ev.L,
      R: ev.R,
      currentTotalAP: getTotalAP()
    });
    state.achievements.push({
      id: `ach-${Date.now()}`,
      title: ev.title,
      category: ev.category,
      L: ev.L,
      A: ev.A,
      R: ev.R,
      V: 1,
      status: 'approved',
      AP: res.AP,
      DP: res.DP,
      createdAt: new Date().toLocaleDateString('ru-RU')
    });
    state.coinsEarned += res.DP;
    saveState();
    closeModal('modal-verify-code');
    renderAll();
    showToast(`Участие подтверждено: +${res.AP} XP и +${res.DP} совиков`, 'success');
  });

  const match3 = new Match3Game({
    boardEl: document.getElementById('match3-board'),
    scoreEl: document.getElementById('m3-score'),
    movesEl: document.getElementById('m3-moves'),
    comboEl: document.getElementById('m3-combo'),
    earnedEl: document.getElementById('m3-earned'),
    progressEl: document.getElementById('m3-progress-fill'),
    statusEl: document.getElementById('m3-status-text')
  });

  document.getElementById('btn-open-match3').addEventListener('click', () => {
    match3.start();
    openModal('modal-match3');
  });
  document.getElementById('btn-m3-hint').addEventListener('click', () => match3.highlightHint());
  document.getElementById('btn-m3-restart').addEventListener('click', () => match3.start());
  document.getElementById('btn-m3-claim').addEventListener('click', () => {
    const coins = match3.claimCoins();
    if (coins > 0) {
      state.coinsEarned += coins;
      saveState();
      renderOwlHouse();
      renderHome();
      showToast(`Начислено +${coins} совиков`, 'success');
    } else {
      showToast('Наберите минимум 150 очков для получения 1 совика', 'warning');
    }
  });

  document.querySelectorAll('#calendar-filters button').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#calendar-filters button').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      calendarCategory = chip.dataset.cat;
      renderCalendar();
    });
  });

  document.getElementById('tab-my-league').addEventListener('click', () => {
    ratingTab = 'league';
    document.getElementById('tab-my-league').classList.add('active');
    document.getElementById('tab-global-rating').classList.remove('active');
    renderRating();
  });
  document.getElementById('tab-global-rating').addEventListener('click', () => {
    ratingTab = 'global';
    document.getElementById('tab-global-rating').classList.add('active');
    document.getElementById('tab-my-league').classList.remove('active');
    renderRating();
  });

  document.getElementById('btn-city-info').addEventListener('click', () => {
    const city = CITIES[currentCityId];
    const info = getCityLevel(getCityAP(currentCityId));
    document.getElementById('city-info-title').textContent = city.title;
    const list = document.getElementById('city-buildings-list');
    list.innerHTML = '';
    city.buildings.forEach((b) => {
      const unlocked = info.G >= b.level;
      const row = document.createElement('div');
      row.className = `roadmap-row ${unlocked ? 'unlocked' : ''}`;
      row.innerHTML = `
        <div>
          <div><strong>${b.name}</strong></div>
          <div class="roadmap-desc">${b.desc}</div>
        </div>
        <span class="pill ${unlocked ? 'pill-success' : 'pill-brand'}">${unlocked ? 'Открыто' : `${b.level * 100} XP`}</span>
      `;
      list.appendChild(row);
    });
    openModal('modal-city-info');
  });

  renderAll();
  if (!state.registered) {
    openAuthModal();
  }
}

init();
