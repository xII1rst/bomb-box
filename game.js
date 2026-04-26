// ═══════════════════════════════════════════════════════
//  BOMBBOX — game.js
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────
//  CONFIG & SETTINGS
// ─────────────────────────────────────────────
const cfg = {
  squares: { val:8,  min:2,  max:24 },
  bombTime:{ val:5,  min:2,  max:20 },
  speed:   { val:3,  min:1,  max:8  },
  mapSize: { val:1,  min:0,  max:2, labels:['S','M','L'] },
  rounds:  { val:3,  min:1,  max:10 },
};

let gameMode   = 'flags';
let ruleMode   = 'normal';
let mapStyle   = 'retro';
let gameSpeed  = 1;

function adj(key, delta) {
  const c = cfg[key];
  c.val = Math.min(c.max, Math.max(c.min, c.val + delta));
  const el = document.getElementById('val-' + key);
  if (el) el.textContent = c.labels ? c.labels[c.val] : c.val;
}
function setMode(btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gameMode = btn.dataset.mode;
}
function setRuleMode(btn) {
  document.querySelectorAll('.rule-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ruleMode = btn.dataset.rule;
  const rc = document.getElementById('roundsCfg');
  if (rc) rc.style.display = ruleMode === 'rounds' ? 'flex' : 'none';
}
function setMapStyle(btn) {
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  mapStyle = btn.dataset.style;
}
function setGameSpeed(mult, btn) {
  gameSpeed = mult;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─────────────────────────────────────────────
//  FLAGS DATA POR REGIÓN
// ─────────────────────────────────────────────
const FLAGS_BY_REGION = {
  latam: [
    { name:'Argentina',   code:'ar', colors:['#74acdf','#ffffff','#74acdf'] },
    { name:'Bolivia',     code:'bo', colors:['#d52b1e','#f4e400','#007a3d'] },
    { name:'Brasil',      code:'br', colors:['#009c3b','#ffdf00','#002776'] },
    { name:'Chile',       code:'cl', colors:['#d52b1e','#ffffff','#0039a6'] },
    { name:'Colombia',    code:'co', colors:['#fce000','#003087','#ce1126'] },
    { name:'Costa Rica',  code:'cr', colors:['#002b7f','#ffffff','#ce1126'] },
    { name:'Cuba',        code:'cu', colors:['#002a8f','#ffffff','#cf142b'] },
    { name:'Ecuador',     code:'ec', colors:['#ffd100','#003da5','#ef3340'] },
    { name:'El Salvador', code:'sv', colors:['#0f47af','#ffffff','#0f47af'] },
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
  ],
  norte: [
    { name:'USA',         code:'us', colors:['#b22234','#ffffff','#3c3b6e'] },
    { name:'Canadá',      code:'ca', colors:['#ff0000','#ffffff','#ff0000'] },
    { name:'México',      code:'mx', colors:['#006847','#ffffff','#ce1126'] },
  ],
  europa: [
    { name:'España',      code:'es', colors:['#c60b1e','#ffc400','#c60b1e'] },
    { name:'Francia',     code:'fr', colors:['#002395','#ffffff','#ed2939'] },
    { name:'Alemania',    code:'de', colors:['#000000','#dd0000','#ffce00'] },
    { name:'Italia',      code:'it', colors:['#009246','#ffffff','#ce2b37'] },
    { name:'Portugal',    code:'pt', colors:['#006600','#ff0000','#ff0000'] },
    { name:'Reino Unido', code:'gb', colors:['#012169','#ffffff','#c8102e'] },
    { name:'Holanda',     code:'nl', colors:['#ae1c28','#ffffff','#21468b'] },
    { name:'Suecia',      code:'se', colors:['#006aa7','#fecc02','#006aa7'] },
    { name:'Noruega',     code:'no', colors:['#ef2b2d','#ffffff','#002868'] },
    { name:'Suiza',       code:'ch', colors:['#ff0000','#ffffff','#ff0000'] },
    { name:'Polonia',     code:'pl', colors:['#ffffff','#dc143c','#ffffff'] },
    { name:'Ucrania',     code:'ua', colors:['#005bbb','#ffd500','#005bbb'] },
    { name:'Grecia',      code:'gr', colors:['#0d5eaf','#ffffff','#0d5eaf'] },
    { name:'Turquía',     code:'tr', colors:['#e30a17','#ffffff','#e30a17'] },
  ],
  asia: [
    { name:'Japón',       code:'jp', colors:['#ffffff','#bc002d','#ffffff'] },
    { name:'China',       code:'cn', colors:['#de2910','#ffde00','#de2910'] },
    { name:'Corea Sur',   code:'kr', colors:['#ffffff','#003478','#cd2e3a'] },
    { name:'India',       code:'in', colors:['#ff9933','#ffffff','#138808'] },
    { name:'Indonesia',   code:'id', colors:['#ce1126','#ffffff','#ce1126'] },
    { name:'Tailandia',   code:'th', colors:['#a51931','#ffffff','#2d2a4a'] },
    { name:'Vietnam',     code:'vn', colors:['#da251d','#ffff00','#da251d'] },
    { name:'Arabia S.',   code:'sa', colors:['#006c35','#ffffff','#006c35'] },
    { name:'Filipinas',   code:'ph', colors:['#0038a8','#ce1126','#fcd116'] },
  ],
  all: [],
};
// Rellenar "all" sin duplicados
{
  const seen = new Set();
  for (const key of ['latam','norte','europa','asia']) {
    for (const f of FLAGS_BY_REGION[key]) {
      if (!seen.has(f.code)) { seen.add(f.code); FLAGS_BY_REGION.all.push(f); }
    }
  }
}

let selectedRegion = 'latam';
function setRegion(btn) {
  document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedRegion = btn.dataset.region;
}
function getFlagPool() { return FLAGS_BY_REGION[selectedRegion] || FLAGS_BY_REGION.latam; }

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

// ─────────────────────────────────────────────
//  PALETTES & SHAPES
// ─────────────────────────────────────────────
const PALETTE = [
  '#ff4444','#ff8800','#ffcc00','#44ff88','#00ccff',
  '#8844ff','#ff44aa','#44ffff','#ff6644','#aaff44',
  '#4488ff','#ff44ff','#00ff88','#ffaa00','#ff2266',
  '#66ffaa','#ff0066','#00aaff','#aaff00','#ff6600',
  '#0044ff','#ff0044','#00ffaa','#aaff66','#6600ff',
];
const SHAPES = ['star','diamond','cross','hexagon','triangle','octagon'];

// ─────────────────────────────────────────────
//  BOOST TYPES
// ─────────────────────────────────────────────
const BOOST_TYPES = [
  { id:'speed',    label:'⚡', color:'#ffcc00' },
  { id:'freeze',   label:'❄',  color:'#44ffff' },
  { id:'shield',   label:'🛡',  color:'#44ff88' },
  { id:'transfer', label:'💨', color:'#ff44aa' },
  { id:'double',   label:'💣', color:'#ff4444' },
];

// ─────────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────────
let canvas, ctx;
let boxes        = [];
let bombs        = [];
let bombDuration = 5;
let lastTime     = 0;
let animId       = null;
let paused       = false;
let particles    = [];
let mapW, mapH, BOX, SPEED_BASE;
const mapSizes   = [[320,480],[440,640],[560,820]];
let mapPlatforms = [];
let currentSeed  = 0;
let boosts          = [];
let boostSpawnTimer = 0;
const BOOST_INTERVAL = 8;
let roundScores  = {};
let currentRound = 1;
let totalRounds  = 3;
let holdTime     = {};
let teams        = {};

// ─────────────────────────────────────────────
//  PRNG & MAP
// ─────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
}

function generatePlatforms(seed) {
  const rng=seededRand(seed), wall=18, GAP=50, PLAT_H=12, MIN_W=40;
  const MAX_W=Math.floor((mapW-wall*2)*.50), innerH=mapH-wall*2;
  const count=3+Math.floor(rng()*3), stripeH=Math.floor((innerH-80)/count);
  const platforms=[];
  for(let i=0;i<count;i++){
    for(let a=0;a<20;a++){
      const w=MIN_W+Math.floor(rng()*(MAX_W-MIN_W));
      const xMin=wall+GAP, xMax=wall+(mapW-wall*2)-GAP-w;
      if(xMax<=xMin) break;
      const x=xMin+Math.floor(rng()*(xMax-xMin));
      const y=wall+40+i*stripeH+Math.floor(rng()*Math.max(1,stripeH-40));
      if(!platforms.some(p=>Math.abs(p.y-y)<36&&x<p.x+p.w+8&&x+w>p.x-8)){
        platforms.push({x,y,w,h:PLAT_H}); break;
      }
    }
  }
  return platforms;
}

// ─────────────────────────────────────────────
//  START / RESTART / MENU
// ─────────────────────────────────────────────
function startGame() {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('gameWrap').style.display = 'flex';
  [mapW,mapH] = mapSizes[cfg.mapSize.val];
  BOX=40; SPEED_BASE=1+cfg.speed.val*.8;
  bombDuration=cfg.bombTime.val; totalRounds=cfg.rounds.val;
  currentRound=1; roundScores={}; holdTime={};
  canvas=document.getElementById('canvas');
  const scale=Math.min(window.innerWidth/mapW,(window.innerHeight-60)/mapH);
  canvas.width=mapW; canvas.height=mapH;
  canvas.style.width=Math.floor(mapW*scale)+'px';
  canvas.style.height=Math.floor(mapH*scale)+'px';
  ctx=canvas.getContext('2d');
  currentSeed=Math.floor(Math.random()*99999);
  mapPlatforms=generatePlatforms(currentSeed);
  document.getElementById('hudSeed').textContent='SEED:'+currentSeed;
  startRound();
}

function startRound() {
  bombs=[]; boosts=[]; boostSpawnTimer=BOOST_INTERVAL;
  holdTime={}; particles=[]; paused=false; teams={};
  initBoxes(); spawnBombs();
  document.getElementById('overlay').style.display='none';
  document.getElementById('pauseMenu').style.display='none';
  lastTime=performance.now();
  cancelAnimationFrame(animId);
  animId=requestAnimationFrame(loop);
}

function restartGame() { document.getElementById('overlay').style.display='none'; startGame(); }

function goMenu() {
  cancelAnimationFrame(animId);
  ['overlay','pauseMenu','gameWrap'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('menu').style.display='flex';
}

function togglePause() {
  paused=!paused;
  if(!paused){ document.getElementById('pauseMenu').style.display='none'; lastTime=performance.now(); animId=requestAnimationFrame(loop); }
  else { document.getElementById('pauseMenu').style.display='flex'; }
}
function resumeGame() { paused=false; document.getElementById('pauseMenu').style.display='none'; lastTime=performance.now(); animId=requestAnimationFrame(loop); }
function endGame()    { document.getElementById('pauseMenu').style.display='none'; goMenu(); }

// ─────────────────────────────────────────────
//  INIT BOXES
// ─────────────────────────────────────────────
function initBoxes() {
  boxes=[];
  const n=cfg.squares.val, pool=getFlagPool();
  let flagPool=[];
  if(gameMode==='flags'){
    flagPool=[...pool].sort(()=>Math.random()-.5).slice(0,Math.min(n,pool.length));
    while(flagPool.length<n) flagPool.push(flagPool[Math.floor(Math.random()*flagPool.length)]);
    preloadFlags(flagPool);
  }
  const teamAssign=ruleMode==='team'
    ?[...Array(n)].map((_,i)=>i<Math.floor(n/2)?'A':'B').sort(()=>Math.random()-.5)
    :null;

  for(let i=0;i<n;i++){
    const angle=Math.random()*Math.PI*2, speed=SPEED_BASE*(0.8+Math.random()*.5);
    const wall=mapStyle==='retro'?22:4;
    const x=wall+BOX+Math.random()*(mapW-wall*2-BOX*2);
    const y=wall+BOX+Math.random()*(mapH-wall*2-BOX*2);
    let data;
    if(gameMode==='flags')       data={...flagPool[i]};
    else if(gameMode==='colors') data={color:PALETTE[i%PALETTE.length]};
    else                         data={shape:SHAPES[i%SHAPES.length],color:PALETTE[i%PALETTE.length]};
    const team=teamAssign?teamAssign[i]:null;
    if(team) teams[i]=team;
    boxes.push({id:i,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      alive:true,data,team,bombFlash:0,speedBoost:0,frozen:0,shielded:0,score:roundScores[i]||0});
    holdTime[i]=0;
    if(!roundScores[i]) roundScores[i]=0;
  }
}

// ─────────────────────────────────────────────
//  BOMB FACTORY
// ─────────────────────────────────────────────
function makeBomb() {
  const wall=mapStyle==='retro'?24:8;
  const angle=Math.random()*Math.PI*2, spd=SPEED_BASE*.5;
  return { x:wall+BOX+Math.random()*(mapW-wall*2-BOX*2),
           y:wall+BOX+Math.random()*(mapH-wall*2-BOX*2),
           r:14, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
           holder:null, timer:bombDuration, visible:false };
}

function spawnBombs() {
  bombs = ruleMode==='chaos' ? [makeBomb(),makeBomb()] : [makeBomb()];
}

// ─────────────────────────────────────────────
//  GAME LOOP
// ─────────────────────────────────────────────
function loop(ts) {
  if(paused) return;
  const dt=Math.min((ts-lastTime)/1000,.05);
  lastTime=ts;
  update(dt*gameSpeed);
  render();
  updateHUD();
  const alive=boxes.filter(b=>b.alive);
  if(checkRoundOver(alive)) return;
  animId=requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
//  ROUND OVER CHECK
// ─────────────────────────────────────────────
function checkRoundOver(alive) {
  if(ruleMode==='team'){
    const ta=new Set(alive.map(b=>b.team));
    if(ta.size>1) return false;
    endRound(ta.size===1?alive.filter(b=>b.team===[...ta][0]):[]);
    return true;
  }
  if(alive.length<=1){ endRound(alive); return true; }
  return false;
}

function endRound(winners) {
  cancelAnimationFrame(animId);
  for(const w of winners) roundScores[w.id]=(roundScores[w.id]||0)+1;
  if(ruleMode==='rounds'&&currentRound<totalRounds){
    currentRound++;
    document.getElementById('overlay').style.display='flex';
    document.getElementById('overlayTitle').textContent=`RONDA ${currentRound-1}/${totalRounds}`;
    const sc=boxes.map(b=>`${getBoxLabel(b)}:${roundScores[b.id]||0}`).join(' · ');
    document.getElementById('overlayMsg').innerHTML=
      (winners.length?`🏆 ${getBoxLabel(winners[0])} gana la ronda!<br>`:'Sin ganador<br>')+
      `<span style="font-size:13px;color:var(--dim)">${sc}</span>`;
    document.getElementById('overlayBtns').innerHTML=`
      <button class="pxbtn" onclick="document.getElementById('overlay').style.display='none';startRound()" style="font-size:9px;padding:10px 14px">▶ SIGUIENTE</button>
      <button class="pxbtn" onclick="goMenu()" style="font-size:9px;padding:10px 14px">☰ MENÚ</button>`;
  } else {
    showEndScreen(winners);
  }
}

function getBoxLabel(b) {
  if(gameMode==='flags')  return b.data.name;
  if(gameMode==='colors') return `Cuadro #${b.id+1}`;
  return b.data.shape;
}

// ─────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────
function update(dt) {
  const wall=mapStyle==='retro'?18:0;

  for(const b of boxes){
    if(!b.alive) continue;
    if(b.speedBoost>0) b.speedBoost-=dt;
    if(b.frozen>0){ b.frozen-=dt; continue; }
    if(b.shielded>0) b.shielded-=dt;
    const spd=b.speedBoost>0?2:1;
    b.x+=b.vx*spd*60*dt; b.y+=b.vy*spd*60*dt;
    if(b.x-BOX/2<wall)      {b.x=wall+BOX/2;      b.vx= Math.abs(b.vx);}
    if(b.x+BOX/2>mapW-wall) {b.x=mapW-wall-BOX/2; b.vx=-Math.abs(b.vx);}
    if(b.y-BOX/2<wall)      {b.y=wall+BOX/2;      b.vy= Math.abs(b.vy);}
    if(b.y+BOX/2>mapH-wall) {b.y=mapH-wall-BOX/2; b.vy=-Math.abs(b.vy);}
    bouncePlatforms(b);
  }

  const alive=boxes.filter(b=>b.alive);
  for(let i=0;i<alive.length;i++)
    for(let j=i+1;j<alive.length;j++)
      resolveBoxCollision(alive[i],alive[j]);

  // boosts
  boostSpawnTimer-=dt;
  if(boostSpawnTimer<=0){ spawnBoost(); boostSpawnTimer=BOOST_INTERVAL; }
  checkBoostPickup();
  for(let i=boosts.length-1;i>=0;i--){ boosts[i].life-=dt; boosts[i].pulse+=.08; if(boosts[i].life<=0) boosts.splice(i,1); }

  // bombas
  for(let bi=bombs.length-1;bi>=0;bi--) updateBomb(bombs[bi],dt,bi);

  // holdTime (modo last)
  if(ruleMode==='last')
    for(const bomb of bombs)
      if(bomb.holder!==null) holdTime[bomb.holder]=(holdTime[bomb.holder]||0)+dt;

  for(const b of boxes) if(b.bombFlash>0) b.bombFlash-=dt;

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx*60*dt; p.y+=p.vy*60*dt; p.vy+=200*dt; p.life-=dt;
    if(p.life<=0) particles.splice(i,1);
  }
}

function bouncePlatforms(b) {
  const hs=BOX/2;
  for(const plat of mapPlatforms){
    if(b.x+hs<=plat.x||b.x-hs>=plat.x+plat.w) continue;
    if(b.y+hs<=plat.y||b.y-hs>=plat.y+plat.h) continue;
    const fL=(b.x+hs)-plat.x, fR=(plat.x+plat.w)-(b.x-hs);
    const fT=(b.y+hs)-plat.y, fB=(plat.y+plat.h)-(b.y-hs);
    const m=Math.min(fL,fR,fT,fB);
    if(m===fT){b.y=plat.y-hs;     b.vy=-Math.abs(b.vy);}
    else if(m===fB){b.y=plat.y+plat.h+hs; b.vy=Math.abs(b.vy);}
    else if(m===fL){b.x=plat.x-hs;     b.vx=-Math.abs(b.vx);}
    else           {b.x=plat.x+plat.w+hs; b.vx=Math.abs(b.vx);}
  }
}

function resolveBoxCollision(a,b) {
  const dx=b.x-a.x, dy=b.y-a.y;
  const ox=BOX-Math.abs(dx), oy=BOX-Math.abs(dy);
  if(ox<=0||oy<=0) return;
  if(ox<oy){ const push=ox/2+1,sign=dx>=0?1:-1; a.x-=push*sign; b.x+=push*sign; [a.vx,b.vx]=[b.vx,a.vx]; }
  else      { const push=oy/2+1,sign=dy>=0?1:-1; a.y-=push*sign; b.y+=push*sign; [a.vy,b.vy]=[b.vy,a.vy]; }
  for(const bomb of bombs){
    if(bomb.holder===a.id){ bomb.holder=b.id; b.bombFlash=.25; bomb.timer=bombDuration; }
    else if(bomb.holder===b.id){ bomb.holder=a.id; a.bombFlash=.25; bomb.timer=bombDuration; }
  }
}

// ─────────────────────────────────────────────
//  BOMB UPDATE
// ─────────────────────────────────────────────
function updateBomb(bomb,dt,bi) {
  const wall=mapStyle==='retro'?18:4;
  if(bomb.holder===null){
    let nearest=null, nd=Infinity;
    for(const b of boxes){ if(!b.alive) continue; const d=Math.hypot(b.x-bomb.x,b.y-bomb.y); if(d<nd){nd=d;nearest=b;} }
    if(nearest){
      const dx=nearest.x-bomb.x, dy=nearest.y-bomb.y, dist=Math.hypot(dx,dy)||1;
      const spd=SPEED_BASE*.5*60;
      bomb.vx+=((dx/dist)*spd-bomb.vx)*Math.min(dt*3,1);
      bomb.vy+=((dy/dist)*spd-bomb.vy)*Math.min(dt*3,1);
    }
    bomb.x+=bomb.vx*dt; bomb.y+=bomb.vy*dt;
    if(bomb.x-bomb.r<wall)        {bomb.x=wall+bomb.r;        bomb.vx= Math.abs(bomb.vx);}
    if(bomb.x+bomb.r>mapW-wall)   {bomb.x=mapW-wall-bomb.r;   bomb.vx=-Math.abs(bomb.vx);}
    if(bomb.y-bomb.r<wall)        {bomb.y=wall+bomb.r;         bomb.vy= Math.abs(bomb.vy);}
    if(bomb.y+bomb.r>mapH-wall)   {bomb.y=mapH-wall-bomb.r;   bomb.vy=-Math.abs(bomb.vy);}
    for(const b of boxes){
      if(!b.alive||b.shielded>0) continue;
      if(Math.hypot(b.x-bomb.x,b.y-bomb.y)<BOX/2+bomb.r-2){
        bomb.holder=b.id; bomb.timer=bombDuration; bomb.visible=true; b.bombFlash=.3; break;
      }
    }
  } else {
    bomb.visible=true;
    const h=boxes[bomb.holder];
    if(h&&h.alive){ bomb.x=h.x; bomb.y=h.y-BOX/2-bomb.r; }
    bomb.timer-=dt;
    if(bomb.timer<=0) explodeBomb(bomb,bi);
  }
}

function explodeBomb(bomb,bi) {
  const b=bomb.holder!==null?boxes[bomb.holder]:null;
  if(b&&b.alive){ b.alive=false; spawnParticles(b.x,b.y); }
  bombs.splice(bi,1);
  setTimeout(()=>{
    if(ruleMode==='chaos'){ bombs.push(makeBomb()); bombs.push(makeBomb()); }
    else bombs.push(makeBomb());
  },600);
}

function spawnParticles(x,y){
  for(let i=0;i<30;i++){
    const a=Math.random()*Math.PI*2, spd=80+Math.random()*200;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-60,
      life:.5+Math.random()*.5, r:3+Math.random()*5,
      color:['#ff4444','#ff8800','#ffcc00','#ff6644'][Math.floor(Math.random()*4)]});
  }
}

