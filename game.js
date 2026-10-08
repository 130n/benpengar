// Benpengar – första spelbara prototypen.
// Plocka bendelar, bygg ihop skelett, begrav fiendeskelett (A) och hämta sedeln
// som benhanden håller upp. Fånga maskar och släng ut dem som bete (B).
// Två dragningar i håret: först står det rakt upp, sedan är det borta och spelet slut.
'use strict';

// ---------- Inställningar (justera fritt för balans) ----------
const CFG = {
  playerSpeed: 4.5,          // rutor/s
  skelSpeedStart: 1.7,       // rutor/s
  skelSpeedMax: 3.0,
  skelSpeedGrowth: 0.012,    // per sekund
  chaseBoost: 1.15,          // hastighetsfaktor när skelettet jagar
  sightRange: 7,             // rutor, bara längs raka korridorer
  spawnStart: 8.0,           // sekunder mellan skelett i början
  spawnMin: 2.2,
  spawnRamp: 0.05,           // hur fort intervallet krymper per sekund
  spawnMinDist: 4,           // minsta gångavstånd från spelaren
  boneMax: 4,                // samtidiga ben på kartan
  boneEvery: 2.2,
  wormMax: 2,
  wormEvery: 7,
  wormSpeed: 1.3,
  wormCarryMax: 5,
  baitTime: 3.0,             // så länge ett skelett äter en mask
  baitSmell: 4,              // gångavstånd där skelett känner av bete även utan sikt
  invulnTime: 2.0,
  stunTime: 1.5,
};

// ---------- Layout ----------
const T = 32, COLS = 11, ROWS = 9;
const W = 352, H = 548, HUD_H = 40, MAP_Y = HUD_H, CTRL_Y = MAP_Y + ROWS * T; // 328
const DIRS = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] };
const DIR_ROW = { down: 0, up: 1, right: 2, left: 3 };
const OPP = { down: 'up', up: 'down', left: 'right', right: 'left' };
const PARTS = ['skull', 'torso', 'arm', 'leg'];
const BONE_COL = { skull: 0, torso: 1, arm: 2, leg: 3 };

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- Skalning: hela spelet ska synas utan scroll ----------
function fit() {
  const vv = window.visualViewport;
  const vw = vv ? vv.width : window.innerWidth;
  const vh = vv ? vv.height : window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  canvas.style.width = `${Math.floor(W * s)}px`;
  canvas.style.height = `${Math.floor(H * s)}px`;
}
window.addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);
fit();

// ---------- Grafik ----------
const IMG = {};
const SHEETS = ['skeleton_walk', 'player_walk', 'player_pull', 'bones', 'graves', 'worm_crawl', 'counter_combos', 'burial'];
function loadAll() {
  return Promise.all(SHEETS.map((n) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { IMG[n] = im; res(); };
    im.onerror = rej;
    im.src = `assets/${n}.png`;
  })));
}
const cell = (sheet, col, row, x, y, w = T, h = T) =>
  ctx.drawImage(IMG[sheet], col * w, row * h, w, h, Math.round(x), Math.round(y), w, h);

// 3x5 bitmap-typsnitt
const FONT = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010',
  '8': '111101111101111', '9': '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 'Å': '010010101111101', 'Ä': '101010101111101',
  'Ö': '101010101101010', ' ': '000000000000000', '!': '010010010000010', ':': '000010000010000',
  '.': '000000000000010', '-': '000000111000000', '+': '000010111010000', '$': '011110010011110',
  '=': '000111000111000', '/': '001001010100100',
};
function text(str, x, y, color = '#f3ead2', scale = 1, align = 'left') {
  str = String(str).toUpperCase();
  const w = str.length * 4 * scale - scale;
  if (align === 'center') x -= Math.floor(w / 2);
  if (align === 'right') x -= w;
  ctx.fillStyle = color;
  for (let i = 0; i < str.length; i++) {
    const g = FONT[str[i]] ?? FONT[' '];
    for (let p = 0; p < 15; p++) {
      if (g[p] === '1') ctx.fillRect(x + i * 4 * scale + (p % 3) * scale, y + Math.floor(p / 3) * scale, scale, scale);
    }
  }
}
function shadowText(str, x, y, color, scale, align) {
  text(str, x + scale, y + scale, '#2a1f33', scale, align);
  text(str, x, y, color, scale, align);
}

