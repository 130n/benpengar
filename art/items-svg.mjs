// Föremål: bendelar (plockbara), gravstenar (hinder) och mask (kryper i 4 riktningar).
// Samma regler som skelettet: 32x32 rutnät, heltalskoordinater, konturen läggs på i pixeleringen.
import { PALETTE as SK } from './skeleton-svg.mjs';

export const PALETTE = {
  ...SK,
  stone: '#8b90a0',
  stoneShade: '#5f6375',
  stoneLight: '#b9bfcc',
  moss: '#6f9a4c',
  worm: '#e58ba0',
  wormShade: '#b75a76',
  wormLight: '#f7c1cc',
  dirt: '#7a5440',
  dirtShade: '#523829',
  dirtLight: '#a07458',
  cash: '#5fae4e',
  cashShade: '#3d7a36',
  cashLight: '#b4e39a',
};
const P = PALETTE;
const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32" shape-rendering="crispEdges">${body}</svg>`;

// ---------- Bendelar ----------
// Liggande ben med "hundbens"-knopp i ena änden. Skaft 2 px, skugga på undre raden.
function knob(x) {
  return rect(x, 12, 3, 3, P.bone) + rect(x, 17, 3, 3, P.shade) + rect(x, 15, 3, 2, P.bone) +
    rect(x - 1, 12, 1, 3, P.bone) + rect(x - 1, 17, 1, 3, P.shade) + rect(x, 19, 3, 1, P.shade) +
    rect(x - 1, 12, 2, 1, P.light);
}
function shaft(x1, x2) {
  return rect(x1, 15, x2 - x1, 1, P.bone) + rect(x1, 16, x2 - x1, 1, P.shade);
}

const skull = svg(`
  <defs><clipPath id="c"><ellipse cx="16" cy="14" rx="7" ry="6"/></clipPath></defs>
  <g clip-path="url(#c)">${rect(0, 0, 32, 32, P.shade)}<ellipse cx="15" cy="13" rx="7" ry="6" fill="${P.bone}"/>${rect(11, 9, 3, 1, P.light)}</g>
  ${rect(12, 18, 8, 3, P.shade)}${rect(12, 18, 7, 2, P.bone)}${rect(12, 18, 8, 1, P.dark)}
  ${[14, 16, 18].map((x) => rect(x, 17, 1, 3, P.dark)).join('')}
  ${rect(11, 13, 3, 3, P.dark)}${rect(18, 13, 3, 3, P.dark)}${rect(12, 14, 1, 1, P.light)}${rect(19, 14, 1, 1, P.light)}
  ${rect(16, 16, 1, 1, P.dark)}`);

// Bröstkorg: ryggrad i mitten, revben som separata bågar med luft emellan
// (konturen fyller glipan och gör varje revben läsbart). Smalnar av nedåt.
const ribs = svg(`
  ${[[10, 12], [13, 12], [16, 10], [19, 8]].map(([y, w]) => {
    const x = 16 - w / 2;
    return rect(x, y, w, 2, P.shade) + rect(x, y, w - 1, 1, P.bone) + rect(x, y + 1, 1, 1, P.bone);
  }).join('')}
  ${rect(15, 8, 2, 16, P.shade)}${rect(15, 8, 1, 16, P.bone)}
  ${rect(11, 10, 2, 1, P.light)}`);

// Arm: knopp + skaft + hand med fingrar
const arm = svg(`
  ${knob(7)}${shaft(10, 20)}
  ${rect(20, 13, 4, 6, P.shade)}${rect(20, 13, 3, 5, P.bone)}
  ${rect(24, 13, 3, 1, P.bone)}${rect(24, 15, 3, 1, P.bone)}${rect(24, 17, 3, 1, P.shade)}
  ${rect(22, 11, 1, 2, P.bone)}`);

// Ben (lårben): längre, knopp + skaft + fot med tår framåt
const leg = svg(`
  ${knob(5)}${shaft(8, 22)}
  ${rect(22, 11, 3, 8, P.shade)}${rect(22, 11, 2, 7, P.bone)}
  ${rect(25, 16, 3, 3, P.shade)}${rect(25, 16, 3, 2, P.bone)}${rect(26, 16, 1, 2, P.dark)}`);

// ---------- Gravstenar ----------
const headstone = svg(`
  <defs><clipPath id="g"><rect x="7" y="5" width="18" height="24" rx="8"/></clipPath></defs>
  <g clip-path="url(#g)">
    ${rect(7, 5, 18, 24, P.stoneShade)}${rect(7, 5, 16, 22, P.stone)}${rect(9, 7, 4, 1, P.stoneLight)}${rect(8, 8, 1, 6, P.stoneLight)}
  </g>
  ${rect(15, 11, 2, 10, P.stoneShade)}${rect(12, 13, 8, 2, P.stoneShade)}
  ${rect(5, 26, 22, 4, P.stoneShade)}${rect(5, 26, 21, 2, P.stone)}${rect(6, 26, 4, 1, P.stoneLight)}
  ${rect(7, 23, 4, 3, P.moss)}${rect(9, 21, 2, 2, P.moss)}${rect(20, 25, 3, 1, P.moss)}`);

const cross = svg(`
  ${rect(13, 4, 6, 24, P.stoneShade)}${rect(13, 4, 5, 23, P.stone)}
  ${rect(7, 9, 18, 6, P.stoneShade)}${rect(7, 9, 17, 5, P.stone)}
  ${rect(14, 5, 2, 1, P.stoneLight)}${rect(8, 10, 4, 1, P.stoneLight)}${rect(13, 5, 1, 4, P.stoneLight)}
  ${rect(15, 17, 2, 1, P.stoneShade)}${rect(15, 20, 2, 1, P.stoneShade)}
  ${rect(8, 26, 16, 4, P.stoneShade)}${rect(8, 26, 15, 2, P.stone)}
  ${rect(18, 23, 3, 3, P.moss)}${rect(9, 25, 3, 1, P.moss)}`);