// ─────────────────────────────────────────────
//  BOOSTS
// ─────────────────────────────────────────────
function spawnBoost(){
  const wall=mapStyle==='retro'?24:8;
  const type=BOOST_TYPES[Math.floor(Math.random()*BOOST_TYPES.length)];
  boosts.push({x:wall+20+Math.random()*(mapW-wall*2-40),y:wall+20+Math.random()*(mapH-wall*2-40),
    type,r:12,life:10,pulse:Math.random()*Math.PI*2});
}

function checkBoostPickup(){
  for(let bi=boosts.length-1;bi>=0;bi--){
    const boost=boosts[bi];
    for(const b of boxes){
      if(!b.alive) continue;
      if(Math.hypot(b.x-boost.x,b.y-boost.y)<BOX/2+boost.r){ applyBoost(b,boost.type); boosts.splice(bi,1); break; }
    }
  }
}

function applyBoost(b,type){
  switch(type.id){
    case 'speed':    b.speedBoost=5; break;
    case 'freeze':   for(const o of boxes) if(o.id!==b.id&&o.alive) o.frozen=3; break;
    case 'shield':   b.shielded=4; break;
    case 'transfer':
      for(const bomb of bombs){
        if(bomb.holder!==null&&bomb.holder!==b.id){ bomb.holder=b.id; b.bombFlash=.4; }
        else if(bomb.holder===b.id){
          let nearest=null,nd=Infinity;
          for(const o of boxes){ if(!o.alive||o.id===b.id) continue; const d=Math.hypot(o.x-b.x,o.y-b.y); if(d<nd){nd=d;nearest=o;} }
          if(nearest){ bomb.holder=nearest.id; nearest.bombFlash=.4; }
        }
      } break;
    case 'double': bombs.push(makeBomb()); break;
  }
  spawnParticles(b.x,b.y);
}

