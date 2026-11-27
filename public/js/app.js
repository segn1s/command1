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
  DEFAULT_SCHEDULE,
  MOCK_PEERS
} from './data.js';
import {
  renderMiniIslandSVG,
  renderCityDetailSVG,
  renderOwlRoomSVG
} from './illustrations.js';
import { Match3Game } from './match3.js';

const STORAGE_KEY = 'astrosovye_state_v3';
const CODE_SECRET = 'astrosovye-campus-secret-2026';
const CODE_PERIOD_SECONDS = 30;
const MAX_WEEKLY_APPLICATIONS = 5;
const ADMIN_FALLBACK_HASH = 'f0d35fad43ec872bef926dc42f529cad3e29bd23c130e60fe8100633066200f0';

function getISOWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function createInitialState() {
  const currWeek = getISOWeekKey();
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
      source: 'code',
      studentId: '123',
      weekKey: currWeek,
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
      source: 'code',
      studentId: '123',
      weekKey: currWeek,
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
      source: 'code',
      studentId: '123',
      weekKey: currWeek,
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
      source: 'code',
      studentId: '123',
      weekKey: currWeek,
      createdAt: '24.11.2026'
    },
    {
      id: 'ach-5',
      title: 'Доклад на научной конференции',
      category: 'science',
      L: 0.25,
      A: 1,
      R: 0,
      V: 0,
      status: 'pending',
      AP: 0,
      DP: 0,
      note: 'Выступление с докладом на секции ИТ',
      source: 'application',
      studentId: '123',
      weekKey: currWeek,
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
    lastMatch3PlayedDate: null,
    lastMatch3Earned: 0,
    ownedDecor: [
      'owl-cozy-mug',
      'owl-welcome-cap',
      'wall-fog',
      'light-day',
      'chair-blue',
      'plant-ficus',
      'poster-star',
      'rug-brand'
    ],
    equippedDecor: {
      owlStyle: 'owl-cozy-mug',
      wallColor: 'wall-fog',
      lighting: 'light-day',
      chair: 'chair-blue',
      plant: 'plant-ficus',
      poster: 'poster-star',
      rug: 'rug-brand'
    },
    events: CALENDAR_EVENTS.map((e) => ({ ...e })),
    schedule: DEFAULT_SCHEDULE.map((s) => ({ ...s })),
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
      ownedDecor: Array.from(new Set([...base.ownedDecor, ...(parsed.ownedDecor || [])])),
      events: Array.isArray(parsed.events) && parsed.events.length ? parsed.events : base.events,
      schedule: Array.isArray(parsed.schedule) && parsed.schedule.length ? parsed.schedule : base.schedule
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
let calendarTab = 'events';
let currentShopSlot = 'wallColor';
let adminToken = null;
let adminCodeTimerHandle = null;

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

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hasPlayedMatch3Today() {
  return state.lastMatch3PlayedDate === getTodayKey();
}

function getWeeklySubmissionsCount(studentId) {
  const currWeek = getISOWeekKey();
  return state.achievements.filter(
    (a) =>
      a.source === 'application' &&
      String(a.studentId) === String(studentId) &&
      a.weekKey === currWeek
  ).length;
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

function stopAdminCodeTimer() {
  if (adminCodeTimerHandle) {
    clearInterval(adminCodeTimerHandle);
    adminCodeTimerHandle = null;
  }
}

function navigateTo(screenId) {
  if (screenId === 'admin' && !adminToken) {
    openAdminLoginModal();
    return;
  }
  activeScreen = screenId;
  if (screenId !== 'admin') {
    stopAdminCodeTimer();
  }
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(`screen-${screenId}`);
  if (target) target.classList.add('active');
  document.querySelectorAll('.desktop-sidebar .nav-link').forEach((btn) => {
    const matches =
      btn.dataset.nav === screenId || (screenId === 'city' && btn.dataset.nav === 'home');
    btn.classList.toggle('active', matches);
  });
  const adminBtn = document.getElementById('btn-sidebar-admin');
  if (adminBtn) adminBtn.classList.toggle('active', screenId === 'admin');
  const brandProfileBtn = document.getElementById('btn-sidebar-brand-profile');
  if (brandProfileBtn) brandProfileBtn.classList.toggle('is-active', screenId === 'profile');
  const userCardBtn = document.getElementById('btn-sidebar-profile');
  if (userCardBtn) userCardBtn.classList.toggle('is-active', screenId === 'profile');
  renderAll();
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  if (id === 'modal-match3' && typeof window.__claimMatch3OnClose === 'function') {
    window.__claimMatch3OnClose();
  }
  document.getElementById(id).classList.add('hidden');
}

/* ---------- Криптография, коды и вход администратора ---------- */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function localGenerateTotp(windowIndex) {
  const data = new TextEncoder().encode(`${CODE_SECRET}:${windowIndex}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1000000).padStart(6, '0');
}

async function fetchAdminCodeInfo() {
  if (!adminToken) return null;
  try {
    const res = await fetch('/api/admin/code', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) return await res.json();
    if (res.status === 401) return null;
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

async function authenticateAdmin(password) {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      const data = await res.json();
      return data.token || null;
    }
    if (res.status === 401) {
      return null;
    }
  } catch {
    // локальный статический сервер без Worker
  }
  const hash = await sha256Hex(password);
  if (hash === ADMIN_FALLBACK_HASH) {
    return await sha256Hex(`${CODE_SECRET}:admin-session:${password}`);
  }
  return null;
}

/* ---------- Отрисовка основных экранов ---------- */
function getEquippedOwlFile() {
  const item = DECOR_SHOP.owlStyle.items.find((i) => i.id === state.equippedDecor.owlStyle);
  return item?.file || '/assets/owls/owl-cozy-mug.svg';
}

function renderSidebar() {
  const totalAP = getTotalAP();
  const league = getLeagueByAP(totalAP);
  const owlFile = getEquippedOwlFile();
  const nickEl = document.getElementById('sidebar-nickname');
  if (!nickEl) return;
  nickEl.textContent = state.profile.nickname;
  document.getElementById('sidebar-xp').textContent = `${totalAP} XP`;
  document.getElementById('sidebar-coins').textContent = String(getCoinsBalance());
  document.getElementById('sidebar-league').textContent = league.name;
  const sideOwl = document.getElementById('sidebar-owl-img');
  if (sideOwl) sideOwl.src = owlFile;
  const userOwl = document.getElementById('sidebar-user-owl-img');
  if (userOwl) userOwl.src = owlFile;
}

function renderHome() {
  const totalAP = getTotalAP();
  const league = getLeagueByAP(totalAP);
  const homeOwl = document.getElementById('home-avatar-owl');
  if (homeOwl) homeOwl.src = getEquippedOwlFile();
  document.getElementById('home-total-xp').textContent = `${totalAP} XP`;
  document.getElementById('home-total-coins').textContent = String(getCoinsBalance());
  document.getElementById('home-league-short').textContent = league.name.replace(' Owl', '');
  renderSidebar();

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
  const mascotEl = document.getElementById('owl-room-mascot');
  if (mascotEl) {
    mascotEl.src = getEquippedOwlFile();
    mascotEl.classList.toggle('is-excited', owlMood === 'excited');
  }
  const m3Sub = document.getElementById('owl-match3-subtitle');
  if (m3Sub) {
    m3Sub.textContent = hasPlayedMatch3Today() ? 'Сыграно сегодня' : '1 игра в день · на совики';
  }
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
  const profOwl = document.getElementById('profile-owl-img');
  if (profOwl) profOwl.src = getEquippedOwlFile();
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

  const filtered = state.events.filter((ev) => {
    const catOk = calendarCategory === 'all' || ev.category === calendarCategory;
    const dayOk = calendarSelectedDay === 0 || Number(ev.dayOffset) === calendarSelectedDay;
    return catOk && dayOk;
  });

  const list = document.getElementById('calendar-events-list');
  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div class="card"><p class="modal-desc">На выбранный день событий по фильтру нет. Выберите вкладку «Все» или другой день.</p></div>';
  } else {
    filtered.forEach((ev) => {
      const catLabel = CITIES[ev.category]?.shortName || ev.categoryLabel;
      const card = document.createElement('div');
      card.className = 'card event-card';
      card.innerHTML = `
        <div class="event-time-box cat-${ev.category}">
          <strong>${ev.time}</strong>
          <span>${ev.dateLabel}</span>
        </div>
        <div class="event-info">
          <div class="event-top-row">
            <span class="event-cat-pill cat-${ev.category}">${catLabel}${ev.kind === 'Праздник' ? ' · Праздник' : ''}</span>
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

  const schList = document.getElementById('calendar-schedule-list');
  schList.innerHTML = '';
  if (state.schedule.length === 0) {
    schList.innerHTML = '<div class="card"><p class="modal-desc">Расписание занятий пока пустое. Администратор может добавить занятия в админ-панели.</p></div>';
  } else {
    state.schedule.forEach((item) => {
      const catLabel = CITIES[item.category]?.shortName || item.category;
      const card = document.createElement('div');
      card.className = 'card event-card';
      card.innerHTML = `
        <div class="event-time-box cat-${item.category}">
          <strong>${item.day}</strong>
          <span>${item.time}</span>
        </div>
        <div class="event-info">
          <div class="event-top-row">
            <span class="event-cat-pill cat-${item.category}">${catLabel}</span>
          </div>
          <div class="event-title">${item.title}</div>
          <div class="event-loc">${item.place} · ${item.mentor}</div>
        </div>
      `;
      schList.appendChild(card);
    });
  }
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

/* ---------- Панель администратора ---------- */
async function refreshAdminCodeBox() {
  if (activeScreen !== 'admin' || !adminToken) return;
  const info = await fetchAdminCodeInfo();
  if (!info) return;
  document.getElementById('admin-live-code').textContent = info.code;
  document.getElementById('admin-code-timer').textContent =
    `Обновление через ${info.secondsRemaining} с`;
  document.getElementById('admin-code-timer-fill').style.width =
    `${Math.round((info.secondsRemaining / info.periodSeconds) * 100)}%`;
}

function renderAdmin() {
  const pending = state.achievements.filter((a) => a.status === 'pending');
  document.getElementById('admin-pending-count').textContent = String(pending.length);

  // 1. Список мероприятий и праздников
  const evList = document.getElementById('admin-events-list');
  evList.innerHTML = '';
  state.events.forEach((ev) => {
    const catName = CITIES[ev.category]?.shortName || ev.category;
    const card = document.createElement('div');
    card.className = 'card event-card';
    card.innerHTML = `
      <div class="event-time-box cat-${ev.category}">
        <strong>${ev.time}</strong>
        <span>${ev.dateLabel}</span>
      </div>
      <div class="event-info">
        <div class="event-top-row">
          <span class="event-cat-pill cat-${ev.category}">${catName}${ev.kind === 'Праздник' ? ' · Праздник' : ''}</span>
          <span class="event-xp-tag">+${ev.xpPreview} XP (L=${ev.L}, A=${ev.A}, R=${ev.R})</span>
        </div>
        <div class="event-title">${ev.title}</div>
        <div class="event-loc">${ev.location}</div>
      </div>
      <button class="btn-remove" type="button">Удалить</button>
    `;
    card.querySelector('.btn-remove').addEventListener('click', () => {
      state.events = state.events.filter((x) => x.id !== ev.id);
      saveState();
      renderAdmin();
      showToast(`Мероприятие «${ev.title}» удалено`, 'info');
    });
    evList.appendChild(card);
  });

  // 2. Список расписания занятий
  const schList = document.getElementById('admin-schedule-list');
  schList.innerHTML = '';
  state.schedule.forEach((item) => {
    const catName = CITIES[item.category]?.shortName || item.category;
    const card = document.createElement('div');
    card.className = 'card event-card';
    card.innerHTML = `
      <div class="event-time-box cat-${item.category}">
        <strong>${item.day}</strong>
        <span>${item.time}</span>
      </div>
      <div class="event-info">
        <div class="event-top-row">
          <span class="event-cat-pill cat-${item.category}">${catName}</span>
        </div>
        <div class="event-title">${item.title}</div>
        <div class="event-loc">${item.place} · ${item.mentor}</div>
      </div>
      <button class="btn-remove" type="button">Удалить</button>
    `;
    card.querySelector('.btn-remove').addEventListener('click', () => {
      state.schedule = state.schedule.filter((x) => x.id !== item.id);
      saveState();
      renderAdmin();
      showToast(`Занятие «${item.title}» удалено из расписания`, 'info');
    });
    schList.appendChild(card);
  });

  // 3. Проверка заявок студентов (только администратор выставляет L, A, R!)
  const revList = document.getElementById('admin-reviews-list');
  revList.innerHTML = '';
  if (pending.length === 0) {
    revList.innerHTML = '<div class="card"><p class="modal-desc">Заявок на проверке сейчас нет.</p></div>';
  } else {
    pending.forEach((a) => {
      const catName = CITIES[a.category]?.shortName || a.category;
      const item = document.createElement('div');
      item.className = 'diary-item';
      item.innerHTML = `
        <div class="diary-item-top">
          <strong>${a.title}</strong>
          <span class="event-cat-pill cat-${a.category}">${catName}</span>
        </div>
        <div class="diary-meta">ID студента: ${a.studentId || state.profile.id} · ${a.createdAt}</div>
        ${a.note ? `<div class="diary-meta">Комментарий: ${a.note}</div>` : ''}
        <div class="form-row-3">
          <select class="form-input rev-L">
            <option value="0.25">L=0.25</option>
            <option value="0.50">L=0.50</option>
            <option value="0.75">L=0.75</option>
            <option value="1.00">L=1.00</option>
          </select>
          <select class="form-input rev-A">
            <option value="1">A=1</option>
            <option value="2">A=2</option>
            <option value="3">A=3</option>
          </select>
          <select class="form-input rev-R">
            <option value="0">R=0</option>
            <option value="1">R=1</option>
            <option value="2">R=2</option>
            <option value="2.5">R=2.5</option>
            <option value="3">R=3</option>
          </select>
        </div>
        <div class="input-with-btn">
          <button class="btn-primary btn-sm rev-approve" type="button">Одобрить и начислить</button>
          <button class="btn-remove rev-reject" type="button">Отклонить</button>
        </div>
      `;
      item.querySelector('.rev-approve').addEventListener('click', () => {
        const L = Number(item.querySelector('.rev-L').value);
        const A = Number(item.querySelector('.rev-A').value);
        const R = Number(item.querySelector('.rev-R').value);
        const res = calculateEventRewards({ V: 1, A, L, R, currentTotalAP: getTotalAP() });
        a.L = L;
        a.A = A;
        a.R = R;
        a.V = 1;
        a.status = 'approved';
        a.AP = res.AP;
        a.DP = res.DP;
        state.coinsEarned += res.DP;
        saveState();
        renderAdmin();
        renderHome();
        showToast(`Одобрено: +${res.AP} XP и +${res.DP} совиков`, 'success');
      });
      item.querySelector('.rev-reject').addEventListener('click', () => {
        a.V = 0;
        a.status = 'rejected';
        a.AP = 0;
        a.DP = 0;
        saveState();
        renderAdmin();
        showToast('Заявка отклонена', 'warning');
      });
      revList.appendChild(item);
    });
  }

  refreshAdminCodeBox();
  stopAdminCodeTimer();
  adminCodeTimerHandle = setInterval(refreshAdminCodeBox, 1000);
}

function renderAll() {
  renderHome();
  if (activeScreen === 'city') renderCity();
  if (activeScreen === 'owl') renderOwlHouse();
  if (activeScreen === 'profile') renderProfile();
  if (activeScreen === 'calendar') renderCalendar();
  if (activeScreen === 'rating') renderRating();
  if (activeScreen === 'admin') renderAdmin();
}

/* ---------- Дневник и лимит 5 заявок в неделю ---------- */
function renderDiary() {
  const listEl = document.getElementById('diary-items-list');
  listEl.innerHTML = '';

  if (state.achievements.length === 0) {
    listEl.innerHTML = '<p class="modal-desc">В дневнике пока нет записей. Подайте заявку или подтвердите участие на мероприятии.</p>';
  } else {
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
        <div class="diary-meta"><strong>${a.status === 'approved' ? `+${a.AP} XP, +${a.DP} совиков` : a.status === 'pending' ? 'На проверке администратором' : 'Отклонено · 0 XP'}</strong></div>
      `;
      listEl.appendChild(item);
    });
  }

  renderApplicationQuota();
}

function renderApplicationQuota() {
  const used = getWeeklySubmissionsCount(state.profile.id);
  const remaining = Math.max(0, MAX_WEEKLY_APPLICATIONS - used);
  const quotaEl = document.getElementById('app-weekly-limit-info');
  const submitBtn = document.getElementById('btn-submit-application');
  if (quotaEl) {
    quotaEl.textContent = `Заявок на этой неделе для ID ${state.profile.id}: ${used} из ${MAX_WEEKLY_APPLICATIONS} (осталось ${remaining})`;
  }
  if (submitBtn) {
    submitBtn.disabled = remaining === 0;
    submitBtn.title = remaining === 0 ? 'Достигнут недельный лимит: 5 заявок для одного ID' : '';
  }
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
    const previewHtml = item.file
      ? `<img src="${item.file}" class="shop-owl-preview" alt="${item.name}" />`
      : `<span class="swatch-preview" style="background: ${item.swatch};"></span>`;
    card.innerHTML = `
      ${previewHtml}
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

/* ---------- Подтверждение участия по коду ---------- */
function openVerifyModal(preselectEventId = null) {
  const select = document.getElementById('verify-event-select');
  select.innerHTML = '';
  state.events.forEach((ev) => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    const catName = CITIES[ev.category]?.shortName || ev.category;
    opt.textContent = `${ev.title} (${catName})`;
    select.appendChild(opt);
  });
  if (preselectEventId) select.value = preselectEventId;

  document.getElementById('verify-code-input').value = '';
  document.getElementById('verify-code-error').classList.add('hidden');
  openModal('modal-verify-code');
}

function openAdminLoginModal() {
  if (adminToken) {
    navigateTo('admin');
    return;
  }
  document.getElementById('admin-password-input').value = '';
  document.getElementById('admin-login-error').classList.add('hidden');
  openModal('modal-admin-login');
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

  document.querySelectorAll('.desktop-sidebar [data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
  });

  // Кликабельный профиль (с аватаркой совы) в боковой панели и на главном экране
  document.getElementById('btn-sidebar-brand-profile').addEventListener('click', () => navigateTo('profile'));
  document.getElementById('btn-sidebar-profile').addEventListener('click', () => navigateTo('profile'));
  document.getElementById('btn-home-quick-profile').addEventListener('click', () => navigateTo('profile'));
  document.getElementById('btn-open-profile').addEventListener('click', () => navigateTo('profile'));

  document.getElementById('btn-sidebar-search').addEventListener('click', () => {
    renderStudentSearch('');
    openModal('modal-search');
  });
  document.getElementById('btn-sidebar-verify').addEventListener('click', () => openVerifyModal());

  // Вход в админ-панель с проверкой пароля
  document.getElementById('btn-sidebar-admin').addEventListener('click', openAdminLoginModal);
  document.getElementById('btn-open-admin').addEventListener('click', openAdminLoginModal);
  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    adminToken = null;
    stopAdminCodeTimer();
    navigateTo('home');
    showToast('Вы вышли из раздела администратора', 'info');
  });

  document.getElementById('btn-admin-login-submit').addEventListener('click', async () => {
    const pwd = document.getElementById('admin-password-input').value;
    const errEl = document.getElementById('admin-login-error');
    if (!pwd) {
      errEl.textContent = 'Введите пароль.';
      errEl.classList.remove('hidden');
      return;
    }
    const token = await authenticateAdmin(pwd);
    if (!token) {
      errEl.textContent = 'Неверный пароль. Попробуйте ещё раз.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    adminToken = token;
    closeModal('modal-admin-login');
    navigateTo('admin');
    showToast('Вход в панель администратора выполнен', 'success');
  });

  // Вкладки админ-панели
  document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-admin-tab]').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-pane').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`admin-tab-${btn.dataset.adminTab}`).classList.add('active');
    });
  });

  document.getElementById('btn-admin-add-event').addEventListener('click', () => {
    const title = document.getElementById('adm-ev-title').value.trim();
    if (!title) {
      showToast('Укажите название мероприятия или праздника', 'warning');
      return;
    }
    const category = document.getElementById('adm-ev-cat').value;
    const kind = document.getElementById('adm-ev-kind').value;
    const location = document.getElementById('adm-ev-place').value.trim() || 'Кампус университета';
    const dateLabel = document.getElementById('adm-ev-date').value.trim() || '27 ноя';
    const time = document.getElementById('adm-ev-time').value.trim() || '12:00';
    const dayOffset = Number(document.getElementById('adm-ev-day').value) || 0;
    const L = Number(document.getElementById('adm-ev-level').value);
    const A = Number(document.getElementById('adm-ev-activity').value);
    const R = Number(document.getElementById('adm-ev-result').value);
    const preview = calculateEventRewards({ V: 1, A, L, R, currentTotalAP: getTotalAP() });

    state.events.unshift({
      id: `ev-${Date.now()}`,
      dayOffset,
      dateLabel,
      time,
      category,
      categoryLabel: CITIES[category]?.shortName || category,
      kind,
      title,
      location,
      L,
      A,
      R,
      xpPreview: preview.AP
    });
    saveState();
    document.getElementById('adm-ev-title').value = '';
    document.getElementById('adm-ev-place').value = '';
    renderAdmin();
    showToast(`Добавлено в афишу: ${title}`, 'success');
  });

  document.getElementById('btn-admin-add-schedule').addEventListener('click', () => {
    const title = document.getElementById('adm-sch-title').value.trim();
    if (!title) {
      showToast('Укажите название занятия', 'warning');
      return;
    }
    const category = document.getElementById('adm-sch-cat').value;
    const day = document.getElementById('adm-sch-day').value;
    const time = document.getElementById('adm-sch-time').value.trim() || '16:00–17:30';
    const place = document.getElementById('adm-sch-place').value.trim() || 'Главный корпус';
    const mentor = document.getElementById('adm-sch-mentor').value.trim() || 'Преподаватель кафедры';

    state.schedule.unshift({
      id: `sch-${Date.now()}`,
      day,
      time,
      title,
      category,
      place,
      mentor
    });
    saveState();
    document.getElementById('adm-sch-title').value = '';
    document.getElementById('adm-sch-place').value = '';
    document.getElementById('adm-sch-mentor').value = '';
    renderAdmin();
    showToast(`Занятие добавлено: ${title}`, 'success');
  });

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
    ['Приветствуем в «Астросовье»', 'Нажмите на сову для совета или настройте образ совы, цвет стен, свет и интерьер комнаты.'],
    ['Совет по развитию', 'Подтвердите участие в событии из афиши с помощью 6-значного кода, чтобы получить XP и совики.'],
    ['Оформление комнаты', 'Меняйте сову, цвет стен, освещение и декор с помощью кнопок под комнатой или значков «+».']
  ];
  let owlMsgIdx = 0;
  const triggerOwlReaction = () => {
    owlMsgIdx = (owlMsgIdx + 1) % owlMessages.length;
    owlMood = owlMood === 'happy' ? 'excited' : 'happy';
    document.getElementById('owl-speech-title').textContent = owlMessages[owlMsgIdx][0];
    document.getElementById('owl-speech-text').textContent = owlMessages[owlMsgIdx][1];
    renderOwlHouse();
  };
  document.getElementById('owl-speech-card').addEventListener('click', triggerOwlReaction);
  const mascotLayer = document.getElementById('owl-room-mascot');
  if (mascotLayer) {
    mascotLayer.addEventListener('click', triggerOwlReaction);
  }

  document.querySelectorAll('[data-slot]').forEach((btn) => {
    btn.addEventListener('click', () => openShop(btn.dataset.slot));
  });

  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
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
      renderApplicationQuota();
    });
  });

  document.getElementById('btn-submit-application').addEventListener('click', () => {
    const errEl = document.getElementById('app-form-error');
    const used = getWeeklySubmissionsCount(state.profile.id);
    if (used >= MAX_WEEKLY_APPLICATIONS) {
      errEl.textContent = `Лимит исчерпан: можно отправить не более ${MAX_WEEKLY_APPLICATIONS} заявок в неделю для одного ID.`;
      errEl.classList.remove('hidden');
      return;
    }

    const title = document.getElementById('app-title').value.trim();
    if (!title) {
      errEl.textContent = 'Укажите название мероприятия.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');

    const category = document.getElementById('app-category').value;
    const note = document.getElementById('app-note').value.trim();

    state.achievements.push({
      id: `ach-${Date.now()}`,
      title,
      category,
      L: 0.25,
      A: 1,
      R: 0,
      V: 0,
      status: 'pending',
      AP: 0,
      DP: 0,
      note,
      source: 'application',
      studentId: state.profile.id,
      weekKey: getISOWeekKey(),
      createdAt: new Date().toLocaleDateString('ru-RU')
    });
    saveState();
    document.getElementById('app-title').value = '';
    document.getElementById('app-note').value = '';
    renderDiary();
    document.querySelector('[data-diary-tab="list"]').click();
    showToast('Заявка отправлена администратору', 'success');
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
      errEl.textContent = 'Неверный или устаревший код. Уточните код у организатора.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    const evId = document.getElementById('verify-event-select').value;
    const ev = state.events.find((e) => e.id === evId) || state.events[0];
    if (!ev) {
      errEl.textContent = 'Список мероприятий пуст.';
      errEl.classList.remove('hidden');
      return;
    }
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
      source: 'code',
      studentId: state.profile.id,
      weekKey: getISOWeekKey(),
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
    statusEl: document.getElementById('m3-status-text'),
    onFirstMove: () => {
      state.lastMatch3PlayedDate = getTodayKey();
      state.lastMatch3Earned = 0;
      saveState();
      renderOwlHouse();
    },
    onUpdate: ({ earnedCoins }) => {
      state.lastMatch3Earned = earnedCoins;
      saveState();
    }
  });

  const bankMatch3Coins = (silentIfZero = true) => {
    const coins = match3.claimCoins();
    if (coins > 0) {
      state.coinsEarned += coins;
      state.lastMatch3Earned = coins;
      saveState();
      renderOwlHouse();
      renderHome();
      showToast(`Начислено +${coins} совиков`, 'success');
    } else if (!silentIfZero) {
      showToast('Наберите минимум 150 очков для получения 1 совика', 'warning');
    }
  };

  window.__claimMatch3OnClose = () => bankMatch3Coins(true);

  document.getElementById('btn-open-match3').addEventListener('click', () => {
    const lockedBox = document.getElementById('m3-daily-locked');
    const activeArea = document.getElementById('m3-active-area');
    const lockedDesc = document.getElementById('m3-locked-desc');

    if (hasPlayedMatch3Today()) {
      activeArea.classList.add('hidden');
      lockedBox.classList.remove('hidden');
      lockedDesc.textContent =
        state.lastMatch3Earned > 0
          ? `Сегодня вы уже сыграли и получили +${state.lastMatch3Earned} совиков. Возвращайтесь завтра.`
          : 'В «Три в ряд» можно играть 1 раз в день. Возвращайтесь завтра за новой попыткой.';
    } else {
      lockedBox.classList.add('hidden');
      activeArea.classList.remove('hidden');
      match3.start();
    }
    openModal('modal-match3');
  });
  document.getElementById('btn-m3-hint').addEventListener('click', () => match3.highlightHint());

  // Афиша: переключение Мероприятия / Расписание занятий
  document.getElementById('cal-tab-events').addEventListener('click', () => {
    calendarTab = 'events';
    document.getElementById('cal-tab-events').classList.add('active');
    document.getElementById('cal-tab-schedule').classList.remove('active');
    document.getElementById('calendar-events-pane').classList.add('active');
    document.getElementById('calendar-schedule-pane').classList.remove('active');
  });
  document.getElementById('cal-tab-schedule').addEventListener('click', () => {
    calendarTab = 'schedule';
    document.getElementById('cal-tab-schedule').classList.add('active');
    document.getElementById('cal-tab-events').classList.remove('active');
    document.getElementById('calendar-schedule-pane').classList.add('active');
    document.getElementById('calendar-events-pane').classList.remove('active');
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
