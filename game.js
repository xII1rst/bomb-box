// ─────────────────────────────────────────────
//  CONFIG & SETTINGS
// ─────────────────────────────────────────────
const cfg = {
  squares: { val:8, min:2, max:24 },
  bombTime: { val:5, min:2, max:20 },
  speed:    { val:3, min:1, max:8 },
  mapSize:  { val:1, min:0, max:2, labels:['S','M','L'] },
};

let gameMode = 'flags';
let mapStyle = 'retro'; // 'retro' | 'modern'
let gameSpeed = 1;      // multiplicador: 1 | 2 | 5

function setGameSpeed(mult, btn) {
  gameSpeed = mult;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setMapStyle(btn) {
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  mapStyle = btn.dataset.style;
}

function adj(key, delta) {
  const c = cfg[key];
  c.val = Math.min(c.max, Math.max(c.min, c.val + delta));
  const el = document.getElementById('val-' + key);
  el.textContent = c.labels ? c.labels[c.val] : c.val;
}

function setMode(btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gameMode = btn.dataset.mode;
}

// ─────────────────────────────────────────────
//  FLAGS DATA  (América Latina + España + USA)
// ─────────────────────────────────────────────
const FLAGS = [
  { name:'Argentina',   code:'ar', colors:['#74acdf','#ffffff','#74acdf'] },
  { name:'Bolivia',     code:'bo', colors:['#d52b1e','#f4e400','#007a3d'] },
  { name:'Brasil',      code:'br', colors:['#009c3b','#ffdf00','#002776'] },
  { name:'Chile',       code:'cl', colors:['#d52b1e','#ffffff','#0039a6'] },
  { name:'Colombia',    code:'co', colors:['#fce000','#003087','#ce1126'] },
  { name:'Costa Rica',  code:'cr', colors:['#002b7f','#ffffff','#ce1126'] },
  { name:'Cuba',        code:'cu', colors:['#002a8f','#ffffff','#cf142b'] },
  { name:'Ecuador',     code:'ec', colors:['#ffd100','#003da5','#ef3340'] },
  { name:'El Salvador', code:'sv', colors:['#0f47af','#ffffff','#0f47af'] },
  { name:'España',      code:'es', colors:['#c60b1e','#ffc400','#c60b1e'] },
  { name:'Guatemala',   code:'gt', colors:['#4997d0','#ffffff','#4997d0'] },
  { name:'Honduras',    code:'hn', colors:['#0073cf','#ffffff','#0073cf'] },
  { name:'México',      code:'mx', colors:['#006847','#ffffff','#ce1126'] },
  { name:'Nicaragua',   code:'ni', colors:['#3d5fc4','#ffffff','#3d5fc4'] },
  { name:'Panamá',      code:'pa', colors:['#ffffff','#d21034','#003580'] },
  { name:'Paraguay',    code:'py', colors:['#d52b1e','#ffffff','#0038a8'] },
  { name:'Perú',        code:'pe', colors:['#d91023','#ffffff','#d91023'] },
  { name:'Puerto Rico', code:'pr', colors:['#ed0000','#ffffff','#0a0a8a'] },
  { name:'Uruguay',     code:'uy', colors:['#ffffff','#5b9bd5','#ffffff'] },
  { name:'Venezuela',   code:'ve', colors:['#cf142b','#003087','#cf9f00'] },
  { name:'USA',         code:'us', colors:['#b22234','#ffffff','#3c3b6e'] },
];

// Cache de imágenes de banderas: code → HTMLImageElement
const flagImgCache = {};
function preloadFlags(pool) {
  for (const f of pool) {
    if (flagImgCache[f.code]) continue;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://flagcdn.com/' + f.code + '.svg';
    flagImgCache[f.code] = img;
  }
}

// Palette de colores vivos para modo colors
const PALETTE = [
  '#ff4444','#ff8800','#ffcc00','#44ff88','#00ccff',
  '#8844ff','#ff44aa','#44ffff','#ff6644','#aaff44',
  '#4488ff','#ff44ff','#00ff88','#ffaa00','#ff2266',
  '#66ffaa','#ff0066','#00aaff','#aaff00','#ff6600',
  '#0044ff','#ff0044','#00ffaa','#aaff66','#6600ff',
];

// Formas abstractas (indices para dibujarlas)
const SHAPES = ['star','diamond','cross','hexagon','triangle','octagon','plus','arrow'];

// ─────────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────────
let canvas, ctx;
let boxes = [];
let bomb = null;
let bombHolder = null;
let bombTimer = 0;
let bombDuration = 5;
let lastTime = 0;
let animId = null;
let paused = false;
let particles = [];
let mapW, mapH, BOX, SPEED_BASE;
let mapSizes = [[320,480],[440,640],[560,820]];
let mapPlatforms = [];
let currentSeed = 0;
let bombVisible = false;   // oculta la bomba hasta que llegue a su primer portador

// PRNG simple con semilla
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generatePlatforms(seed) {
  const rng = seededRand(seed);
  const wall = 18;
  const GAP = 48;          // hueco mínimo garantizado a cada lado
  const PLAT_H = 12;
  const MIN_W = 40;
  // ancho máximo: deja GAP libre a la izquierda Y a la derecha siempre
  const MAX_W = Math.floor((mapW - wall * 2) * 0.52);
  const innerW = mapW - wall * 2;
  const innerH = mapH - wall * 2;

  const platforms = [];
  const count = 3 + Math.floor(rng() * 3); // 3–5 plataformas

  // Dividir el eje Y en franjas para distribuir verticalmente
  const stripeH = Math.floor((innerH - 80) / count);

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 20) {
      attempts++;

      const w = MIN_W + Math.floor(rng() * (MAX_W - MIN_W));
      const h = PLAT_H;

      // x: garantizar que quede GAP libre a izquierda y derecha
      const xMin = wall + GAP;
      const xMax = wall + innerW - GAP - w;
      if (xMax <= xMin) continue; // mapa muy pequeño, saltar

      const x = xMin + Math.floor(rng() * (xMax - xMin));
      const y = wall + 40 + i * stripeH + Math.floor(rng() * Math.max(1, stripeH - 40));

      // Verificar que no solape con otra plataforma (margen vertical de 32px)
      const overlaps = platforms.some(p =>
        Math.abs(p.y - y) < 32 &&
        x < p.x + p.w + 8 &&
        x + w > p.x - 8
      );
      if (!overlaps) {
        platforms.push({ x, y, w, h });
        break;
      }
    }
  }
  return platforms;
}