// ---------- Ljud (syntetiserat, startar vid första tryck) ----------
let audio = null;
function beep(freqs, dur = 0.08, type = 'square', vol = 0.06) {
  if (!audio) return;
  let t = audio.currentTime;
  for (const f of freqs) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t); o.stop(t + dur);
    t += dur * 0.8;
  }
}
const SFX = {
  pling: () => beep([1046, 1568, 2093], 0.09, 'square', 0.05),
  bone: () => beep([660, 880], 0.05),
  worm: () => beep([440, 330], 0.06, 'triangle', 0.08),
  bury: () => beep([180, 120, 90], 0.12, 'triangle', 0.12),
  pull: () => beep([520, 380, 240], 0.1, 'sawtooth', 0.05),
  rip: () => beep([300, 200, 120, 70], 0.14, 'sawtooth', 0.06),
  nope: () => beep([140], 0.08, 'square', 0.04),
  drop: () => beep([330, 262], 0.06, 'triangle', 0.08),
};

// ---------- Karta ----------
const isWall = (x, y) => x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1 || (x % 2 === 0 && y % 2 === 0);
const FLOOR = [];
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!isWall(x, y)) FLOOR.push([x, y]);

// Gräset ritas en gång till en egen canvas
const ground = document.createElement('canvas');
ground.width = COLS * T; ground.height = ROWS * T;
(() => {
  const g = ground.getContext('2d');
  g.fillStyle = '#3f5a3a'; g.fillRect(0, 0, ground.width, ground.height);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rnd() * ground.width), y = Math.floor(rnd() * ground.height);
    g.fillStyle = rnd() < 0.6 ? '#354d31' : '#4e6b45';
    g.fillRect(x, y, 1, 1); g.fillRect(x + 1, y - 1, 1, 1);
  }
})();

function bfs(sx, sy, tx, ty) {
  // returnerar { dir, dist } för första steget mot målet
  if (sx === tx && sy === ty) return { dir: null, dist: 0 };
  const key = (x, y) => y * COLS + x;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy, 0]];
  while (q.length) {
    const [x, y, d] = q.shift();
    for (const [name, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (isWall(nx, ny) || prev.has(k)) continue;
      prev.set(k, [x, y, name]);
      if (nx === tx && ny === ty) {
        let cur = [nx, ny], step = name;
        for (;;) {
          const p = prev.get(key(cur[0], cur[1]));
          if (!p || (p[0] === sx && p[1] === sy)) { step = p ? p[2] : step; break; }
          cur = [p[0], p[1]];
        }
        return { dir: step, dist: d + 1 };
      }
      q.push([nx, ny, d + 1]);
    }
  }
  return { dir: null, dist: Infinity };
}

function lineOfSight(ax, ay, bx, by, range) {
  if (ax !== bx && ay !== by) return false;
  const dist = Math.abs(ax - bx) + Math.abs(ay - by);
  if (dist > range) return false;
  const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
  for (let i = 1; i < dist; i++) if (isWall(ax + dx * i, ay + dy * i)) return false;
  return true;
}

// ---------- Rörelse på rutnätet ----------
function mover(x, y, speed) {
  return { tx: x, ty: y, fx: x, fy: y, t: 0, moving: false, dir: 'down', speed, walked: 0 };
}
const posX = (m) => (m.fx + (m.tx - m.fx) * m.t) * T;
const posY = (m) => (m.fy + (m.ty - m.fy) * m.t) * T;
const tileOf = (m) => [Math.round(posX(m) / T), Math.round(posY(m) / T)];
function tryMove(m, dir) {
  const [dx, dy] = DIRS[dir];
  m.dir = dir;
  if (isWall(m.tx + dx, m.ty + dy)) return false;
  m.fx = m.tx; m.fy = m.ty; m.tx += dx; m.ty += dy; m.t = 0; m.moving = true;
  return true;
}
function stepMover(m, dt, speed) {
  if (!m.moving) return false;
  m.t += speed * dt;
  m.walked += speed * dt;
  if (m.t >= 1) { m.t = 0; m.fx = m.tx; m.fy = m.ty; m.moving = false; return true; }
  return false;
}
const walkFrame = (m) => (m.moving ? Math.floor(m.walked * 4) % 4 : 0);
const dist2 = (a, b) => (posX(a) - posX(b)) ** 2 + (posY(a) - posY(b)) ** 2;

