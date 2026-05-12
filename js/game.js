const COLS = 10, ROWS = 20;
let BLOCK = 30;

const PIECES = [
  { shape: [[1,1,1,1]],               color: '#00f0f0' },
  { shape: [[1,1],[1,1]],             color: '#f0f000' },
  { shape: [[0,1,0],[1,1,1]],         color: '#a000f0' },
  { shape: [[1,0],[1,0],[1,1]],       color: '#f0a000' },
  { shape: [[0,1],[0,1],[1,1]],       color: '#0000f0' },
  { shape: [[0,1,1],[1,1,0]],         color: '#00f000' },
  { shape: [[1,1,0],[0,1,1]],         color: '#f00000' },
];

const canvas     = document.getElementById('board');
const ctx        = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nCtx       = nextCanvas.getContext('2d');
const scoreEl    = document.getElementById('score');
const linesEl    = document.getElementById('lines');
const levelEl    = document.getElementById('level');
const btn        = document.getElementById('btn');
const themeBtn   = document.getElementById('theme-btn');
const musicBtn   = document.getElementById('music-btn');
const bgm        = document.getElementById('bgm');

/* ── 반응형 캔버스 크기 계산 ────────────────────────── */
function getNextBlockSize() {
  return Math.max(12, Math.floor(BLOCK * 0.62));
}

function initLayout() {
  const isMobile = window.innerWidth <= 640;
  if (isMobile) {
    const hPad = 24;
    const availW = window.innerWidth - hPad;
    // topbar(50) + panel(62) + gap(16) + gamepad(185) + margins(30) = ~343px 예약
    const reservedH = 50 + 62 + 16 + 185 + 30;
    const availH = window.innerHeight - reservedH;
    const byW = Math.floor(availW / COLS);
    const byH = Math.floor(Math.max(availH, ROWS * 14) / ROWS);
    BLOCK = Math.max(14, Math.min(byW, byH));
  } else {
    BLOCK = 30;
  }
  canvas.width  = BLOCK * COLS;
  canvas.height = BLOCK * ROWS;

  const ns = getNextBlockSize();
  nextCanvas.width  = ns * 5;
  nextCanvas.height = ns * 5;
}

/* ── 테마 ──────────────────────────────────────────── */
let isDark = true;
themeBtn.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeBtn.textContent = isDark ? '🌙' : '☀️';
});

/* ── 음악 ──────────────────────────────────────────── */
let musicOn = false;
bgm.volume = 0.45;

musicBtn.addEventListener('click', () => {
  musicOn = !musicOn;
  if (musicOn) { bgm.play().catch(() => {}); musicBtn.textContent = '🔊'; }
  else          { bgm.pause();               musicBtn.textContent = '🔇'; }
});

/* ── 게임 상태 ─────────────────────────────────────── */
let board = newBoard(), piece, nextPiece;
let score, lines, level, gameOver, running, dropTimer, dropInterval;

function newBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return {
    shape: p.shape.map(r => [...r]),
    color: p.color,
    x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2),
    y: 0,
  };
}

function rotate(shape) {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function valid(b, p, ox = 0, oy = 0, shape = p.shape) {
  return shape.every((row, r) =>
    row.every((cell, c) => {
      if (!cell) return true;
      const nx = p.x + c + ox, ny = p.y + r + oy;
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !b[ny]?.[nx];
    })
  );
}

function place(b, p) {
  p.shape.forEach((row, r) =>
    row.forEach((cell, c) => { if (cell) b[p.y + r][p.x + c] = p.color; })
  );
}

function clearLines(b) {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; ) {
    if (b[r].every(cell => cell)) { b.splice(r, 1); b.unshift(Array(COLS).fill(null)); cleared++; }
    else r--;
  }
  return cleared;
}

const LINE_SCORES = [0, 100, 300, 500, 800];

function syncMobileBtns(label) {
  const gcStart = document.getElementById('gc-start');
  if (gcStart) gcStart.textContent = label;
}

function spawn() {
  piece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  if (!valid(board, piece)) {
    gameOver = true;
    running  = false;
    btn.textContent = 'RESTART';
    syncMobileBtns('RESTART');
    drawOverlay();
    if (musicOn) { bgm.pause(); bgm.currentTime = 0; musicOn = false; musicBtn.textContent = '🔇'; }
  }
}

function drop() {
  if (!running) return;
  if (valid(board, piece, 0, 1)) {
    piece.y++;
  } else {
    place(board, piece);
    const n = clearLines(board);
    if (n) {
      lines += n;
      score += LINE_SCORES[n] * level;
      level  = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 100);
      clearInterval(dropTimer);
      dropTimer = setInterval(() => { if (running) drop(); }, dropInterval);
      updateUI();
    }
    spawn();
  }
}

function hardDrop() {
  while (valid(board, piece, 0, 1)) piece.y++;
  drop();
}

function updateUI() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

