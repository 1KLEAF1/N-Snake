const CELL = 20, COLS = 20, ROWS = 20;

const DIFF_CONFIG = {
  easy:   { speed: 180, walls: false, label: 'ЛЕГКО',  desc: 'скорость: медленная · стены: нет' },
  medium: { speed: 120, walls: false, label: 'СРЕДНЕ', desc: 'скорость: средняя · стены: нет'  },
  hard:   { speed:  65, walls: true,  label: 'СЛОЖНО', desc: 'скорость: высокая · стены: смерть' }
};

let currentDiff = 'medium';
let playerName  = 'ИГРОК';
let score       = 0;
let bestScore   = 0;
let snake       = [];
let dir         = { x: 1, y: 0 };
let nextDir     = { x: 1, y: 0 };
let food        = { x: 0, y: 0 };
let gameLoop    = null;
let paused      = false;
let running     = false;


function showScreen(id) {
  document.querySelectorAll('.sg-screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'sc-records') renderRecords();
}


function setDiff(d) {
  currentDiff = d;
  document.querySelectorAll('.sg-diff-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('diff-' + d).classList.add('selected');
  document.getElementById('diff-desc').textContent = DIFF_CONFIG[d].desc;
}


const DB_KEY = 'snake_records_v1';

function dbGet() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
  catch { return []; }
}

function dbSave(records) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(records)); }
  catch (e) { console.warn('localStorage недоступен:', e); }
}

function dbAddRecord(name, sc, difficulty) {
  const records = dbGet();
  const entry = {
    name:  name.toUpperCase().trim() || 'ИГРОК',
    score: sc,
    diff:  difficulty,
    date:  new Date().toLocaleDateString('ru-RU')
  };
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const top = records.slice(0, 10);
  dbSave(top);
  return top[0].score === sc && top[0].name === entry.name;
}

function dbGetBest() {
  const r = dbGet();
  return r.length ? r[0].score : 0;
}


function renderRecords() {
  const records = dbGet();
  const el = document.getElementById('records-list');

  if (!records.length) {
    el.innerHTML = `<div class="sg-empty-records">НЕТ ЗАПИСЕЙ</div>`;
    return;
  }

  const header = `<div class="sg-rec-header">
    <span style="width:24px">#</span>
    <span style="flex:1;padding:0 10px">ИМЯ</span>
    <span>СЛОЖН</span>
    <span style="margin-left:16px">СЧЁТ</span>
    <span style="margin-left:10px;width:50px;text-align:right">ДАТА</span>
  </div>`;

  const rows = records.map((r, i) => `
    <div class="sg-rec-row${i === 0 ? ' top1' : ''}">
      <span class="rank">${i + 1}.</span>
      <span class="name">${r.name}</span>
      <span class="rdiff">${r.diff}</span>
      <span class="rscore">${r.score}</span>
      <span class="rdate">${r.date || ''}</span>
    </div>`).join('');

  el.innerHTML = header + rows;
}

function clearRecords() {
  if (confirm('Удалить все рекорды?')) {
    dbSave([]);
    renderRecords();
  }
}


function startGame() {
  playerName = document.getElementById('player-name').value.trim() || 'ИГРОК';
  bestScore  = dbGetBest();
  document.getElementById('hud-best').textContent = bestScore;
  document.getElementById('hud-diff').textContent  = DIFF_CONFIG[currentDiff].label;
  showScreen('sc-game');
  initGame();
}

function restartGame() {
  showScreen('sc-game');
  initGame();
}

function exitToMenu() {
  clearInterval(gameLoop);
  running = false;
  showScreen('sc-menu');
}

function initGame() {
  clearInterval(gameLoop);
  score   = 0;
  paused  = false;
  running = true;

  document.getElementById('hud-score').textContent = '0';

  snake   = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };

  placeFood();
  draw();
  gameLoop = setInterval(tick, DIFF_CONFIG[currentDiff].speed);
}


function placeFood() {
  let f;
  do {
    f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === f.x && s.y === f.y));
  food = f;
}