// ─────────────────────────────────────────────
//  START / RESTART
// ─────────────────────────────────────────────
function startGame() {
  document.getElementById('menu').style.display = 'none';
  const gw = document.getElementById('gameWrap');
  gw.style.display = 'flex';

  const sIdx = cfg.mapSize.val;
  [mapW, mapH] = mapSizes[sIdx];
  BOX = 40;
  SPEED_BASE = 1 + cfg.speed.val * 0.8;
  bombDuration = cfg.bombTime.val;

  canvas = document.getElementById('canvas');
  // fit to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight - 60;
  const scale = Math.min(vw / mapW, vh / mapH);
  canvas.width  = mapW;
  canvas.height = mapH;
  canvas.style.width  = Math.floor(mapW * scale) + 'px';
  canvas.style.height = Math.floor(mapH * scale) + 'px';

  ctx = canvas.getContext('2d');
  currentSeed = Math.floor(Math.random() * 99999);
  mapPlatforms = generatePlatforms(currentSeed);
  document.getElementById('hudSeed').textContent = 'SEED:' + currentSeed;
  initBoxes();
  spawnBomb();
  paused = false;
  document.getElementById('overlay').style.display = 'none';
  lastTime = performance.now();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function restartGame() {
  document.getElementById('overlay').style.display = 'none';
  startGame();
}

function goMenu() {
  cancelAnimationFrame(animId);
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('gameWrap').style.display = 'none';
  document.getElementById('menu').style.display = 'flex';
}

function togglePause() {
  paused = !paused;
  if (!paused) {
    document.getElementById('pauseMenu').style.display = 'none';
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  } else {
    document.getElementById('pauseMenu').style.display = 'flex';
  }
}

function resumeGame() {
  paused = false;
  document.getElementById('pauseMenu').style.display = 'none';
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);
}

function endGame() {
  document.getElementById('pauseMenu').style.display = 'none';
  goMenu();
}