// ---------- Indata ----------
const input = { dir: null, keys: new Set(), padDir: null, a: false, b: false, aPressed: false, bPressed: false };
const KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
const KEY_A = ['z', 'j', ' ', 'Enter'], KEY_B = ['x', 'k'];
function unlockAudio() {
  if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; } }
  audio?.resume?.();
}
window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYDIR[k]) { input.keys.add(KEYDIR[k]); e.preventDefault(); }
  if (KEY_A.includes(k) && !e.repeat) { input.aPressed = true; e.preventDefault(); }
  if (KEY_B.includes(k) && !e.repeat) { input.bPressed = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYDIR[k]) input.keys.delete(KEYDIR[k]);
});

// Pekskärm: styrkors + A/B ritas i nedre panelen
const PAD = { x: 92, y: CTRL_Y + 110, r: 62, arm: 22 };
const BTN_A = { x: 292, y: CTRL_Y + 92, r: 26 };
const BTN_B = { x: 222, y: CTRL_Y + 128, r: 26 };
const pointers = new Map();
function toGame(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
}
function classify(x, y) {
  const dx = x - PAD.x, dy = y - PAD.y;
  if (dx * dx + dy * dy <= (PAD.r + 14) ** 2) {
    if (Math.hypot(dx, dy) < 8) return { pad: null };
    return { pad: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
  }
  if ((x - BTN_A.x) ** 2 + (y - BTN_A.y) ** 2 <= (BTN_A.r + 10) ** 2) return { btn: 'a' };
  if ((x - BTN_B.x) ** 2 + (y - BTN_B.y) ** 2 <= (BTN_B.r + 10) ** 2) return { btn: 'b' };
  if (y < CTRL_Y) return { btn: 'a' }; // tryck på kartan = A på start/slutskärmen
  return {};
}
function updatePointers() {
  input.padDir = null; input.a = false; input.b = false;
  for (const c of pointers.values()) {
    if (c.pad !== undefined) input.padDir = c.pad;
    if (c.btn === 'a' && c.y >= CTRL_Y) input.a = true;
    if (c.btn === 'b') input.b = true;
  }
}
canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  e.preventDefault();
  canvas.setPointerCapture?.(e.pointerId);
  const [x, y] = toGame(e);
  const c = { ...classify(x, y), y };
  pointers.set(e.pointerId, c);
  // tryck på kartan räknas bara som A på start-/slutskärmen
  if (c.btn === 'a' && (y >= CTRL_Y || G.mode !== 'play')) input.aPressed = true;
  if (c.btn === 'b') input.bPressed = true;
  updatePointers();
});
canvas.addEventListener('pointermove', (e) => {
  const c = pointers.get(e.pointerId);
  if (!c || c.pad === undefined) return;
  const [x, y] = toGame(e);
  const n = classify(x, y);
  c.pad = n.pad !== undefined ? n.pad : c.pad;
  updatePointers();
});
const release = (e) => { pointers.delete(e.pointerId); updatePointers(); };
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

function heldDir() {
  if (input.padDir) return input.padDir;
  const k = [...input.keys];
  return k.length ? k[k.length - 1] : null;
}

// ---------- Spelets tillstånd ----------
let G;
function newGame() {
  G = {
    mode: 'title', time: 0, money: 0, worms: 0,
    parts: { skull: 0, torso: 0, arm: 0, leg: 0 },
    player: Object.assign(mover(1, 1, CFG.playerSpeed), { hair: 0, invuln: 0 }),
    skels: [], bones: [], wormsOnMap: [], baits: [], burials: [], spawns: [], poofs: [], floats: [],
    spawnTimer: 2.5, boneTimer: 0.5, wormTimer: 4, bag: [],
    pull: null,
  };
}
newGame();

