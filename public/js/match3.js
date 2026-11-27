/**
 * Mini-game "Три в ряд" (Match-3) for earning extra Coins (DP).
 */

const TILES = ['🦉', '📚', '🏆', '🧪', '🎨', '⭐'];
const SIZE = 6;
const INITIAL_MOVES = 15;

export class Match3Game {
  constructor({ boardEl, scoreEl, movesEl, earnedEl, onUpdate }) {
    this.boardEl = boardEl;
    this.scoreEl = scoreEl;
    this.movesEl = movesEl;
    this.earnedEl = earnedEl;
    this.onUpdate = onUpdate;

    this.grid = [];
    this.selected = null;
    this.score = 0;
    this.moves = INITIAL_MOVES;
    this.earnedCoins = 0;
    this.claimed = false;
  }

  start() {
    this.score = 0;
    this.moves = INITIAL_MOVES;
    this.earnedCoins = 0;
    this.claimed = false;
    this.selected = null;
    this.grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let tile;
        do {
          tile = TILES[Math.floor(Math.random() * TILES.length)];
        } while (
          (c >= 2 && this.grid[r][c - 1] === tile && this.grid[r][c - 2] === tile) ||
          (r >= 2 && this.grid[r - 1][c] === tile && this.grid[r - 2][c] === tile)
        );
        this.grid[r][c] = tile;
      }
    }
    this.render();
  }

  handleCellClick(r, c) {
    if (this.moves <= 0) return;

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
    this.swap(prev.r, prev.c, r, c);
    const matches = this.findMatches();

    if (matches.size === 0) {
      // Invalid move: swap back
      this.swap(prev.r, prev.c, r, c);
      this.render();
      return;
    }

    this.moves -= 1;
    this.resolveMatches(matches);
    this.render();
  }

  swap(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
  }

  findMatches() {
    const matched = new Set();
    // Horizontal
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE - 2; c++) {
        const t = this.grid[r][c];
        if (t && t === this.grid[r][c + 1] && t === this.grid[r][c + 2]) {
          matched.add(`${r},${c}`);
          matched.add(`${r},${c + 1}`);
          matched.add(`${r},${c + 2}`);
        }
      }
    }
    // Vertical
    for (let c = 0; c < SIZE; c++) {
      for (let r = 0; r < SIZE - 2; r++) {
        const t = this.grid[r][c];
        if (t && t === this.grid[r + 1][c] && t === this.grid[r + 2][c]) {
          matched.add(`${r},${c}`);
          matched.add(`${r + 1},${c}`);
          matched.add(`${r + 2},${c}`);
        }
      }
    }
    return matched;
  }

  resolveMatches(initialMatches) {
    let matches = initialMatches;
    let combo = 1;
    while (matches.size > 0) {
      this.score += matches.size * 10 * combo;
      for (const key of matches) {
        const [r, c] = key.split(',').map(Number);
        this.grid[r][c] = null;
      }
      this.collapseAndRefill();
      matches = this.findMatches();
      combo += 1;
    }
    this.earnedCoins = Math.floor(this.score / 15);
    if (this.onUpdate) this.onUpdate({ score: this.score, moves: this.moves, earnedCoins: this.earnedCoins });
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
        this.grid[writeRow][c] = TILES[Math.floor(Math.random() * TILES.length)];
        writeRow -= 1;
      }
    }
  }

  claimCoins() {
    if (this.claimed || this.earnedCoins <= 0) return 0;
    const reward = this.earnedCoins;
    this.claimed = true;
    this.earnedCoins = 0;
    this.score = 0;
    this.start();
    return reward;
  }

  render() {
    this.scoreEl.textContent = String(this.score);
    this.movesEl.textContent = String(this.moves);
    this.earnedEl.textContent = String(this.earnedCoins);

    this.boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'm3-cell';
        if (this.selected && this.selected.r === r && this.selected.c === c) {
          btn.classList.add('selected');
        }
        btn.textContent = this.grid[r][c];
        btn.addEventListener('click', () => this.handleCellClick(r, c));
        this.boardEl.appendChild(btn);
      }
    }
  }
}