// ─────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────
function render(){
  ctx.clearRect(0,0,mapW,mapH);
  mapStyle==='retro'?drawRetroBackground():drawModernBackground();
  for(const b of boxes){ if( b.alive) continue; drawBox(b); }
  for(const b of boxes){ if(!b.alive) continue; drawBox(b); }
  for(const boost of boosts) drawBoost(boost);
  for(const bomb of bombs){
    if(!bomb.visible) continue;
    if(bomb.holder!==null){ const h=boxes[bomb.holder]; if(h&&h.alive) drawAttachedBomb(bomb,h); }
    else drawFreeBomb(bomb);
  }
  for(const p of particles){
    ctx.globalAlpha=Math.min(p.life*2,1);
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  if(ruleMode==='team') drawTeamIndicators();
}

function drawRetroBackground(){
  ctx.fillStyle='#0a0a14'; ctx.fillRect(0,0,mapW,mapH);
  const tW=16,wall=16;
  function st(tx,ty){
    ctx.fillStyle='#2a2a3e'; ctx.fillRect(tx,ty,tW,tW);
    ctx.fillStyle='#3a3a52'; ctx.fillRect(tx+1,ty+1,tW-2,4);
    ctx.strokeStyle='#1a1a2a'; ctx.lineWidth=.5; ctx.strokeRect(tx,ty,tW,tW);
  }
  for(let x=0;x<mapW;x+=tW){ for(let r=0;r<wall;r+=tW){ st(x,r); st(x,mapH-wall+r); } }
  for(let y=wall;y<mapH-wall;y+=tW){ for(let c=0;c<wall;c+=tW){ st(c,y); st(mapW-wall+c,y); } }
  ctx.strokeStyle='rgba(42,42,80,.2)'; ctx.lineWidth=.5;
  for(let x=wall;x<mapW-wall;x+=16){ ctx.beginPath(); ctx.moveTo(x,wall); ctx.lineTo(x,mapH-wall); ctx.stroke(); }
  for(let y=wall;y<mapH-wall;y+=16){ ctx.beginPath(); ctx.moveTo(wall,y); ctx.lineTo(mapW-wall,y); ctx.stroke(); }
  for(const p of mapPlatforms){
    ctx.fillStyle='#3a3450'; ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle='#5a5070'; ctx.fillRect(p.x,p.y,p.w,3);
    ctx.strokeStyle='#2a2040'; ctx.lineWidth=.5;
    for(let tx=p.x;tx<p.x+p.w;tx+=16){ ctx.beginPath(); ctx.moveTo(tx,p.y); ctx.lineTo(tx,p.y+p.h); ctx.stroke(); }
  }
}

function drawModernBackground(){
  ctx.fillStyle='#080810'; ctx.fillRect(0,0,mapW,mapH);
  ctx.strokeStyle='rgba(42,42,90,.3)'; ctx.lineWidth=1;
  for(let x=0;x<mapW;x+=32){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,mapH); ctx.stroke(); }
  for(let y=0;y<mapH;y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(mapW,y); ctx.stroke(); }
  for(const p of mapPlatforms){
    ctx.fillStyle='#1e1e3a'; ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.strokeStyle='#4444aa'; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle='#4444aa';
    ctx.fillRect(p.x,p.y,3,3); ctx.fillRect(p.x+p.w-3,p.y,3,3);
    ctx.fillRect(p.x,p.y+p.h-3,3,3); ctx.fillRect(p.x+p.w-3,p.y+p.h-3,3,3);
  }
}