const completeSets = () => Math.min(G.parts.skull, G.parts.torso, Math.floor(G.parts.arm / 2), Math.floor(G.parts.leg / 2));
function counterMasks() {
  // varje del går till första skelettet som saknar den (samma regel som counter.py)
  const c = G.parts;
  const n = Math.max(c.skull, c.torso, Math.ceil(c.arm / 2), Math.ceil(c.leg / 2));
  const masks = [];
  for (let k = 1; k <= n; k++) {
    masks.push((c.skull >= k) | ((c.torso >= k) << 1) | ((c.arm >= 2 * k - 1) << 2) | ((c.arm >= 2 * k) << 3) |
      ((c.leg >= 2 * k - 1) << 4) | ((c.leg >= 2 * k) << 5));
  }
  return masks;
}

function occupied(x, y) {
  const p = G.player;
  const ents = [...G.skels, ...G.wormsOnMap];
  if (ents.some((e) => e.tx === x && e.ty === y)) return true;
  if (G.bones.some((b) => b.x === x && b.y === y)) return true;
  if (G.burials.some((b) => b.x === x && b.y === y) || G.spawns.some((s) => s.x === x && s.y === y)) return true;
  return p.tx === x && p.ty === y;
}
function freeTile(minDist = 0) {
  const p = G.player;
  const opts = FLOOR.filter(([x, y]) => !occupied(x, y) && (minDist === 0 || bfs(p.tx, p.ty, x, y).dist >= minDist));
  return opts.length ? opts[Math.floor(Math.random() * opts.length)] : null;
}
function nextBone() {
  if (!G.bag.length) {
    G.bag = ['skull', 'torso', 'arm', 'arm', 'leg', 'leg'];
    for (let i = G.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [G.bag[i], G.bag[j]] = [G.bag[j], G.bag[i]]; }
  }
  return G.bag.pop();
}

// ---------- Uppdatering ----------
function update(dt) {
  if (G.mode === 'title' || G.mode === 'over') {
    if (input.aPressed && (G.mode === 'title' || G.overTimer <= 0)) {
      const wasOver = G.mode === 'over';
      if (wasOver) newGame();
      G.mode = 'play';
    }
    if (G.mode === 'over') G.overTimer -= dt;
    input.aPressed = input.bPressed = false;
    return;
  }
  if (G.mode === 'pull') return updatePull(dt);

  G.time += dt;
  const p = G.player;
  p.invuln = Math.max(0, p.invuln - dt);

  // spelaren
  const want = heldDir();
  if (p.moving && want === OPP[p.dir]) { // vända mitt i ett steg
    [p.fx, p.tx] = [p.tx, p.fx]; [p.fy, p.ty] = [p.ty, p.fy]; p.t = 1 - p.t; p.dir = want;
  }
  stepMover(p, dt, CFG.playerSpeed);
  if (!p.moving && want) tryMove(p, want);

  // knappar
  if (input.aPressed) bury();
  if (input.bPressed) dropWorm();
  input.aPressed = input.bPressed = false;

  // plocka saker när spelaren står nära rutans mitt
  for (const b of [...G.bones]) {
    if (Math.abs(posX(p) - b.x * T) < 10 && Math.abs(posY(p) - b.y * T) < 10) {
      G.bones.splice(G.bones.indexOf(b), 1);
      G.parts[b.type]++;
      SFX.bone();
      G.floats.push({ x: b.x * T + 16, y: b.y * T, t: 0, str: '+1' });
    }
  }
  for (const w of [...G.wormsOnMap]) {
    if (dist2(p, w) < 14 * 14 && G.worms < CFG.wormCarryMax) {
      G.wormsOnMap.splice(G.wormsOnMap.indexOf(w), 1);
      G.worms++;
      SFX.worm();
    }
  }
  for (const b of [...G.burials]) {
    if (b.t >= BURIAL_IDLE_AT && Math.abs(posX(p) - b.x * T) < 14 && Math.abs(posY(p) - b.y * T) < 14) {
      G.burials.splice(G.burials.indexOf(b), 1);
      G.money++;
      SFX.pling();
      G.floats.push({ x: b.x * T + 16, y: b.y * T - 4, t: 0, str: '+$1', color: '#b4e39a' });
    }
  }

  // tidtagare för nya saker
  const skelSpeed = Math.min(CFG.skelSpeedMax, CFG.skelSpeedStart + G.time * CFG.skelSpeedGrowth);
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    const tile = freeTile(CFG.spawnMinDist);
    if (tile) G.spawns.push({ x: tile[0], y: tile[1], t: 0 });
    G.spawnTimer = Math.max(CFG.spawnMin, CFG.spawnStart - G.time * CFG.spawnRamp);
  }
  G.boneTimer -= dt;
  if (G.boneTimer <= 0 && G.bones.length < CFG.boneMax) {
    const tile = freeTile(2);
    if (tile) G.bones.push({ x: tile[0], y: tile[1], type: nextBone() });
    G.boneTimer = CFG.boneEvery;
  }
  G.wormTimer -= dt;
  if (G.wormTimer <= 0 && G.wormsOnMap.length < CFG.wormMax) {
    const tile = freeTile(3);
    if (tile) G.wormsOnMap.push(mover(tile[0], tile[1], CFG.wormSpeed));
    G.wormTimer = CFG.wormEvery;
  }

  // skelett som kliver upp ur jorden (ofarliga tills de står uppe)
  for (const s of [...G.spawns]) {
    s.t += dt;
    if (s.t >= SPAWN_TIME) {
      G.spawns.splice(G.spawns.indexOf(s), 1);
      G.skels.push(Object.assign(mover(s.x, s.y, skelSpeed), { stun: 0, eat: 0, lastSeen: null, chasing: false }));
    }
  }

  for (const s of G.skels) updateSkeleton(s, dt, skelSpeed);
  for (const w of G.wormsOnMap) {
    if (stepMover(w, dt, CFG.wormSpeed) || !w.moving) wanderStep(w);
  }
  for (const b of G.burials) b.t += dt;
  for (const b of G.baits) b.t += dt;
  for (const f of G.floats) f.t += dt;
  G.floats = G.floats.filter((f) => f.t < 0.8);
  for (const f of G.poofs) f.t += dt;
  G.poofs = G.poofs.filter((f) => f.t < 0.3);

  // kollision skelett -> dragning i håret
  if (p.invuln <= 0) {
    for (const s of G.skels) {
      if (s.stun <= 0 && dist2(p, s) < 18 * 18) { startPull(s); break; }
    }
  }
}