// ─────────────────────────────────────────────
//  INIT BOXES
// ─────────────────────────────────────────────
function initBoxes() {
  boxes = [];
  const n = cfg.squares.val;
  // pick data
  let pool = [];
  if (gameMode === 'flags') {
    pool = [...FLAGS].sort(() => Math.random()-.5).slice(0, Math.min(n, FLAGS.length));
    // pad if n > pool
    while (pool.length < n) pool.push(pool[Math.floor(Math.random()*pool.length)]);
    preloadFlags(pool);
  }

  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = SPEED_BASE * (0.8 + Math.random() * 0.5);
    const x = BOX/2 + Math.random() * (mapW - BOX);
    const y = BOX/2 + Math.random() * (mapH - BOX);
    let data = null;
    if (gameMode === 'flags') data = pool[i];
    else if (gameMode === 'colors') data = { color: PALETTE[i % PALETTE.length], name: '' };
    else data = { shape: SHAPES[i % SHAPES.length], color: PALETTE[i % PALETTE.length], name: '' };

    boxes.push({ id:i, x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
      alive: true, data, elimAnim: 0 });
  }
}

// ─────────────────────────────────────────────
//  BOMB
// ─────────────────────────────────────────────
function spawnBomb() {
  const wall = mapStyle === 'retro' ? 24 : 8;
  const angle = Math.random() * Math.PI * 2;
  const bombSpeed = SPEED_BASE * 0.5; // siempre 0.5x la velocidad del jugador
  bomb = {
    x: wall + BOX + Math.random() * (mapW - wall*2 - BOX*2),
    y: wall + BOX + Math.random() * (mapH - wall*2 - BOX*2),
    r: 14,
    vx: Math.cos(angle) * bombSpeed,
    vy: Math.sin(angle) * bombSpeed,
  };
  bombHolder = null;
  bombTimer = bombDuration;
  bombVisible = false;  // se vuelve visible cuando toca a alguien
}