function drawBox(b){
  const hs=BOX/2;
  ctx.save(); ctx.translate(b.x,b.y);
  if(!b.alive) ctx.globalAlpha=.15;
  if(gameMode==='flags')       drawFlag(b.data,hs);
  else if(gameMode==='colors') { ctx.fillStyle=b.data.color; ctx.fillRect(-hs,-hs,BOX,BOX); ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1.5; ctx.strokeRect(-hs,-hs,BOX,BOX); }
  else                         drawAbstract(b.data,hs);
  if(b.shielded>0){ ctx.strokeStyle='#44ff88'; ctx.lineWidth=2.5; ctx.shadowColor='#44ff88'; ctx.shadowBlur=8; ctx.strokeRect(-hs-3,-hs-3,BOX+6,BOX+6); ctx.shadowBlur=0; }
  if(b.alive&&b.bombFlash>0){ ctx.fillStyle=`rgba(255,220,0,${Math.min(b.bombFlash*4,.55)})`; ctx.fillRect(-hs,-hs,BOX,BOX); }
  if(b.frozen>0){ ctx.fillStyle='rgba(100,220,255,.3)'; ctx.fillRect(-hs,-hs,BOX,BOX); ctx.strokeStyle='#44ffff'; ctx.lineWidth=2; ctx.strokeRect(-hs,-hs,BOX,BOX); }
  if(b.alive&&bombs.some(bm=>bm.holder===b.id)){ ctx.strokeStyle='#ff4444'; ctx.lineWidth=3; ctx.shadowColor='#ff4444'; ctx.shadowBlur=10; ctx.strokeRect(-hs-2,-hs-2,BOX+4,BOX+4); ctx.shadowBlur=0; }
  ctx.restore();
}