// ---------- Mask ----------
// Kroppen byggs av kolumner (sida) eller rader (upp/ner). Var tredje segment mörkare = ringar.
// Krypcykel: utsträckt -> puckel -> hopdragen hög puckel -> puckel framåt.
const SIDE_FRAMES = [
  { tail: 9, arch: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { tail: 10, arch: [0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0] },
  { tail: 12, arch: [0, 0, 1, 2, 3, 3, 2, 1, 0] },
  { tail: 11, arch: [0, 0, 0, 0, 1, 2, 2, 1, 0, 0] },
];
function wormSide(f) {
  const base = 23; // översta raden av kroppen när den ligger platt
  let out = '';
  f.arch.forEach((a, i) => {
    const x = f.tail + i;
    const ring = i % 3 === 1 ? P.wormShade : P.worm;
    out += rect(x, base - a, 1, 1, P.wormLight) + rect(x, base - a + 1, 1, 1, ring) + rect(x, base - a + 2, 1, 1, P.wormShade);
  });
  const hx = f.tail + f.arch.length; // huvud: lite större, med öga
  out += rect(hx, base - 1, 3, 4, P.worm) + rect(hx, base - 1, 2, 1, P.wormLight) + rect(hx, base + 2, 3, 1, P.wormShade) +
    rect(hx + 1, base, 1, 1, P.dark);
  return svg(out);
}

const VERT_FRAMES = [
  { len: 12, wig: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bulge: -1 },
  { len: 11, wig: [0, 0, 1, 1, 1, 0, 0, -1, -1, 0, 0], bulge: -1 },
  { len: 9, wig: [0, 0, 0, 0, 0, 0, 0, 0, 0], bulge: 4 },
  { len: 11, wig: [0, 0, -1, -1, -1, 0, 0, 1, 1, 0, 0], bulge: -1 },
];
// Ner = huvud nedåt med två ögon. Upp = huvud uppåt, ingen ansiktsdetalj.
function wormVert(f, down) {
  const headY = down ? 24 : 6;
  let out = '';
  for (let i = 0; i < f.len; i++) {
    const y = down ? headY - 1 - i : headY + 3 + i;
    const wide = i === f.bulge || i === f.bulge + 1;
    const x = 15 + f.wig[i] - (wide ? 1 : 0);
    const w = wide ? 5 : 3;
    const ring = i % 3 === 1 ? P.wormShade : P.worm;
    out += rect(x, y, w, 1, ring) + rect(x, y, 1, 1, P.wormLight) + rect(x + w - 1, y, 1, 1, P.wormShade);
  }
  out += rect(14, headY, 5, 3, P.worm) + rect(14, headY, 1, 3, P.wormLight) + rect(18, headY, 1, 3, P.wormShade);
  if (down) out += rect(15, headY + 1, 1, 1, P.dark) + rect(17, headY + 1, 1, 1, P.dark);
  return svg(out);
}

// ---------- Begravning ----------
// Jordhög som skelettet sjunker ner i (marklinje y=27).
const mound = svg(`
  <defs><clipPath id="m"><ellipse cx="16" cy="29" rx="11" ry="4"/></clipPath></defs>
  <g clip-path="url(#m)">${rect(0, 0, 32, 32, P.dirtShade)}<ellipse cx="15" cy="28" rx="10" ry="3" fill="${P.dirt}"/></g>
  ${rect(9, 26, 3, 1, P.dirtLight)}${rect(18, 26, 2, 1, P.dirtLight)}${rect(14, 28, 1, 1, P.dirtShade)}${rect(21, 28, 1, 1, P.dirtShade)}`);

// Benhand som håller upp en grön sedel. wave = -1/0/1 (sedeln vickar).
function cashHand(wave) {
  const bx = 9 + wave;
  const by = 6 - Math.abs(wave);
  // Sedel bakom fingrarna: mörk kant, ljus inre ram, mittmärke. Fingrarna greppar underkanten.
  const bill = rect(bx, by, 14, 7, P.cashShade) + rect(bx, by, 13, 6, P.cash) +
    rect(bx + 1, by + 1, 11, 1, P.cashLight) + rect(bx + 1, by + 4, 11, 1, P.cashLight) +
    rect(bx + 1, by + 1, 1, 4, P.cashLight) + rect(bx + 11, by + 1, 1, 4, P.cashLight) +
    rect(bx + 5, by + 2, 3, 2, P.cashShade);
  return svg(`
    ${bill}
    ${rect(15, 18, 2, 14, P.shade)}${rect(15, 18, 1, 14, P.bone)}
    ${rect(13, 15, 6, 4, P.shade)}${rect(13, 15, 5, 3, P.bone)}
    ${[13, 15, 17].map((x) => rect(x, by + 5, 1, 15 - by - 5, P.bone)).join('')}${rect(19, 14, 1, 2, P.bone)}`);
}

export const ITEMS = {
  burial_mound: [mound],
  burial_hand: [-1, 0, 1].map(cashHand),
  bones: [skull, ribs, arm, leg],
  graves: [headstone, cross],
  worm_down: VERT_FRAMES.map((f) => wormVert(f, true)),
  worm_up: VERT_FRAMES.map((f) => wormVert(f, false)),
  worm_right: SIDE_FRAMES.map(wormSide),
};