// ─────────────────────────────────────────────
//  GAME LOOP
// ─────────────────────────────────────────────
function loop(ts) {
  if (paused) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  const scaledDt = dt * gameSpeed;
  update(scaledDt);
  render();
  updateHUD();

  // check win
  const alive = boxes.filter(b => b.alive);
  if (alive.length <= 1) {
    showEndScreen(alive);
    return;
  }

  animId = requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────
function update(dt) {
  // move boxes
  for (const b of boxes) {
    if (!b.alive) continue;
    b.x += b.vx * 60 * dt;
    b.y += b.vy * 60 * dt;
    // bounce paredes externas
    const wall = mapStyle === 'retro' ? 18 : 0;
    if (b.x - BOX/2 < wall)          { b.x = wall+BOX/2;       b.vx = Math.abs(b.vx); }
    if (b.x + BOX/2 > mapW-wall)     { b.x = mapW-wall-BOX/2;  b.vx = -Math.abs(b.vx); }
    if (b.y - BOX/2 < wall)          { b.y = wall+BOX/2;       b.vy = Math.abs(b.vy); }
    if (b.y + BOX/2 > mapH-wall)     { b.y = mapH-wall-BOX/2;  b.vy = -Math.abs(b.vy); }

    // bounce plataformas
    for (const plat of mapPlatforms) {
      const hs = BOX/2;
      const overX = (b.x + hs > plat.x) && (b.x - hs < plat.x + plat.w);
      const overY = (b.y + hs > plat.y) && (b.y - hs < plat.y + plat.h);
      if (overX && overY) {
        // calcular penetración por cada lado
        const fromLeft   = (b.x + hs) - plat.x;
        const fromRight  = (plat.x + plat.w) - (b.x - hs);
        const fromTop    = (b.y + hs) - plat.y;
        const fromBottom = (plat.y + plat.h) - (b.y - hs);
        const minPen = Math.min(fromLeft, fromRight, fromTop, fromBottom);
        if (minPen === fromTop)    { b.y = plat.y - hs;              b.vy = -Math.abs(b.vy); }
        else if (minPen === fromBottom) { b.y = plat.y+plat.h + hs; b.vy = Math.abs(b.vy); }
        else if (minPen === fromLeft)   { b.x = plat.x - hs;        b.vx = -Math.abs(b.vx); }
        else                            { b.x = plat.x+plat.w + hs; b.vx = Math.abs(b.vx); }
      }
    }
  }

  // ── COLISIONES ENTRE CUADROS ──
  const alive = boxes.filter(b => b.alive);
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const overlapX = BOX - Math.abs(dx);
      const overlapY = BOX - Math.abs(dy);

      if (overlapX > 0 && overlapY > 0) {
        // ── Separación: empujar por el eje de menor overlap ──
        if (overlapX < overlapY) {
          const push = overlapX / 2 + 1;
          const signX = dx >= 0 ? 1 : -1;
          a.x -= push * signX;
          b.x += push * signX;
          // intercambiar componente X de velocidad
          const tmpVx = a.vx;
          a.vx = b.vx;
          b.vx = tmpVx;
        } else {
          const push = overlapY / 2 + 1;
          const signY = dy >= 0 ? 1 : -1;
          a.y -= push * signY;
          b.y += push * signY;
          // intercambiar componente Y de velocidad
          const tmpVy = a.vy;
          a.vy = b.vy;
          b.vy = tmpVy;
        }

        // ── Transferencia de bomba ──
        if (bombHolder === a.id) {
          bombHolder = b.id;
          // flash visual en el receptor
          b.bombFlash = 0.25;
        } else if (bombHolder === b.id) {
          bombHolder = a.id;
          a.bombFlash = 0.25;
        }
      }
    }
  }

  // ── BOMBA LIBRE: persigue al cuadro más cercano ──
  if (bombHolder === null) {
    // Encontrar cuadro vivo más cercano
    let nearest = null, nearestDist = Infinity;
    for (const b of boxes) {
      if (!b.alive) continue;
      const d = Math.hypot(b.x - bomb.x, b.y - bomb.y);
      if (d < nearestDist) { nearestDist = d; nearest = b; }
    }

    if (nearest) {
      // Dirigir velocidad hacia el más cercano (steering suave)
      const dx = nearest.x - bomb.x;
      const dy = nearest.y - bomb.y;
      const dist = Math.hypot(dx, dy) || 1;
      const bombSpeed = SPEED_BASE * 0.5;
      const targetVx = (dx / dist) * bombSpeed * 60;
      const targetVy = (dy / dist) * bombSpeed * 60;
      // Interpolación suave para que no sea brusco
      bomb.vx += (targetVx - bomb.vx) * Math.min(dt * 3, 1);
      bomb.vy += (targetVy - bomb.vy) * Math.min(dt * 3, 1);
    }

    // Mover bomba
    bomb.x += bomb.vx * dt;
    bomb.y += bomb.vy * dt;

    // Bounce paredes (bomba rebota igual que los cuadros)
    const wall = mapStyle === 'retro' ? 18 : 4;
    if (bomb.x - bomb.r < wall)        { bomb.x = wall + bomb.r;       bomb.vx = Math.abs(bomb.vx); }
    if (bomb.x + bomb.r > mapW - wall) { bomb.x = mapW - wall - bomb.r; bomb.vx = -Math.abs(bomb.vx); }
    if (bomb.y - bomb.r < wall)        { bomb.y = wall + bomb.r;       bomb.vy = Math.abs(bomb.vy); }
    if (bomb.y + bomb.r > mapH - wall) { bomb.y = mapH - wall - bomb.r; bomb.vy = -Math.abs(bomb.vy); }

    // Colisión bomba ↔ cuadro: adopción
    for (const b of boxes) {
      if (!b.alive) continue;
      const dx = b.x - bomb.x, dy = b.y - bomb.y;
      if (Math.hypot(dx, dy) < BOX/2 + bomb.r - 2) {
        bombHolder = b.id;
        bombTimer = bombDuration;
        bombVisible = true;  // ahora sí se muestra
        b.bombFlash = 0.3;
        break;
      }
    }
  }

  // ── BOMBA CON PORTADOR: seguir al cuadro ──
  if (bombHolder !== null) {
    bombVisible = true;
    const h = boxes[bombHolder];
    if (h && h.alive) {
      bomb.x = h.x;
      bomb.y = h.y - BOX/2 - bomb.r;
    }
    bombTimer -= dt;
    if (bombTimer <= 0) {
      explode();
      return;
    }
  }

  // decaer flash de recepción
  for (const b of boxes) {
    if (b.bombFlash > 0) b.bombFlash -= dt;
  }

  // particles
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;
    p.vy += 200 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i,1);
  }
}