function drawTeamIndicators(){
  for(const b of boxes){ if(!b.alive) continue; ctx.fillStyle=b.team==='A'?'#ff6644':'#44aaff'; ctx.fillRect(b.x-BOX/2,b.y-BOX/2-6,BOX,4); }
}

function drawFlag(data,hs){
  const size=BOX,half=size/2;
  ctx.save(); ctx.beginPath(); ctx.rect(-half,-half,size,size); ctx.clip();
  const img=flagImgCache[data.code];
  if(img&&img.complete&&img.naturalWidth>0){
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,-half,-half,size,size);
  } else {
    const [c1,c2,c3]=data.colors, bh=size/3;
    ctx.fillStyle=c1; ctx.fillRect(-half,-half,size,bh);
    ctx.fillStyle=c2; ctx.fillRect(-half,-half+bh,size,bh);
    ctx.fillStyle=c3; ctx.fillRect(-half,-half+bh*2,size,bh);
  }
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1.5; ctx.strokeRect(-half,-half,size,size);
}

function drawAbstract(data,hs){
  ctx.fillStyle=data.color; ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=2;
  const s=hs*.85;
  switch(data.shape){
    case 'star':    drawStar(ctx,0,0,5,s,s*.45); break;
    case 'diamond': ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(s,0); ctx.lineTo(0,s); ctx.lineTo(-s,0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'cross':   { const t=s*.35; ctx.beginPath(); ctx.rect(-t,-s,t*2,s*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(-s,-t,s*2,t*2); ctx.fill(); ctx.stroke(); break; }
    case 'hexagon': polygon(ctx,0,0,s,6); ctx.fill(); ctx.stroke(); break;
    case 'triangle':polygon(ctx,0,0,s,3); ctx.fill(); ctx.stroke(); break;
    case 'octagon': polygon(ctx,0,0,s,8); ctx.fill(); ctx.stroke(); break;
    default:        ctx.fillRect(-s,-s,s*2,s*2); ctx.strokeRect(-s,-s,s*2,s*2);
  }
}
function polygon(ctx,cx,cy,r,n){ ctx.beginPath(); for(let i=0;i<n;i++){ const a=(i/n)*Math.PI*2-Math.PI/2; i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)); } ctx.closePath(); }
function drawStar(ctx,cx,cy,pts,r1,r2){ ctx.beginPath(); for(let i=0;i<pts*2;i++){ const a=(i/(pts*2))*Math.PI*2-Math.PI/2,r=i%2===0?r1:r2; i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)); } ctx.closePath(); ctx.fill(); ctx.stroke(); }