function wanderStep(m) {
  const opts = Object.keys(DIRS).filter((d) => !isWall(m.tx + DIRS[d][0], m.ty + DIRS[d][1]));
  const forward = opts.filter((d) => d !== OPP[m.dir]);
  const pool = forward.length ? forward : opts;
  const dir = pool.includes(m.dir) && Math.random() < 0.6 ? m.dir : pool[Math.floor(Math.random() * pool.length)];
  tryMove(m, dir);
}

function updateSkeleton(s, dt, speed) {
  if (s.stun > 0) { s.stun -= dt; return; }
  if (s.eat > 0) {
    s.eat -= dt;
    if (s.eat <= 0 && s.bait) { G.baits.splice(G.baits.indexOf(s.bait), 1); s.bait = null; }
    return;
  }
  const arrived = stepMover(s, dt, speed * (s.chasing ? CFG.chaseBoost : 1));
  if (s.moving) return;
  if (arrived) {
    // skelett som kliver på ett ben sparkar sönder det
    const b = G.bones.find((b) => b.x === s.tx && b.y === s.ty);
    if (b) { G.bones.splice(G.bones.indexOf(b), 1); G.poofs.push({ x: b.x, y: b.y, t: 0 }); }
  }
  const p = G.player;
  const [px, py] = tileOf(p);

  // bete går före allt annat
  let target = null;
  for (const bait of G.baits) {
    if (bait.eater) continue;
    if (lineOfSight(s.tx, s.ty, bait.x, bait.y, CFG.sightRange) || bfs(s.tx, s.ty, bait.x, bait.y).dist <= CFG.baitSmell) {
      if (bait.x === s.tx && bait.y === s.ty) { bait.eater = s; s.bait = bait; s.eat = CFG.baitTime; return; }
      target = [bait.x, bait.y];
      break;
    }
  }
  if (!target) {
    if (lineOfSight(s.tx, s.ty, px, py, CFG.sightRange)) { s.lastSeen = [px, py]; s.chasing = true; }
    if (s.lastSeen) {
      if (s.lastSeen[0] === s.tx && s.lastSeen[1] === s.ty) { s.lastSeen = null; s.chasing = false; }
      else target = s.lastSeen;
    }
  }
  if (target) {
    const step = bfs(s.tx, s.ty, target[0], target[1]).dir;
    if (step) { tryMove(s, step); return; }
  }
  wanderStep(s);
}

