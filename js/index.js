/* ── Dialog ──────────────────────────── */
const dialog   = document.getElementById('dialog');
const openBtns = [document.getElementById('guide-btn'), document.getElementById('nav-guide')];
const closeBtn = document.getElementById('dialog-close');

openBtns.forEach(b => b.addEventListener('click', () => dialog.classList.add('open')));
closeBtn.addEventListener('click', () => dialog.classList.remove('open'));
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.classList.remove('open'); });

/* ── Ripple ──────────────────────────── */
document.querySelectorAll('.btn-filled, .btn-tonal').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.classList.add('ripple');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

/* ── Preview Animation ───────────────── */
(function() {
  const canvas = document.getElementById('preview-canvas');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const B = 18;
  const COLS = Math.floor(W / B), ROWS = Math.floor(H / B);

  const COLORS = ['#00f0f0','#f0f000','#a000f0','#f0a000','#0000f0','#00f000','#f00000'];
  const board  = Array.from({length: ROWS}, () => Array(COLS).fill(null));

  for (let r = ROWS - 5; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (Math.random() > 0.25) board[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
  }
  board[ROWS-1] = Array(COLS).fill(COLORS[0]);

  const SHAPES = [
    {s:[[1,1,1,1]], color:'#00f0f0'},
    {s:[[0,1,0],[1,1,1]], color:'#a000f0'},
    {s:[[1,1],[1,1]], color:'#f0f000'},
  ];
  let cur = null, tick = 0;

  function spawnCur() {
    const p = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    cur = { shape: p.s, color: p.color, x: Math.floor(COLS/2)-1, y: 0 };
  }
  spawnCur();

  function drawB(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x*B+1, y*B+1, B-2, B-2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x*B+1, y*B+1, B-2, 3);
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#1e1e3a';
    ctx.lineWidth = 0.4;
    for (let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) ctx.strokeRect(c*B,r*B,B,B);

    board.forEach((row,r) => row.forEach((color,c) => { if(color) drawB(c,r,color); }));

    let gy = cur.y;
    while (gy+1 < ROWS && cur.shape.every((row,r)=>row.every((v,c)=>!v||!board[gy+r+1]?.[cur.x+c]))) gy++;
    ctx.globalAlpha = 0.2;
    cur.shape.forEach((row,r)=>row.forEach((v,c)=>{ if(v) drawB(cur.x+c, gy+r, cur.color); }));
    ctx.globalAlpha = 1;

    cur.shape.forEach((row,r)=>row.forEach((v,c)=>{ if(v) drawB(cur.x+c, cur.y+r, cur.color); }));

    tick++;
    if (tick % 30 === 0) {
      if (cur.y + 1 < ROWS && cur.shape.every((row,r)=>row.every((v,c)=>!v||!board[cur.y+r+1]?.[cur.x+c])))
        cur.y++;
      else {
        cur.shape.forEach((row,r)=>row.forEach((v,c)=>{ if(v && board[cur.y+r]) board[cur.y+r][cur.x+c]=cur.color; }));
        for(let r=ROWS-1;r>=0;) {
          if(board[r].every(c=>c)) { board.splice(r,1); board.unshift(Array(COLS).fill(null)); } else r--;
        }
        spawnCur();
      }
    }
    requestAnimationFrame(frame);
  }
  frame();
})();