function drawBoost(boost){
  const r=boost.r*(0.85+.15*Math.sin(boost.pulse));
  ctx.save(); ctx.translate(boost.x,boost.y);
  ctx.shadowColor=boost.type.color; ctx.shadowBlur=10;
  ctx.fillStyle=boost.type.color+'33'; ctx.beginPath(); ctx.arc(0,0,r+4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=boost.type.color;     ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.font=`${r}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(boost.type.label,0,1);
  ctx.restore();
}

function drawFreeBomb(bomb){
  const pulse=0.8+.2*Math.sin(Date.now()/200);
  ctx.save(); ctx.translate(bomb.x,bomb.y);
  ctx.shadowColor='#ff4444'; ctx.shadowBlur=10*pulse;
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(0,0,bomb.r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#666'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.strokeStyle='#cc8800'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,-bomb.r); ctx.bezierCurveTo(6,-bomb.r-8,10,-bomb.r-4,8,-bomb.r-14); ctx.stroke();
  ctx.fillStyle='#ffcc00'; ctx.shadowColor='#ffcc00'; ctx.shadowBlur=6;
  ctx.beginPath(); ctx.arc(8,-bomb.r-14,3*pulse,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0; ctx.restore();
}

function drawAttachedBomb(bomb,holder){
  const progress=bomb.timer/bombDuration, pulse=0.85+.15*Math.sin(Date.now()/(100+progress*150));
  ctx.save(); ctx.translate(bomb.x,bomb.y);
  ctx.shadowColor=`rgba(255,${Math.floor(100*progress)},0,1)`; ctx.shadowBlur=15+10*(1-progress);
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(0,0,bomb.r*pulse,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=`rgb(255,${Math.floor(255*progress)},0)`; ctx.lineWidth=2; ctx.stroke();
  ctx.strokeStyle='#cc8800'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,-bomb.r); ctx.bezierCurveTo(6,-bomb.r-8,10,-bomb.r-4,8,-bomb.r-14); ctx.stroke();
  if(Math.sin(Date.now()/60)>0){ ctx.fillStyle='#ffcc00'; ctx.shadowColor='#ffcc00'; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(8,-bomb.r-14,3,0,Math.PI*2); ctx.fill(); }
  ctx.shadowBlur=0;
  const bW=50,bH=6;
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(-bW/2,-bomb.r-28,bW,bH);
  ctx.fillStyle=`rgb(255,${Math.floor(200*progress)},0)`; ctx.fillRect(-bW/2,-bomb.r-28,bW*progress,bH);
  ctx.restore();
}

// ─────────────────────────────────────────────
//  HUD
// ─────────────────────────────────────────────
function updateHUD(){
  document.getElementById('hudAlive').textContent=boxes.filter(b=>b.alive).length;
  const active=bombs.filter(b=>b.holder!==null);
  const minT=active.length?Math.min(...active.map(b=>b.timer)):null;
  document.getElementById('hudTimer').textContent=minT!==null?minT.toFixed(1)+'s':'–';
  const fill=document.getElementById('bombTimerFill');
  if(minT!==null){ const p=minT/bombDuration; fill.style.width=(p*100)+'%'; fill.style.background=p>.5?'#ffcc00':p>.25?'#ff8800':'#ff4444'; }
  else { fill.style.width='100%'; fill.style.background='#44ff88'; }
  const ri=document.getElementById('hudRound');
  if(ri) ri.textContent=ruleMode==='rounds'?`R${currentRound}/${totalRounds}`:'';
}

// ─────────────────────────────────────────────
//  END SCREEN
// ─────────────────────────────────────────────
function showEndScreen(winners){
  document.getElementById('overlay').style.display='flex';
  let title, msg;
  if(ruleMode==='last'){
    const ranked=boxes.filter(b=>b.alive).sort((a,b)=>(holdTime[a.id]||0)-(holdTime[b.id]||0));
    const w=ranked[0];
    title='🏆 MENOS TIEMPO'; msg=w?`¡${getBoxLabel(w)} ganó!`:'¡Empate!';
  } else if(ruleMode==='rounds'){
    const top=Math.max(...Object.values(roundScores));
    const w=boxes.find(b=>roundScores[b.id]===top);
    title='🏆 FIN DE RONDAS'; msg=w?`¡${getBoxLabel(w)} gana con ${top} victorias!`:'Sin ganador';
  } else if(ruleMode==='team'){
    const wt=winners.length?winners[0].team:null;
    title=`🏆 EQUIPO ${wt||'?'}`; msg=wt?`¡El equipo ${wt} sobrevivió!`:'¡Empate!';
  } else {
    title=winners.length?'🏆 GANADOR':'💥 TODOS ELIMINADOS';
    msg=winners.length?`¡${getBoxLabel(winners[0])} sobrevivió!`:'¡Nadie sobrevivió!';
  }
  document.getElementById('overlayTitle').textContent=title;
  document.getElementById('overlayMsg').innerHTML=msg;
  document.getElementById('overlayBtns').innerHTML=`
    <button class="pxbtn" onclick="restartGame()" style="font-size:9px;padding:10px 16px">↩ REINICIAR</button>
    <button class="pxbtn" onclick="goMenu()" style="font-size:9px;padding:10px 16px">☰ MENÚ</button>`;
}

// ─────────────────────────────────────────────
//  RESIZE
// ─────────────────────────────────────────────
window.addEventListener('resize',()=>{
  if(!canvas) return;
  const scale=Math.min(window.innerWidth/mapW,(window.innerHeight-60)/mapH);
  canvas.style.width=Math.floor(mapW*scale)+'px';
  canvas.style.height=Math.floor(mapH*scale)+'px';
});

// ─────────────────────────────────────────────
//  SERVICE WORKER
// ─────────────────────────────────────────────
if('serviceWorker' in navigator){
  const swCode=`
const CACHE='bombbox-v3';
const ASSETS=['./index.html','./style.css','./game.js','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
`;
  const blob=new Blob([swCode],{type:'application/javascript'});
  window.addEventListener('load',()=>navigator.serviceWorker.register(URL.createObjectURL(blob)));
}
