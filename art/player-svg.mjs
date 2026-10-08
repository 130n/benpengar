// Spelarfiguren: chibi-barn med rufsigt hår. Tre hårstadier:
// 'normal' -> 'spiky' (efter första dragningen, håret står rakt upp) -> 'bald' (spelet slut).
// Samma rutnätsregler som skelettet. Gångcykeln återanvänder skelettets WALK.
import { WALK } from './skeleton-svg.mjs';

export const PALETTE = {
  dark: '#2a1f33', light: '#ffffff', bone: '#f3ead2', shade: '#b8a98a',
  skin: '#f4c7a1', skinShade: '#d49672',
  hair: '#c45e2c', hairShade: '#8a3b1e', hairLight: '#e8935a',
  shirt: '#4f86c6', shirtShade: '#355c93', pants: '#3e3a58', shoe: '#6b4a3a',
};
const P = PALETTE;
const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
let uid = 0;

// Huvud: hud med cel-skugga nere till höger. cx förskjuts i sidovy.
function head(cx, sk) {
  const id = `h${uid++}`;
  return `<defs><clipPath id="${id}"><ellipse cx="${cx}" cy="${sk}" rx="7" ry="6"/></clipPath></defs>
  <g clip-path="url(#${id})">${rect(0, -20, 32, 60, P.skinShade)}<ellipse cx="${cx - 1}" cy="${sk - 1}" rx="7" ry="6" fill="${P.skin}"/></g>`;
}

// Hår per stadium och riktning. sk = huvudets centrum y.
function hair(state, dir, cx, sk) {
  if (state === 'bald') {
    // blank skalle med glans och ett ensamt strå
    return rect(cx - 4, sk - 5, 3, 1, P.light) + rect(cx, sk - 7, 1, 1, P.hair) + rect(cx + 1, sk - 8, 1, 1, P.hair);
  }
  const id = `c${uid++}`;
  // hårkalott; bakifrån täcker den nästan hela huvudet
  const capBottom = dir === 'up' ? sk + 3 : sk - 1;
  const capCx = dir === 'right' ? cx - 1 : cx;
  let out = `<defs><clipPath id="${id}"><rect x="0" y="-20" width="32" height="${capBottom + 20}"/></clipPath></defs>
  <g clip-path="url(#${id})">
    <ellipse cx="${capCx}" cy="${sk - 3}" rx="8" ry="${dir === 'up' ? 8 : 5}" fill="${P.hairShade}"/>
    <ellipse cx="${capCx - 1}" cy="${sk - 4}" rx="7" ry="${dir === 'up' ? 7 : 4}" fill="${P.hair}"/>
  </g>
  ${rect(capCx - 5, sk - 7, 3, 1, P.hairLight)}`;
  if (state === 'normal') {
    if (dir === 'down') {
      // lugg i sicksack + hår över öronen + virvel på toppen
      out += rect(cx - 6, sk - 2, 3, 2, P.hair) + rect(cx - 2, sk - 2, 2, 1, P.hair) + rect(cx + 2, sk - 2, 3, 2, P.hairShade) +
        rect(cx - 8, sk - 3, 2, 4, P.hair) + rect(cx + 6, sk - 3, 2, 4, P.hairShade);
    } else if (dir === 'right') {
      out += rect(cx - 8, sk - 3, 5, 5, P.hair) + rect(cx - 8, sk + 1, 3, 1, P.hairShade) + rect(cx + 3, sk - 2, 3, 1, P.hair);
    }
    out += rect(cx + 1, sk - 9, 2, 1, P.hair) + rect(cx + 2, sk - 10, 1, 1, P.hair);
  } else {
    // spiky: fem raka piggar
    for (const [dx, hgt] of [[-6, 3], [-3, 4], [0, 5], [3, 4], [6, 3]]) {
      const x = cx + dx - 1;
      out += rect(x, sk - 8 - hgt + 2, 1, hgt, P.hair) + rect(x + 1, sk - 8 - hgt + 1, 1, hgt + 1, P.hair) +
        rect(x + 2, sk - 8 - hgt + 2, 1, hgt, P.hairShade);
    }
  }
  return out;
}

function face(dir, cx, sk, mood) {
  if (dir === 'up') return '';
  const shock = mood === 'shock';
  const eye = (x) => rect(x, sk, 2, 2, P.dark) + rect(x, sk, 1, 1, P.light);
  if (dir === 'down') {
    return eye(cx - 4) + eye(cx + 2) +
      (shock ? rect(cx - 1, sk + 3, 2, 2, P.dark) : rect(cx - 1, sk + 3, 2, 1, P.dark));
  }
  // sida: ett öga, mun, liten näsa, öra
  return eye(cx + 3) + rect(cx + 7, sk + 1, 1, 1, P.skin) +
    (shock ? rect(cx + 5, sk + 3, 1, 2, P.dark) : rect(cx + 5, sk + 3, 1, 1, P.dark)) +
    rect(cx - 2, sk, 2, 2, P.skinShade);
}