// A: begrav närmaste skelett om du har ett färdigt
const SPAWN_TIME = 0.6, BURIAL_SINK = 0.66, BURIAL_IDLE_AT = 0.9;
function bury() {
  if (completeSets() < 1 || !G.skels.length) { SFX.nope(); return; }
  const p = G.player;
  const s = G.skels.reduce((a, b) => (dist2(p, a) <= dist2(p, b) ? a : b));
  G.skels.splice(G.skels.indexOf(s), 1);
  if (s.bait) { s.bait.eater = null; }
  for (const k of ['skull', 'torso']) G.parts[k]--;
  G.parts.arm -= 2; G.parts.leg -= 2;
  const [x, y] = tileOf(s);
  G.burials.push({ x, y, t: 0 });
  SFX.bury();
}

// B: lägg ut en mask som bete
function dropWorm() {
  const [x, y] = tileOf(G.player);
  if (G.worms < 1 || G.baits.some((b) => b.x === x && b.y === y)) { SFX.nope(); return; }
  G.worms--;
  G.baits.push({ x, y, t: 0, eater: null });
  SFX.drop();
}

// ---------- Dragning i håret ----------
const PULL_FRAME = 0.11;
function startPull(s) {
  G.mode = 'pull';
  G.pull = { t: 0, stage: G.player.hair + 1, skel: s };
  SFX.pull();
}
function updatePull(dt) {
  const pl = G.pull;
  pl.t += dt;
  if (pl.stage === 2 && !pl.ripped && pl.t > PULL_FRAME * 4) { pl.ripped = true; SFX.rip(); }
  if (pl.t >= PULL_FRAME * 7 + 0.25) {
    const p = G.player;
    p.hair = pl.stage;
    G.pull = null;
    if (p.hair >= 2) { G.mode = 'over'; G.overTimer = 0.8; return; }
    G.mode = 'play';
    p.invuln = CFG.invulnTime;
    pl.skel.stun = CFG.stunTime;
  }
  input.aPressed = input.bPressed = false;
}

// ---------- Ritning ----------
const HAIR_ROW = (h) => h * 4;
function draw() {
  ctx.fillStyle = '#1b1522';
  ctx.fillRect(0, 0, W, H);
  drawMap();
  drawHud();
  drawControls();
  if (G.mode === 'title') drawTitle();
  if (G.mode === 'over') drawOver();
}