function tick() {
  if (paused || !running) return;

  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (DIFF_CONFIG[currentDiff].walls) {
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame(); return;
    }
  } else {
    head.x = (head.x + COLS) % COLS;
    head.y = (head.y + ROWS) % ROWS;
  }

  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    endGame(); return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    document.getElementById('hud-score').textContent = score;
    if (score > bestScore) {
      bestScore = score;
      document.getElementById('hud-best').textContent = bestScore;
    }
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  clearInterval(gameLoop);
  running = false;

  const isNewRecord = dbAddRecord(playerName, score, DIFF_CONFIG[currentDiff].label);

  document.getElementById('go-score').textContent  = score;
  document.getElementById('go-length').textContent = snake.length;
  document.getElementById('go-diff').textContent   = DIFF_CONFIG[currentDiff].label;
  document.getElementById('go-newrecord').style.display = (isNewRecord && score > 0) ? 'block' : 'none';

  showScreen('sc-gameover');
}


const cvs = document.getElementById('sg-canvas');
const ctx  = cvs.getContext('2d');

function draw() {
  
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, 400, 400);

  
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = '#07070c';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  
  ctx.fillStyle = '#ff3355';
  ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
  ctx.strokeStyle = '#ff6677';
  ctx.lineWidth = 1;
  ctx.strokeRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);

  
  ctx.strokeStyle = '#ff1144';
  ctx.lineWidth = 1;
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  ctx.beginPath();
  ctx.moveTo(fx - 3, fy); ctx.lineTo(fx + 3, fy);
  ctx.moveTo(fx, fy - 3); ctx.lineTo(fx, fy + 3);
  ctx.stroke();

  
  snake.forEach((s, i) => {
    const t = i / snake.length;
    if (i === 0) {
      ctx.fillStyle = '#00ff88';
    } else {
      const g = Math.floor(200 * (1 - t * 0.65));
      const b = Math.floor(80  * (1 - t));
      ctx.fillStyle = `rgb(0, ${g}, ${b})`;
    }
    ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);

    
    if (i === 0) {
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);

      
      const eyeOff = 4;
      ctx.fillStyle = '#0a0a0f';
      if (dir.x === 1) {
        ctx.fillRect(s.x * CELL + 14, s.y * CELL + eyeOff,     3, 3);
        ctx.fillRect(s.x * CELL + 14, s.y * CELL + CELL - eyeOff - 3, 3, 3);
      } else if (dir.x === -1) {
        ctx.fillRect(s.x * CELL + 3,  s.y * CELL + eyeOff,     3, 3);
        ctx.fillRect(s.x * CELL + 3,  s.y * CELL + CELL - eyeOff - 3, 3, 3);
      } else if (dir.y === -1) {
        ctx.fillRect(s.x * CELL + eyeOff,             s.y * CELL + 3,  3, 3);
        ctx.fillRect(s.x * CELL + CELL - eyeOff - 3,  s.y * CELL + 3,  3, 3);
      } else {
        ctx.fillRect(s.x * CELL + eyeOff,             s.y * CELL + 14, 3, 3);
        ctx.fillRect(s.x * CELL + CELL - eyeOff - 3,  s.y * CELL + 14, 3, 3);
      }
    }
  });

  if (paused) {
    ctx.fillStyle = 'rgba(5, 5, 8, 0.78)';
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = '#00ff88';
    ctx.font = '700 18px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ПАУЗА', 200, 192);
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#444';
    ctx.fillText('нажмите ПРОБЕЛ для продолжения', 200, 216);
    ctx.textAlign = 'left';
  }
}


const KEY_MAP = {
  ArrowUp:    { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
  ArrowDown:  { x: 0, y:  1 }, KeyS: { x: 0, y:  1 },
  ArrowLeft:  { x:-1, y:  0 }, KeyA: { x:-1, y:  0 },
  ArrowRight: { x: 1, y:  0 }, KeyD: { x: 1, y:  0 }
};

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (running) { e.preventDefault(); paused = !paused; if (!paused) draw(); }
    return;
  }
  const nd = KEY_MAP[e.code];
  if (nd && running) {
    e.preventDefault();
    if (!(nd.x === -dir.x && nd.y === -dir.y)) nextDir = nd;
  }
});


document.getElementById('player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') startGame();
});

setDiff('medium');