function body(dir, f) {
  const b = f.bob;
  if (dir === 'right') {
    const leg = (dx, lift, near) => {
      const c = near ? P.pants : P.pants;
      const fy = 29 - lift;
      return rect(15, 25 + b, 2, 2, c) + rect(15 + dx, 27 + b, 2, fy - 27 - b, c) + rect(15 + dx, fy, 3, 2, P.shoe);
    };
    const ax = 15 + f.swing;
    return leg(-f.step, f.farLift, false) + leg(f.step, f.nearLift, true) +
      rect(12, 19 + b, 7, 6, P.shirtShade) + rect(12, 19 + b, 6, 5, P.shirt) +
      rect(ax - 1, 19 + b, 1, 4, P.dark) + rect(ax, 19 + b, 2, 2, P.shirtShade) + rect(ax, 21 + b, 2, 2, P.skin) +
      rect(ax, 23 + b, 2, 1, P.skinShade);
  }
  const legs = [[13, f.lLeg, -1], [17, f.rLeg, 0]].map(([x, lift, off]) =>
    rect(x, 25 + b, 2, 29 - lift - 25 - b, P.pants) + rect(x + off, 29 - lift, 3, 2, P.shoe)).join('');
  const arm = (x, lift) => rect(x, 19 + b, 2, 2, P.shirtShade) + rect(x, 21 + b, 2, 3 - lift, P.skin) + rect(x, 24 + b - lift, 2, 1, P.skinShade);
  return legs + arm(9, f.lArm) + arm(21, f.rArm) +
    rect(12, 19 + b, 8, 6, P.shirtShade) + rect(12, 19 + b, 7, 5, P.shirt) + rect(12, 24 + b, 8, 1, P.pants);
}

// Inre markup (utan <svg>) så att dragningsframes kan återanvända figuren.
export function playerInner(dir, f, state, mood = 'normal', lift = 0) {
  const sk = 12 + f.bob - lift;
  const cx = dir === 'right' ? 15 : 16;
  return `<g transform="translate(0 ${-lift})">${body(dir, f)}</g>` + head(cx, sk) + hair(state, dir, cx, sk) + face(dir, cx, sk, mood);
}

export function playerSVG(dir, f, state, mood) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32" shape-rendering="crispEdges">${playerInner(dir, f, state, mood)}</svg>`;
}

// ---------- Dragning i håret ----------
// Benhand uppifrån. Ram 32x48: 16 px luft ovanför rutan (viewBox börjar på y=-16).
function hand(tipY, clump) {
  return rect(15, -16, 2, tipY - 7 + 16, P.shade) + rect(15, -16, 1, tipY - 7 + 16, P.bone) +
    rect(13, tipY - 7, 6, 4, P.shade) + rect(13, tipY - 7, 5, 3, P.bone) +
    [13, 15, 17].map((x) => rect(x, tipY - 3, 1, 3, P.bone)).join('') +
    (clump ? rect(12, tipY, 8, 3, P.hair) + rect(13, tipY + 3, 2, 1, P.hair) + rect(17, tipY + 3, 2, 1, P.hairShade) : '');
}
// En utdragen hårtest från huvudet upp till handen
const tuft = (fromY, toY) => rect(15, toY, 2, fromY - toY, P.hair) + rect(16, toY, 1, fromY - toY, P.hairShade);

const STAND = WALK.down[0] && { bob: 0, lLeg: 0, rLeg: 0, lArm: 0, rArm: 0 };
const ARMS_UP = { bob: 0, lLeg: 0, rLeg: 0, lArm: 2, rArm: 2 };

// stage 1: normal -> spiky. stage 2: spiky -> bald (handen flyger iväg med håret).
export function pullFrames(stage) {
  const from = stage === 1 ? 'normal' : 'spiky';
  const to = stage === 1 ? 'spiky' : 'bald';
  const top = 4; // hårets topp när figuren står still
  const F = [
    { st: from, mood: from === 'normal' ? 'normal' : 'shock', lift: 0, hand: -8 },
    { st: from, mood: 'shock', lift: 0, hand: top + 1 },
    { st: from, mood: 'shock', lift: 2, hand: top - 3, tuft: true, f: ARMS_UP },
    { st: from, mood: 'shock', lift: 4, hand: top - 7, tuft: true, f: ARMS_UP },
    { st: to, mood: 'shock', lift: 1, hand: -6, clump: stage === 2 },
    { st: to, mood: 'shock', lift: 0, hand: -14, clump: stage === 2 },
    { st: to, mood: 'shock', lift: 0 },
  ];
  return F.map((fr) => {
    let inner = playerInner('down', fr.f ?? STAND, fr.st, fr.mood, fr.lift);
    if (fr.tuft) inner += tuft(top - fr.lift + 1, fr.hand);
    if (fr.hand !== undefined) inner += hand(fr.hand, fr.clump);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="768" viewBox="0 -16 32 48" shape-rendering="crispEdges">${inner}</svg>`;
  });
}

export const HAIR_STATES = ['normal', 'spiky', 'bald'];
export { WALK };
