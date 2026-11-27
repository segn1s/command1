/**
 * Полноценная мини-игра «Три в ряд» 7x7 для «Астросовья»:
 * - 6 чётких векторных фишек (различаются по форме и цвету)
 * - Анимация схлопывания и каскадного падения
 * - Усилители за 4 в ряд (линейный заряд) и 5 в ряд (звёздный взрыв)
 * - Подсказка хода, автоперемешивание при отсутствии ходов, сниженный баланс совиков
 */

const SIZE = 7;
const INITIAL_MOVES = 18;
const POINTS_PER_COIN = 150;
const COIN_GOAL_TARGET = 1200;

const GEM_TYPES = [
  {
    id: 'sapphire',
    label: 'Сапфир',
    svg: `<svg viewBox="0 0 36 36"><polygon points="18,3 31,14 25,31 11,31 5,14" fill="#0059DA"/><polygon points="18,8 25,15 21,26 15,26 11,15" fill="#4D90F0"/></svg>`
  },
  {
    id: 'amber',
    label: 'Звезда',
    svg: `<svg viewBox="0 0 36 36"><polygon points="18,3 22,13 33,13 24,20 27,31 18,24 9,31 12,20 3,13 14,13" fill="#C99A2E"/><circle cx="18" cy="18" r="4" fill="#FDE68A"/></svg>`
  },
  {
    id: 'emerald',
    label: 'Кристалл',
    svg: `<svg viewBox="0 0 36 36"><polygon points="18,3 31,18 18,33 5,18" fill="#16A34A"/><polygon points="18,9 25,18 18,27 11,18" fill="#86EFAC"/></svg>`
  },
  {
    id: 'violet',
    label: 'Планета',
    svg: `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="9" fill="#5B21B6"/><ellipse cx="18" cy="18" rx="15" ry="5" fill="none" stroke="#A78BFA" stroke-width="2.6" transform="rotate(-24 18 18)"/></svg>`
  },
  {
    id: 'ruby',
    label: 'Рубин',
    svg: `<svg viewBox="0 0 36 36"><rect x="7" y="7" width="22" height="22" rx="6" fill="#DC2626"/><rect x="12" y="12" width="12" height="12" rx="3" fill="#FCA5A5"/></svg>`
  },
  {
    id: 'cyan',
    label: 'Капля',
    svg: `<svg viewBox="0 0 36 36"><path d="M18,3 C26,13 29,20 29,24 A11,11 0 1,1 7,24 C7,20 10,13 18,3 Z" fill="#0284C7"/><circle cx="15" cy="24" r="3" fill="#BAE6FD"/></svg>`
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Match3Game {
  constructor({ boardEl, scoreEl, movesEl, comboEl, earnedEl, progressEl, statusEl, onUpdate }) {
    this.boardEl = boardEl;
    this.scoreEl = scoreEl;
    this.movesEl = movesEl;
    this.comboEl = comboEl;
    this.earnedEl = earnedEl;
    this.progressEl = progressEl;
    this.statusEl = statusEl;
    this.onUpdate = onUpdate;

    this.grid = [];
    this.selected = null;
    this.hintPair = null;
    this.clearingKeys = new Set();
    this.busy = false;
    this.score = 0;
    this.moves = INITIAL_MOVES;
    this.combo = 1;
    this.earnedCoins = 0;
  }

  makeTile(typeIndex, special = null) {
    return { type: typeIndex, special };
  }

  start() {
    this.score = 0;
    this.moves = INITIAL_MOVES;
    this.combo = 1;
    this.earnedCoins = 0;
    this.selected = null;
    this.hintPair = null;
    this.clearingKeys.clear();
    this.busy = false;
    this.grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let idx;
        do {
          idx = Math.floor(Math.random() * GEM_TYPES.length);
        } while (
          (c >= 2 && this.grid[r][c - 1]?.type === idx && this.grid[r][c - 2]?.type === idx) ||
          (r >= 2 && this.grid[r - 1][c]?.type === idx && this.grid[r - 2][c]?.type === idx)
        );
        this.grid[r][c] = this.makeTile(idx);
      }
    }

    if (!this.findHintMove()) {
      this.shuffleBoard();
    }
    this.setStatus('Меняйте местами соседние фишки для сбора линий от 3 штук');
    this.render();
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  async handleCellClick(r, c) {
    if (this.busy || this.moves <= 0) return;
    this.hintPair = null;

    if (!this.selected) {
      this.selected = { r, c };
      this.render();
      return;
    }

    const prev = this.selected;
    if (prev.r === r && prev.c === c) {
      this.selected = null;
      this.render();
      return;
    }

    const dist = Math.abs(prev.r - r) + Math.abs(prev.c - c);
    if (dist !== 1) {
      this.selected = { r, c };
      this.render();
      return;
    }

    this.selected = null;
    this.busy = true;
    this.swap(prev.r, prev.c, r, c);
    this.render();

    const a = this.grid[prev.r][prev.c];
    const b = this.grid[r][c];
    const starTriggered = a?.special === 'star' || b?.special === 'star';

    const matchInfo = this.findMatchGroups();
    if (!starTriggered && matchInfo.matched.size === 0) {
      await sleep(140);
      this.swap(prev.r, prev.c, r, c);
      this.setStatus('Этот ход не создаёт комбинацию');
      this.busy = false;
      this.render();
      return;
    }

    this.moves -= 1;
    this.combo = 1;

    if (starTriggered) {
      const targetType = a?.special === 'star' ? b?.type : a?.type;
      const toClear = new Set([`${prev.r},${prev.c}`, `${r},${c}`]);
      for (let rr = 0; rr < SIZE; rr++) {
        for (let cc = 0; cc < SIZE; cc++) {
          if (this.grid[rr][cc]?.type === targetType) {
            toClear.add(`${rr},${cc}`);
          }
        }
      }
      await this.clearAndCascade(toClear, null);
    } else {
      await this.resolveLoop({ r1: prev.r, c1: prev.c, r2: r, c2: c });
    }

    if (this.moves > 0 && !this.findHintMove()) {
      this.shuffleBoard();
      this.setStatus('Нет доступных ходов — поле перемешано');
    } else if (this.moves === 0) {
      this.setStatus(`Ходы закончились. Можно забрать +${this.earnedCoins} совиков или начать заново.`);
    }

    this.busy = false;
    this.render();
  }

  swap(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
  }

  findMatchGroups() {
    const matched = new Set();
    const groups = [];

    // Горизонтальные линии
    for (let r = 0; r < SIZE; r++) {
      let c = 0;
      while (c < SIZE) {
        const type = this.grid[r][c]?.type;
        if (type === undefined || type === null) {
          c += 1;
          continue;
        }
        let end = c + 1;
        while (end < SIZE && this.grid[r][end]?.type === type) end += 1;
        const len = end - c;
        if (len >= 3) {
          const cells = [];
          for (let k = c; k < end; k++) {
            cells.push({ r, c: k });
            matched.add(`${r},${k}`);
          }
          groups.push({ len, cells, type });
        }
        c = end;
      }
    }

    // Вертикальные линии
    for (let c = 0; c < SIZE; c++) {
      let r = 0;
      while (r < SIZE) {
        const type = this.grid[r][c]?.type;
        if (type === undefined || type === null) {
          r += 1;
          continue;
        }
        let end = r + 1;
        while (end < SIZE && this.grid[end][c]?.type === type) end += 1;
        const len = end - r;
        if (len >= 3) {
          const cells = [];
          for (let k = r; k < end; k++) {
            cells.push({ r: k, c });
            matched.add(`${k},${c}`);
          }
          groups.push({ len, cells, type });
        }
        r = end;
      }
    }

    return { matched, groups };
  }

  expandSpecials(matchedSet) {
    const queue = [...matchedSet];
    const visited = new Set(matchedSet);
    while (queue.length > 0) {
      const key = queue.shift();
      const [r, c] = key.split(',').map(Number);
      const tile = this.grid[r][c];
      if (tile?.special === 'line') {
        for (let i = 0; i < SIZE; i++) {
          const hKey = `${r},${i}`;
          const vKey = `${i},${c}`;
          if (!visited.has(hKey)) {
            visited.add(hKey);
            queue.push(hKey);
          }
          if (!visited.has(vKey)) {
            visited.add(vKey);
            queue.push(vKey);
          }
        }
      }
    }
    return visited;
  }

  async resolveLoop(lastSwap = null) {
    let info = this.findMatchGroups();
    while (info.matched.size > 0) {
      let spawnSpecial = null;
      for (const g of info.groups) {
        if (g.len >= 5) {
          const anchor = lastSwap ? g.cells.find((p) => (p.r === lastSwap.r2 && p.c === lastSwap.c2) || (p.r === lastSwap.r1 && p.c === lastSwap.c1)) || g.cells[0] : g.cells[0];
          spawnSpecial = { ...anchor, type: g.type, special: 'star' };
          break;
        }
        if (g.len === 4 && !spawnSpecial) {
          const anchor = lastSwap ? g.cells.find((p) => (p.r === lastSwap.r2 && p.c === lastSwap.c2) || (p.r === lastSwap.r1 && p.c === lastSwap.c1)) || g.cells[1] : g.cells[1];
          spawnSpecial = { ...anchor, type: g.type, special: 'line' };
        }
      }

      const expanded = this.expandSpecials(info.matched);
      await this.clearAndCascade(expanded, spawnSpecial);
      lastSwap = null;
      this.combo += 1;
      info = this.findMatchGroups();
    }
    this.combo = 1;
  }

  async clearAndCascade(keysToClear, spawnSpecial) {
    this.clearingKeys = keysToClear;
    this.render();
    await sleep(170);

    this.score += keysToClear.size * 12 * this.combo;
    this.earnedCoins = Math.floor(this.score / POINTS_PER_COIN);

    if (this.combo >= 2) {
      this.setStatus(`Серия x${this.combo}: +${keysToClear.size * 12 * this.combo} очков`);
    } else if (spawnSpecial?.special === 'star') {
      this.setStatus('Создан звёздный заряд (5 в ряд)');
    } else if (spawnSpecial?.special === 'line') {
      this.setStatus('Создан линейный заряд (4 в ряд)');
    } else {
      this.setStatus(`Комбинация засчитана: +${keysToClear.size * 12} очков`);
    }

    for (const key of keysToClear) {
      const [r, c] = key.split(',').map(Number);
      this.grid[r][c] = null;
    }

    if (spawnSpecial) {
      this.grid[spawnSpecial.r][spawnSpecial.c] = this.makeTile(spawnSpecial.type, spawnSpecial.special);
    }

    this.clearingKeys.clear();
    this.collapseAndRefill();
    this.render();
    await sleep(170);

    if (this.onUpdate) {
      this.onUpdate({ score: this.score, moves: this.moves, earnedCoins: this.earnedCoins });
    }
  }

  collapseAndRefill() {
    for (let c = 0; c < SIZE; c++) {
      let writeRow = SIZE - 1;
      for (let r = SIZE - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          this.grid[writeRow][c] = this.grid[r][c];
          if (writeRow !== r) this.grid[r][c] = null;
          writeRow -= 1;
        }
      }
      while (writeRow >= 0) {
        this.grid[writeRow][c] = this.makeTile(Math.floor(Math.random() * GEM_TYPES.length));
        writeRow -= 1;
      }
    }
  }

  findHintMove() {
    const dirs = [[0, 1], [1, 0]];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= SIZE || nc >= SIZE) continue;
          this.swap(r, c, nr, nc);
          const hasMatch = this.findMatchGroups().matched.size > 0;
          this.swap(r, c, nr, nc);
          if (hasMatch) {
            return [{ r, c }, { r: nr, c: nc }];
          }
        }
      }
    }
    return null;
  }

  highlightHint() {
    if (this.busy || this.moves <= 0) return;
    const hint = this.findHintMove();
    if (hint) {
      this.hintPair = hint;
      this.setStatus('Подсказка подсвечена на поле');
      this.render();
    } else {
      this.shuffleBoard();
      this.setStatus('Поле перемешано');
      this.render();
    }
  }

  shuffleBoard() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let idx;
        do {
          idx = Math.floor(Math.random() * GEM_TYPES.length);
        } while (
          (c >= 2 && this.grid[r][c - 1]?.type === idx && this.grid[r][c - 2]?.type === idx) ||
          (r >= 2 && this.grid[r - 1][c]?.type === idx && this.grid[r - 2][c]?.type === idx)
        );
        this.grid[r][c] = this.makeTile(idx);
      }
    }
  }

  claimCoins() {
    if (this.busy || this.earnedCoins <= 0) return 0;
    const reward = this.earnedCoins;
    this.start();
    return reward;
  }

  render() {
    this.scoreEl.textContent = String(this.score);
    this.movesEl.textContent = String(this.moves);
    if (this.comboEl) this.comboEl.textContent = `x${this.combo}`;
    this.earnedEl.textContent = `+${this.earnedCoins}`;
    if (this.progressEl) {
      const pct = Math.min(100, Math.round((this.score / COIN_GOAL_TARGET) * 100));
      this.progressEl.style.width = `${pct}%`;
    }

    this.boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const tile = this.grid[r][c];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'm3-cell';
        if (this.selected && this.selected.r === r && this.selected.c === c) {
          btn.classList.add('selected');
        }
        if (
          this.hintPair &&
          ((this.hintPair[0].r === r && this.hintPair[0].c === c) ||
            (this.hintPair[1].r === r && this.hintPair[1].c === c))
        ) {
          btn.classList.add('hinted');
        }
        if (this.clearingKeys.has(`${r},${c}`)) {
          btn.classList.add('clearing');
        }
        if (tile?.special === 'line') btn.classList.add('special-line');
        if (tile?.special === 'star') btn.classList.add('special-star');

        if (tile) {
          btn.setAttribute('aria-label', GEM_TYPES[tile.type].label);
          btn.innerHTML = GEM_TYPES[tile.type].svg;
        }
        btn.addEventListener('click', () => this.handleCellClick(r, c));
        this.boardEl.appendChild(btn);
      }
    }
  }
}