function drawMap() {
  ctx.save();
  ctx.translate(0, MAP_Y);
  ctx.beginPath(); ctx.rect(0, 0, COLS * T, ROWS * T); ctx.clip();
  ctx.drawImage(ground, 0, 0);
  const now = performance.now() / 1000;

  // markföremål
  for (const b of G.burials) {
    const f = b.t < BURIAL_IDLE_AT ? Math.min(9, Math.floor(b.t / 0.09)) : 10 + Math.floor(now / 0.16) % 4;
    cell('burial', f, 0, b.x * T, b.y * T);
  }
  for (const b of G.bones) {
    const bob = Math.round(Math.sin(now * 3 + b.x) * 1);
    ctx.fillStyle = 'rgba(20,14,26,0.35)';
    ctx.fillRect(b.x * T + 8, b.y * T + 22, 16, 3);
    cell('bones', BONE_COL[b.type], 0, b.x * T, b.y * T - 2 + bob);
  }
  for (const b of G.baits) cell('worm_crawl', Math.floor(now / 0.18) % 4, 2, b.x * T, b.y * T);
  for (const w of G.wormsOnMap) cell('worm_crawl', walkFrame(w), DIR_ROW[w.dir], posX(w), posY(w));
  for (const s of G.spawns) {
    const f = 6 - Math.min(6, Math.floor((s.t / SPAWN_TIME) * 7));
    cell('burial', f, 0, s.x * T, s.y * T);
  }
  for (const f of G.poofs) {
    ctx.fillStyle = `rgba(243,234,210,${1 - f.t / 0.3})`;
    const r = 4 + f.t * 30;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(f.x * T + 16 + dx * r - 1, f.y * T + 16 + dy * r - 1, 2, 2);
  }

  // allt som står upp sorteras på y (gravstenar, skelett, spelare)
  const list = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (isWall(x, y)) list.push({ y: y * T, draw: () => cell('graves', (x + y) % 2, 0, x * T, y * T) });
  }
  for (const s of G.skels) {
    list.push({ y: posY(s), draw: () => {
      const shake = s.stun > 0 ? Math.round(Math.sin(now * 40)) : 0;
      cell('skeleton_walk', s.eat > 0 ? Math.floor(now / 0.15) % 2 : walkFrame(s), DIR_ROW[s.eat > 0 ? 'down' : s.dir], posX(s) + shake, posY(s));
      if (s.chasing && s.stun <= 0 && s.eat <= 0) text('!', posX(s) + 15, posY(s) - 6, '#ffd966');
    } });
  }
  const p = G.player;
  list.push({ y: posY(p) + 0.1, draw: () => {
    if (G.mode === 'pull') {
      const f = Math.min(6, Math.floor(G.pull.t / PULL_FRAME));
      cell('player_pull', f, G.pull.stage - 1, posX(p), posY(p) - 16, T, 48);
      return;
    }
    if (p.invuln > 0 && Math.floor(now * 12) % 2) return;
    cell('player_walk', walkFrame(p), HAIR_ROW(Math.min(p.hair, 2)) + DIR_ROW[p.dir], posX(p), posY(p));
  } });
  list.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

  for (const f of G.floats) shadowText(f.str, f.x, f.y - f.t * 20, f.color ?? '#f3ead2', 1, 'center');
  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = '#221a2b';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = '#2a1f33';
  ctx.fillRect(0, HUD_H - 2, W, 2);
  // benräknaren: färdiga skelett först, max 7 syns
  const masks = counterMasks();
  const shown = masks.slice(0, 7);
  shown.forEach((m, i) => {
    const x = 4 + i * 30, y = 4;
    if (m === 63) { ctx.fillStyle = '#4a3b25'; ctx.fillRect(x + 2, y + 1, 28, 31); }
    ctx.drawImage(IMG.counter_combos, (m % 8) * T, Math.floor(m / 8) * T, T, T, x, y, T, T);
  });
  if (masks.length > 7) text(`+${masks.length - 7}`, 4 + 7 * 30, 18);
  if (!masks.length) text('PLOCKA BEN', 8, 17, '#7d7290');
  // pengar och maskar
  ctx.fillStyle = '#3d7a36'; ctx.fillRect(268, 8, 14, 9);
  ctx.fillStyle = '#5fae4e'; ctx.fillRect(268, 8, 13, 8);
  ctx.fillStyle = '#b4e39a'; ctx.fillRect(270, 10, 9, 4);
  ctx.fillStyle = '#5fae4e'; ctx.fillRect(273, 10, 3, 4);
  shadowText(String(G.money), 344, 9, '#b4e39a', 2, 'right');
  ctx.fillStyle = '#e58ba0'; ctx.fillRect(268, 27, 10, 3); ctx.fillRect(278, 25, 3, 5);
  ctx.fillStyle = '#2a1f33'; ctx.fillRect(279, 26, 1, 1);
  shadowText(`${G.worms}`, 344, 25, '#f7c1cc', 1, 'right');
}

