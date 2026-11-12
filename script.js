const stage = document.getElementById('stage');
const canvas = document.getElementById('virus-canvas');
const ctx = canvas.getContext('2d');
const pressText = document.getElementById('press-text');
const startBtn = document.getElementById('start-btn');
const recordsBtn = document.getElementById('records-btn');
const saveBtn = document.getElementById('save-btn');
const recordsModal = document.getElementById('records-modal');
const saveModal = document.getElementById('save-modal');

/* ---------- 나중에 기능을 채울 자리 ---------- */
function loadLastGame() {
  // TODO: 가장 최근 게임 기록을 불러와 이어하기
  document.getElementById('save-body').textContent = '저장된 기록 불러오기 기능은 준비 중입니다.';
}
function loadRecords() {
  // TODO: 며칠까지 뀀꽉 나라를 지켰는지 기록 표시
  document.getElementById('records-body').textContent = '지금까지의 기록 표시 기능은 준비 중입니다.';
}
function startGame() {
  // TODO: 게임 화면으로 이동
  console.log('start game');
}

/* ---------- 팝업 ---------- */
function openModal(modal) { modal.hidden = false; }
function closeModals() { recordsModal.hidden = true; saveModal.hidden = true; }
const isModalOpen = () => !recordsModal.hidden || !saveModal.hidden;

recordsBtn.addEventListener('click', () => { loadRecords(); openModal(recordsModal); });
saveBtn.addEventListener('click', () => { loadLastGame(); openModal(saveModal); });
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-close')) closeModals(); });
});
startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeModals();
  if (!isModalOpen()) startGame();
});

/* ---------- PRESS ANY KEY 깜빡임 ---------- */
// 마우스가 records/save 밖에서 움직일 때만 깜빡임
document.addEventListener('pointermove', e => {
  const onSprite = e.target.closest && e.target.closest('.sprite'); // 버튼 2개 + 중앙 START GAME
  pressText.classList.toggle('blink', !onSprite && !isModalOpen());
});
document.addEventListener('pointerleave', () => pressText.classList.remove('blink'));

/* ---------- 바이러스 ---------- */
let W = 0, H = 0, obstacles = [];
const viruses = [];

function resize() {
  const r = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  W = r.width; H = r.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // 가리면 안 되는 영역: 중앙 사각형과 두 버튼
  obstacles = [startBtn, recordsBtn, saveBtn].map(el => {
    const b = el.getBoundingClientRect();
    return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
  });
}

const hitsObstacle = (x, y, rad) => obstacles.find(o =>
  x + rad > o.x && x - rad < o.x + o.w && y + rad > o.y && y - rad < o.y + o.h);

function spawn() {
  viruses.length = 0;
  const count = Math.round(Math.min(32, Math.max(10, W * H / 70000))); // 화면이 클수록 많이
  for (let i = 0; i < count; i++) {
    const rad = (0.018 + Math.random() * 0.02) * Math.min(W, H * 1.78);
    let x, y, tries = 0;
    do { x = rad + Math.random() * (W - 2 * rad); y = rad + Math.random() * (H - 2 * rad); }
    while (hitsObstacle(x, y, rad) && ++tries < 100);
    const a = Math.random() * Math.PI * 2, s = (0.15 + Math.random() * 0.25) * W / 1000 * 1.5;
    viruses.push({ x, y, rad, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6, vr: (Math.random() - .5) * .01, alpha: .25 + Math.random() * .3 });
  }
}

function drawVirus(v) {
  ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.rot);
  ctx.globalAlpha = v.alpha;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, v.rad * 1.6);
  g.addColorStop(0, 'rgba(200,50,60,.5)'); g.addColorStop(1, 'rgba(200,50,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, v.rad * 1.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#a82832'; ctx.fillStyle = '#7a1620'; ctx.lineWidth = Math.max(1.5, v.rad * .1);
  for (let i = 0; i < 12; i++) { // 돌기
    const a = i / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    ctx.beginPath(); ctx.moveTo(c * v.rad * .8, s * v.rad * .8); ctx.lineTo(c * v.rad * 1.2, s * v.rad * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(c * v.rad * 1.25, s * v.rad * 1.25, v.rad * .1, 0, 7); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, v.rad * .8, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9525a'; // 눈
  ctx.fillRect(-v.rad * .35, -v.rad * .15, v.rad * .22, v.rad * .22);
  ctx.fillRect(v.rad * .13, -v.rad * .15, v.rad * .22, v.rad * .22);
  ctx.restore();
}

function step() {
  ctx.clearRect(0, 0, W, H);
  const m = 14; // 테두리 안쪽 여백
  for (const v of viruses) {
    v.x += v.vx; v.y += v.vy; v.rot += v.vr;
    const r = v.rad * 1.3;
    if (v.x < m + r) { v.x = m + r; v.vx = Math.abs(v.vx); }
    if (v.x > W - m - r) { v.x = W - m - r; v.vx = -Math.abs(v.vx); }
    if (v.y < m + r) { v.y = m + r; v.vy = Math.abs(v.vy); }
    if (v.y > H - m - r) { v.y = H - m - r; v.vy = -Math.abs(v.vy); }
    const o = hitsObstacle(v.x, v.y, r);
    if (o) { // 겹친 깊이가 가장 얕은 쪽으로 밀어내며 튕김
      const dl = v.x + r - o.x, dr = o.x + o.w - (v.x - r), dt = v.y + r - o.y, db = o.y + o.h - (v.y - r);
      const min = Math.min(dl, dr, dt, db);
      if (min === dl) { v.x = o.x - r; v.vx = -Math.abs(v.vx); }
      else if (min === dr) { v.x = o.x + o.w + r; v.vx = Math.abs(v.vx); }
      else if (min === dt) { v.y = o.y - r; v.vy = -Math.abs(v.vy); }
      else { v.y = o.y + o.h + r; v.vy = Math.abs(v.vy); }
    }
    drawVirus(v);
  }
  requestAnimationFrame(step);
}

window.addEventListener('resize', () => { resize(); spawn(); });
resize(); spawn(); step();