function explode() {
  if (bombHolder === null) return;
  const b = boxes[bombHolder];
  if (b) {
    b.alive = false;
    b.elimAnim = 1;
    // spawn particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random()*Math.PI*2;
      const speed = 80 + Math.random()*200;
      particles.push({
        x: b.x, y: b.y,
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 60,
        life: 0.5 + Math.random()*0.5,
        r: 3 + Math.random()*5,
        color: ['#ff4444','#ff8800','#ffcc00','#ff6644'][Math.floor(Math.random()*4)],
      });
    }
  }
  setTimeout(() => { spawnBomb(); }, 600);
}

// ─────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────
function render() {
  ctx.clearRect(0,0,mapW,mapH);

  if (mapStyle === 'retro') {
    drawRetroBackground();
  } else {
    drawModernBackground();
  }

  // boxes (dead first, alive on top)
  for (const b of boxes) {
    if (b.alive) continue;
    drawBox(b);
  }
  for (const b of boxes) {
    if (!b.alive) continue;
    drawBox(b);
  }

  // bomb — solo visible después de tocar su primer portador
  if (bomb && bombVisible && bombHolder === null) drawFreeBomb(bomb);

  // particles
  for (const p of particles) {
    ctx.globalAlpha = p.life * 2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // attached bomb on holder
  if (bombHolder !== null) {
    const h = boxes[bombHolder];
    if (h && h.alive) {
      drawAttachedBomb(bomb, h);
    }
  }
}

function drawRetroBackground() {
  // fondo oscuro tipo tierra
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, mapW, mapH);

  // paredes laterales con textura de piedra
  const tileW = 16, tileH = 16;
  const wallW = 16;

  function drawStoneTile(tx, ty) {
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(tx, ty, tileW, tileH);
    ctx.fillStyle = '#3a3a52';
    ctx.fillRect(tx+1, ty+1, tileW-2, 4);
    ctx.fillStyle = '#1e1e2e';
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(tx, ty, tileW, tileH);
  }

  // paredes top/bottom/left/right
  for (let x = 0; x < mapW; x += tileW) {
    for (let row = 0; row < wallW; row += tileH) {
      drawStoneTile(x, row);
      drawStoneTile(x, mapH - wallW + row);
    }
  }
  for (let y = wallW; y < mapH - wallW; y += tileH) {
    for (let col = 0; col < wallW; col += tileW) {
      drawStoneTile(col, y);
      drawStoneTile(mapW - wallW + col, y);
    }
  }

  // suelo interior con grid sutil
  ctx.strokeStyle = 'rgba(42,42,80,0.25)';
  ctx.lineWidth = 0.5;
  const g = 16;
  for (let x = wallW; x < mapW - wallW; x += g) {
    ctx.beginPath(); ctx.moveTo(x, wallW); ctx.lineTo(x, mapH - wallW); ctx.stroke();
  }
  for (let y = wallW; y < mapH - wallW; y += g) {
    ctx.beginPath(); ctx.moveTo(wallW, y); ctx.lineTo(mapW - wallW, y); ctx.stroke();
  }

  // plataformas del mapa (generadas desde semilla)
  for (const plat of mapPlatforms) {
    // base
    ctx.fillStyle = '#3a3450';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    // borde superior iluminado
    ctx.fillStyle = '#5a5070';
    ctx.fillRect(plat.x, plat.y, plat.w, 3);
    // divisiones de tile
    ctx.strokeStyle = '#2a2040';
    ctx.lineWidth = 0.5;
    for (let tx = plat.x; tx < plat.x + plat.w; tx += 16) {
      ctx.beginPath(); ctx.moveTo(tx, plat.y); ctx.lineTo(tx, plat.y + plat.h); ctx.stroke();
    }
  }
}