function circle(cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}
function drawControls() {
  ctx.fillStyle = '#2b2236';
  ctx.fillRect(0, CTRL_Y, W, H - CTRL_Y);
  ctx.fillStyle = '#3a2f48';
  ctx.fillRect(0, CTRL_Y, W, 3);
  // styrkors
  const { x, y, arm } = PAD;
  const len = 58;
  const held = heldDir();
  circle(x, y, 66, '#241c2e');
  ctx.fillStyle = '#15101b';
  ctx.fillRect(x - arm / 2, y - len + 3, arm, len * 2);
  ctx.fillRect(x - len, y - arm / 2 + 3, len * 2, arm);
  ctx.fillStyle = '#4a3f5c';
  ctx.fillRect(x - arm / 2, y - len, arm, len * 2);
  ctx.fillRect(x - len, y - arm / 2, len * 2, arm);
  ctx.fillStyle = '#5d5174';
  ctx.fillRect(x - arm / 2, y - len, arm, 2);
  ctx.fillRect(x - len, y - arm / 2, 2, arm);
  if (held) {
    const [dx, dy] = DIRS[held];
    ctx.fillStyle = '#7d6f99';
    ctx.fillRect(x + dx * 36 - arm / 2 + 2, y + dy * 36 - arm / 2 + 2, arm - 4, arm - 4);
  }
  for (const [d, [dx, dy]] of Object.entries(DIRS)) {
    ctx.fillStyle = '#2a1f33';
    const ax = x + dx * 44, ay = y + dy * 44;
    for (let i = 0; i < 4; i++) {
      if (dx) ctx.fillRect(ax - dx * i, ay - i, 1, i * 2 + 1);
      else ctx.fillRect(ax - i, ay - dy * i, i * 2 + 1, 1);
    }
    void d;
  }
  // knappar
  for (const [b, lbl, hint, down, ready] of [
    [BTN_A, 'A', 'BEGRAV', input.a, completeSets() > 0],
    [BTN_B, 'B', 'MASK', input.b, G.worms > 0],
  ]) {
    circle(b.x, b.y + 3, b.r, '#15101b');
    circle(b.x, b.y + (down ? 2 : 0), b.r, ready ? '#c44a5a' : '#6b3a48');
    circle(b.x - 6, b.y - 8 + (down ? 2 : 0), 5, ready ? '#e07583' : '#7d4a58');
    shadowText(lbl, b.x, b.y - 4 + (down ? 2 : 0), '#f3ead2', 2, 'center');
    text(hint, b.x, b.y + b.r + 8, ready ? '#f3ead2' : '#7d7290', 1, 'center');
  }
}

function panel(y, h) {
  ctx.fillStyle = 'rgba(27,21,34,0.86)';
  ctx.fillRect(24, y, W - 48, h);
  ctx.fillStyle = '#4a3f5c';
  ctx.fillRect(24, y, W - 48, 2); ctx.fillRect(24, y + h - 2, W - 48, 2);
}
function drawTitle() {
  panel(MAP_Y + 52, 184);
  shadowText('BENPENGAR', W / 2, MAP_Y + 68, '#f3ead2', 4, 'center');
  ctx.drawImage(IMG.player_walk, 0, 0, T, T, W / 2 - 52, MAP_Y + 100, T, T);
  ctx.drawImage(IMG.skeleton_walk, 0, 0, T, T, W / 2 + 20, MAP_Y + 100, T, T);
  text('PLOCKA BEN OCH BYGG SKELETT', W / 2, MAP_Y + 144, '#c9bfd9', 1, 'center');
  text('A: BEGRAV ETT SKELETT - HÄMTA SEDELN', W / 2, MAP_Y + 156, '#c9bfd9', 1, 'center');
  text('B: SLÄNG EN MASK SOM BETE', W / 2, MAP_Y + 168, '#c9bfd9', 1, 'center');
  text('AKTA HÅRET!', W / 2, MAP_Y + 184, '#ffd966', 1, 'center');
  if (Math.floor(performance.now() / 500) % 2) shadowText('TRYCK A', W / 2, MAP_Y + 208, '#b4e39a', 2, 'center');
}
function drawOver() {
  panel(MAP_Y + 70, 150);
  shadowText('SKALLIG!', W / 2, MAP_Y + 86, '#f3ead2', 4, 'center');
  shadowText(`$${G.money}`, W / 2, MAP_Y + 128, '#b4e39a', 3, 'center');
  text(`TID ${Math.floor(G.time)} S`, W / 2, MAP_Y + 160, '#c9bfd9', 1, 'center');
  if (G.overTimer <= 0 && Math.floor(performance.now() / 500) % 2) shadowText('A = IGEN', W / 2, MAP_Y + 184, '#b4e39a', 2, 'center');
}

// ---------- Huvudloop ----------
let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
loadAll().then(() => requestAnimationFrame(frame)).catch((e) => {
  ctx.fillStyle = '#fff'; ctx.fillText(`Kunde inte ladda grafik: ${e}`, 10, 20);
});

// för automatiska tester
window.__benpengar = { get state() { return G; }, CFG, step(dt, n = 1) { for (let i = 0; i < n; i++) update(dt); draw(); } };