/* ── 그리기 ────────────────────────────────────────── */
function drawBlock(context, x, y, color, size = BLOCK) {
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.18)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.fillStyle = 'rgba(0,0,0,0.25)';
  context.fillRect(x * size + 1, y * size + size - 5, size - 2, 4);
}

function drawGhost() {
  let gy = piece.y;
  while (valid(board, { ...piece, y: gy + 1 })) gy++;
  if (gy === piece.y) return;
  ctx.globalAlpha = 0.2;
  piece.shape.forEach((row, r) =>
    row.forEach((cell, c) => { if (cell) drawBlock(ctx, piece.x + c, gy + r, piece.color); })
  );
  ctx.globalAlpha = 1;
}

function draw() {
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = gridColor || '#1e1e3a';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);

  board.forEach((row, r) =>
    row.forEach((color, c) => { if (color) drawBlock(ctx, c, r, color); })
  );

  if (running && piece) {
    drawGhost();
    piece.shape.forEach((row, r) =>
      row.forEach((cell, c) => { if (cell) drawBlock(ctx, piece.x + c, piece.y + r, piece.color); })
    );
  }

  // Next 블록 미리보기
  const ns = getNextBlockSize();
  nCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (nextPiece) {
    const offX = Math.floor((5 - nextPiece.shape[0].length) / 2);
    const offY = Math.floor((5 - nextPiece.shape.length) / 2);
    nextPiece.shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) {
          nCtx.fillStyle = nextPiece.color;
          nCtx.fillRect((offX + c) * ns + 1, (offY + r) * ns + 1, ns - 2, ns - 2);
        }
      })
    );
  }

  requestAnimationFrame(draw);
}

function drawOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e94560';
  ctx.font = `bold ${Math.max(16, BLOCK)}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - BLOCK * 0.6);
  ctx.fillStyle = '#eee';
  ctx.font = `${Math.max(11, Math.floor(BLOCK * 0.55))}px Courier New`;
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + BLOCK * 0.6);
}

/* ── 시작 ──────────────────────────────────────────── */
function startGame() {
  board = newBoard();
  score = 0; lines = 0; level = 1;
  dropInterval = 800;
  gameOver = false;
  running  = true;
  nextPiece = randomPiece();
  spawn();
  updateUI();
  btn.textContent = 'RESTART';
  syncMobileBtns('RESTART');
  clearInterval(dropTimer);
  dropTimer = setInterval(() => { if (running) drop(); }, dropInterval);
  if (musicOn) { bgm.currentTime = 0; bgm.play().catch(() => {}); }
}

btn.addEventListener('click', startGame);

/* ── 키보드 입력 ───────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (!running) return;
  switch (e.key) {
    case 'ArrowLeft':  if (valid(board, piece, -1)) piece.x--; break;
    case 'ArrowRight': if (valid(board, piece,  1)) piece.x++; break;
    case 'ArrowDown':  drop(); break;
    case 'ArrowUp': {
      const r = rotate(piece.shape);
      if (valid(board, piece, 0, 0, r)) piece.shape = r;
      break;
    }
    case ' ': e.preventDefault(); hardDrop(); break;
  }
});

/* ── 모바일 게임패드 ────────────────────────────────── */
function bindGamepadBtn(id, action, { repeat = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  let timer = null;

  const press = (e) => {
    e.preventDefault();
    el.classList.add('pressed');
    action();
    if (repeat) timer = setInterval(action, 130);
  };

  const release = (e) => {
    e.preventDefault();
    el.classList.remove('pressed');
    clearInterval(timer);
    timer = null;
  };

  el.addEventListener('touchstart',  press,   { passive: false });
  el.addEventListener('touchend',    release, { passive: false });
  el.addEventListener('touchcancel', release, { passive: false });
  // 데스크탑 테스트용
  el.addEventListener('mousedown',   press);
  el.addEventListener('mouseup',     release);
  el.addEventListener('mouseleave',  release);
}

function setupGamepad() {
  bindGamepadBtn('gc-left',   () => { if (running && valid(board, piece, -1)) piece.x--; }, { repeat: true });
  bindGamepadBtn('gc-right',  () => { if (running && valid(board, piece,  1)) piece.x++; }, { repeat: true });
  bindGamepadBtn('gc-down',   () => { if (running) drop(); },                               { repeat: true });
  bindGamepadBtn('gc-rotate', () => {
    if (!running) return;
    const r = rotate(piece.shape);
    if (valid(board, piece, 0, 0, r)) piece.shape = r;
  });
  bindGamepadBtn('gc-drop',  () => { if (running) hardDrop(); });
  bindGamepadBtn('gc-start', () => startGame());
}

/* ── 화면 크기 변화 대응 ────────────────────────────── */
window.addEventListener('resize', () => {
  initLayout();
  // 게임 오버 상태면 오버레이 다시 그리기
  if (gameOver) drawOverlay();
});

/* ── 초기화 ────────────────────────────────────────── */
initLayout();
setupGamepad();
draw();