function drawModernBackground() {
  // fondo limpio con grid
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, mapW, mapH);
  ctx.strokeStyle = 'rgba(42,42,90,0.35)';
  ctx.lineWidth = 1;
  const g = 32;
  for (let x = 0; x < mapW; x += g) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapH); ctx.stroke();
  }
  for (let y = 0; y < mapH; y += g) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapW, y); ctx.stroke();
  }

  // plataformas estilo simple
  for (const plat of mapPlatforms) {
    ctx.fillStyle = '#1e1e3a';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.strokeStyle = '#4444aa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    // esquinas pixel
    ctx.fillStyle = '#4444aa';
    ctx.fillRect(plat.x, plat.y, 3, 3);
    ctx.fillRect(plat.x + plat.w - 3, plat.y, 3, 3);
    ctx.fillRect(plat.x, plat.y + plat.h - 3, 3, 3);
    ctx.fillRect(plat.x + plat.w - 3, plat.y + plat.h - 3, 3, 3);
  }
}

function drawBox(b) {
  const hs = BOX/2;
  ctx.save();
  ctx.translate(b.x, b.y);

  if (!b.alive) {
    ctx.globalAlpha = 0.18;
  }

  if (gameMode === 'flags') {
    drawFlag(b.data, hs);
  } else if (gameMode === 'colors') {
    ctx.fillStyle = b.data.color;
    ctx.fillRect(-hs, -hs, BOX, BOX);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hs,-hs,BOX,BOX);
  } else {
    drawAbstract(b.data, hs);
  }

  // flash al recibir la bomba
  if (b.alive && b.bombFlash > 0) {
    const alpha = Math.min(b.bombFlash * 4, 0.6);
    ctx.fillStyle = `rgba(255,220,0,${alpha})`;
    ctx.fillRect(-hs, -hs, BOX, BOX);
  }

  // holder highlight
  if (b.alive && b.id === bombHolder) {
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10;
    ctx.strokeRect(-hs-2, -hs-2, BOX+4, BOX+4);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawFlag(data, hs) {
  const size = BOX; // siempre exactamente BOX, sin depender de hs
  const half = size / 2;
  // Clip al cuadro para que ninguna imagen se desborde
  ctx.save();
  ctx.beginPath();
  ctx.rect(-half, -half, size, size);
  ctx.clip();
  const img = flagImgCache[data.code];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -half, -half, size, size);
  } else {
    const [c1,c2,c3] = data.colors;
    const bh = size / 3;
    ctx.fillStyle = c1; ctx.fillRect(-half, -half, size, bh);
    ctx.fillStyle = c2; ctx.fillRect(-half, -half + bh, size, bh);
    ctx.fillStyle = c3; ctx.fillRect(-half, -half + bh*2, size, bh);
  }
  ctx.restore();
  // borde uniforme siempre encima
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-half, -half, size, size);
}

function drawAbstract(data, hs) {
  ctx.fillStyle = data.color;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  const s = hs * 0.85;
  switch(data.shape) {
    case 'star':
      drawStar(ctx, 0, 0, 5, s, s*0.45);
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0,-s); ctx.lineTo(s,0); ctx.lineTo(0,s); ctx.lineTo(-s,0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'cross':
      const t = s*0.35;
      ctx.beginPath();
      ctx.rect(-t,-s,t*2,s*2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.rect(-s,-t,s*2,t*2);
      ctx.fill(); ctx.stroke();
      break;
    case 'hexagon':
      polygon(ctx, 0, 0, s, 6); ctx.fill(); ctx.stroke();
      break;
    case 'triangle':
      polygon(ctx, 0, 0, s, 3); ctx.fill(); ctx.stroke();
      break;
    case 'octagon':
      polygon(ctx, 0, 0, s, 8); ctx.fill(); ctx.stroke();
      break;
    default:
      ctx.fillRect(-s,-s,s*2,s*2);
      ctx.strokeRect(-s,-s,s*2,s*2);
  }
}

function polygon(ctx, cx,cy,r,n) {
  ctx.beginPath();
  for(let i=0;i<n;i++){
    const a = (i/n)*Math.PI*2 - Math.PI/2;
    i===0 ? ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
           : ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
  }
  ctx.closePath();
}

function drawStar(ctx,cx,cy,pts,r1,r2) {
  ctx.beginPath();
  for(let i=0;i<pts*2;i++){
    const a = (i/(pts*2))*Math.PI*2 - Math.PI/2;
    const r = i%2===0 ? r1 : r2;
    i===0 ? ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
           : ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawFreeBomb(bomb) {
  const pulse = 0.8 + 0.2*Math.sin(Date.now()/200);
  ctx.save();
  ctx.translate(bomb.x, bomb.y);
  // glow
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 12 * pulse;
  // body
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, 0, bomb.r, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.stroke();
  // fuse
  ctx.strokeStyle = '#cc8800';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -bomb.r);
  ctx.bezierCurveTo(6,-bomb.r-8, 10,-bomb.r-4, 8,-bomb.r-14);
  ctx.stroke();
  // spark
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(8, -bomb.r-14, 3*pulse, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawAttachedBomb(bomb, holder) {
  const progress = bombTimer / bombDuration;
  const pulse = 0.85 + 0.15*Math.sin(Date.now() / (100 + progress * 150));
  ctx.save();
  ctx.translate(bomb.x, bomb.y);
  const urgency = Math.max(0, (1 - progress));
  ctx.shadowColor = `rgba(255,${Math.floor(100*(1-urgency))},0,1)`;
  ctx.shadowBlur = 15 + 10*urgency;
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(0,0,bomb.r*pulse,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = `rgb(255,${Math.floor(255*(progress))},0)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  // fuse
  ctx.strokeStyle = '#cc8800';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0,-bomb.r);
  ctx.bezierCurveTo(6,-bomb.r-8,10,-bomb.r-4,8,-bomb.r-14);
  ctx.stroke();
  // spark
  const sparkOn = Math.sin(Date.now()/60) > 0;
  if (sparkOn) {
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(8,-bomb.r-14,3,0,Math.PI*2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // timer bar above the bomb
  const barW = 50, barH = 6;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bomb.x - barW/2, bomb.y - bomb.r - 28, barW, barH);
  ctx.fillStyle = `rgb(255,${Math.floor(200*progress)},0)`;
  ctx.fillRect(bomb.x - barW/2, bomb.y - bomb.r - 28, barW*progress, barH);
}

// ─────────────────────────────────────────────
//  HUD
// ─────────────────────────────────────────────
function updateHUD() {
  const alive = boxes.filter(b=>b.alive).length;
  document.getElementById('hudAlive').textContent = alive;
  document.getElementById('hudTimer').textContent =
    bombHolder !== null ? bombTimer.toFixed(1)+'s' : '–';

  const fill = document.getElementById('bombTimerFill');
  if (bombHolder !== null) {
    const p = bombTimer / bombDuration;
    fill.style.width = (p*100) + '%';
    fill.style.background = p > 0.5 ? '#ffcc00' : p > 0.25 ? '#ff8800' : '#ff4444';
  } else {
    fill.style.width = '100%';
    fill.style.background = '#44ff88';
  }
}

// ─────────────────────────────────────────────
//  END SCREEN
// ─────────────────────────────────────────────
function showEndScreen(alive) {
  cancelAnimationFrame(animId);
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'flex';

  if (alive.length === 1) {
    const winner = alive[0];
    let name = '';
    if (gameMode === 'flags') name = winner.data.name;
    else if (gameMode === 'colors') name = `#${winner.id + 1}`;
    else name = winner.data.shape;

    document.getElementById('overlayTitle').textContent = '🏆 GANADOR';
    document.getElementById('overlayMsg').textContent =
      gameMode === 'flags'
        ? `¡${name} sobrevivió!`
        : gameMode === 'colors'
          ? `¡El cuadro ${name} sobrevivió!`
          : `¡La figura ${name} sobrevivió!`;
  } else {
    document.getElementById('overlayTitle').textContent = '💥 TODOS ELIMINADOS';
    document.getElementById('overlayMsg').textContent = '¡Nadie sobrevivió!';
  }
}

// ─────────────────────────────────────────────
//  RESIZE
// ─────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (!canvas) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight - 60;
  const scale = Math.min(vw / mapW, vh / mapH);
  canvas.style.width  = Math.floor(mapW * scale) + 'px';
  canvas.style.height = Math.floor(mapH * scale) + 'px';
});

// ─────────────────────────────────────────────
//  SERVICE WORKER (inline via Blob)
// ─────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  const swCode = `
const CACHE = 'bombbox-v2';
const ASSETS = ['./index.html', './style.css', './game.js', './manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
`;
  const blob = new Blob([swCode], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);
  window.addEventListener('load', () => navigator.serviceWorker.register(swUrl));
}
