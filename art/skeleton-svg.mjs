// Genererar SVG-frames för ett gulligt chibi-skelett (framifrån, gångcykel).
// Koordinatsystem: 32x32 enheter = 32x32 px i slutlig sprite.
// Regel: alla detaljer ligger på heltalskoordinater och delar separeras med
// minst 1 enhets mellanrum, annars flyter de ihop vid pixeleringen.
export const PALETTE = {
  dark: '#2a1f33',
  bone: '#f3ead2',
  shade: '#b8a98a',
  light: '#ffffff',
};

const P = PALETTE;
const rect = (x, y, w, h, fill, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;

// Lem: 2 px bred, ljus vänsterkolumn + skuggad högerkolumn, rund fot/hand
function limb(x, y1, y2, endW) {
  return rect(x, y1, 2, y2 - y1, P.shade) + rect(x, y1, 1, y2 - y1, P.bone) +
    rect(x + 1 - endW / 2, y2 - 1, endW, 2, P.shade, 1) + rect(x + 1 - endW / 2, y2 - 1, endW - 1, 1, P.bone);
}

// frame: { bob, lLeg, rLeg, lArm, rArm } — bob/lyft i hela pixlar
// parts: vilka av de 6 lagren som ritas (används för benräknaren i HUD:en)
export const PARTS = ['skull', 'torso', 'armL', 'armR', 'legL', 'legR'];

function frontSVG(f, size, parts = PARTS) {
  const has = (p) => parts.includes(p);
  const b = f.bob;
  const sk = 9 + b; // skallens centrum y

  const legs = (has('legL') ? limb(13, 26 + b, 30 - f.lLeg, 3) : '') + (has('legR') ? limb(17, 26 + b, 30 - f.rLeg, 3) : '');
  const arms = (has('armL') ? limb(9, 19 + b, 24 + b - f.lArm, 3) : '') + (has('armR') ? limb(21, 19 + b, 24 + b - f.rArm, 3) : '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <defs><clipPath id="skull"><ellipse cx="16" cy="${sk}" rx="8" ry="7"/></clipPath></defs>
  ${legs}
  ${arms}
  ${has('torso') ? `
  <!-- bäcken -->
  ${rect(12, 24 + b, 8, 2, P.shade)}${rect(12, 24 + b, 7, 1, P.bone)}
  <!-- bröstkorg: revben på var sida om ryggraden -->
  ${rect(12, 18 + b, 8, 6, P.shade)}${rect(12, 18 + b, 7, 5, P.bone)}
  ${rect(13, 19 + b, 2, 1, P.dark)}${rect(17, 19 + b, 2, 1, P.dark)}
  ${rect(13, 21 + b, 2, 1, P.dark)}${rect(17, 21 + b, 2, 1, P.dark)}` : ''}
  ${has('skull') ? `
  <!-- skalle med cel-skugga nere till höger + glans -->
  <g clip-path="url(#skull)">
    ${rect(0, 0, 32, 32, P.shade)}
    <ellipse cx="15" cy="${sk - 1}" rx="8" ry="7" fill="${P.bone}"/>
    ${rect(10, sk - 5, 3, 1, P.light)}${rect(9, sk - 4, 1, 1, P.light)}
  </g>
  <!-- käke: smalare än skallen (konturen viker in vid kinderna), munlinje tvärs
       över med tandstreck som korsar den uppåt och nedåt -->
  ${rect(11, sk + 5, 10, 3, P.shade, 1)}${rect(11, sk + 5, 9, 2, P.bone)}
  ${rect(11, sk + 5, 10, 1, P.dark)}
  ${[13, 15, 17, 19].map((x) => rect(x, sk + 4, 1, 3, P.dark)).join('')}
  <!-- ögonhålor (4x4) + glans -->
  ${rect(10, sk - 1, 4, 4, P.dark, 1.2)}${rect(18, sk - 1, 4, 4, P.dark, 1.2)}
  ${rect(11, sk, 1, 1, P.light)}${rect(19, sk, 1, 1, P.light)}
  <!-- näsa -->
  ${rect(15, sk + 2, 2, 1, P.dark)}` : ''}
</svg>`;
}

// Bakifrån: samma kropp som framifrån men slät skalle och ryggrad i mitten
function backSVG(f, size) {
  const b = f.bob;
  const sk = 9 + b;
  const legs = limb(13, 26 + b, 30 - f.lLeg, 3) + limb(17, 26 + b, 30 - f.rLeg, 3);
  const arms = limb(9, 19 + b, 24 + b - f.rArm, 3) + limb(21, 19 + b, 24 + b - f.lArm, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <defs><clipPath id="skull"><ellipse cx="16" cy="${sk}" rx="8" ry="7"/></clipPath></defs>
  ${legs}
  ${arms}
  ${rect(12, 24 + b, 8, 2, P.shade)}${rect(12, 24 + b, 7, 1, P.bone)}
  ${rect(12, 18 + b, 8, 6, P.shade)}${rect(12, 18 + b, 7, 5, P.bone)}
  ${rect(13, 19 + b, 1, 1, P.dark)}${rect(18, 19 + b, 1, 1, P.dark)}
  ${rect(13, 21 + b, 1, 1, P.dark)}${rect(18, 21 + b, 1, 1, P.dark)}
  ${rect(15, 18 + b, 2, 6, P.shade)}${rect(15, 19 + b, 2, 1, P.bone)}${rect(15, 21 + b, 2, 1, P.bone)}
  <g clip-path="url(#skull)">
    ${rect(0, 0, 32, 32, P.shade)}
    <ellipse cx="15" cy="${sk - 1}" rx="8" ry="7" fill="${P.bone}"/>
    ${rect(10, sk - 5, 3, 1, P.light)}${rect(9, sk - 4, 1, 1, P.light)}
    ${rect(17, sk - 6, 1, 2, P.shade)}${rect(18, sk - 4, 1, 1, P.shade)}
  </g>
  ${rect(11, sk + 5, 10, 3, P.shade, 1)}${rect(11, sk + 5, 9, 1, P.bone)}
</svg>`;
}

// Sida (vänd åt höger): kroppen i profil, huvudet fuskat i trekvartsvinkel
// (båda ögonen syns, ansiktet förskjutet framåt). Vänster = spegling.
// Bara raka block (diagonaler blir trappsteg i 32 px). Bortre ben i skuggfärg.
function sideSVG(f, size) {
  const b = f.bob;
  const sk = 9 + b;
  const hip = 26 + b;
  const leg = (dx, lift, near) => {
    const c = near ? P.bone : P.shade;
    const fy = 29 - lift;
    return rect(15, hip, 2, 2, c) + rect(15 + dx, hip + 2, 2, fy - hip - 2, c) +
      rect(15 + dx, fy, 3, 2, P.shade) + (near ? rect(15 + dx, fy, 2, 1, P.bone) : '');
  };
  const ax = 15 + f.swing;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <defs><clipPath id="skull"><ellipse cx="15" cy="${sk}" rx="8" ry="7"/></clipPath></defs>
  ${leg(-f.step, f.farLift, false)}
  ${leg(f.step, f.nearLift, true)}
  ${rect(13, 24 + b, 6, 2, P.shade)}${rect(13, 24 + b, 5, 1, P.bone)}
  ${rect(13, 18 + b, 6, 6, P.shade)}${rect(13, 18 + b, 5, 5, P.bone)}
  ${rect(16, 19 + b, 2, 1, P.dark)}${rect(16, 21 + b, 2, 1, P.dark)}
  <!-- närmre arm: mörk kant bakom, ljust ben, hand -->
  ${rect(ax - 1, 18 + b, 1, 5, P.dark)}${rect(ax, 18 + b, 2, 5, P.shade)}${rect(ax, 18 + b, 1, 5, P.bone)}
  ${rect(ax - 1, 23 + b, 3, 2, P.shade)}${rect(ax - 1, 23 + b, 2, 1, P.bone)}
  <g clip-path="url(#skull)">
    ${rect(0, 0, 32, 32, P.shade)}
    <ellipse cx="14" cy="${sk - 1}" rx="7" ry="7" fill="${P.bone}"/>
    ${rect(10, sk - 5, 3, 1, P.light)}${rect(9, sk - 4, 1, 1, P.light)}
  </g>
  <!-- käke förskjuten framåt: konturen viker in bara på bakre sidan -->
  ${rect(14, sk + 5, 8, 2, P.shade)}${rect(14, sk + 7, 7, 1, P.shade)}${rect(14, sk + 5, 7, 2, P.bone)}
  ${rect(14, sk + 5, 8, 1, P.dark)}
  ${[15, 17, 19].map((x) => rect(x, sk + 4, 1, 3, P.dark)).join('')}
  ${rect(13, sk + 4, 1, 1, P.dark)}${rect(21, sk + 4, 1, 1, P.dark)}
  <!-- närmre öga 4 px brett, bortre öga hoptryckt mot kanten -->
  ${rect(12, sk - 1, 4, 4, P.dark, 1.2)}${rect(13, sk, 1, 1, P.light)}
  ${rect(19, sk - 1, 3, 4, P.dark, 1)}${rect(20, sk, 1, 1, P.light)}
  ${rect(17, sk + 2, 1, 1, P.dark)}
</svg>`;
}

export function skeletonSVG(dir, f, size = 512, parts) {
  return { down: frontSVG, up: backSVG, right: sideSVG }[dir](f, size, parts);
}

// 4-frame gångcykel: kontakt, passage (lyft), kontakt, passage (andra benet)
const WALK_FRONT = [
  { bob: 0, lLeg: 0, rLeg: 0, lArm: 2, rArm: 0 },
  { bob: -1, lLeg: 1, rLeg: 0, lArm: 0, rArm: 0 },
  { bob: 0, lLeg: 0, rLeg: 0, lArm: 0, rArm: 2 },
  { bob: -1, lLeg: 0, rLeg: 1, lArm: 0, rArm: 0 },
];

// Profil: steg framåt/bakåt syns tydligt, arm svänger motsatt närmre benet
const WALK_SIDE = [
  { bob: 0, step: 2, nearLift: 0, farLift: 0, swing: -1 },
  { bob: -1, step: 0, nearLift: 0, farLift: 1, swing: 0 },
  { bob: 0, step: -2, nearLift: 0, farLift: 0, swing: 1 },
  { bob: -1, step: 0, nearLift: 1, farLift: 0, swing: 0 },
];

export const WALK = { down: WALK_FRONT, up: WALK_FRONT, right: WALK_SIDE };

// Stillastående pose för HUD-räknaren
export const IDLE = { bob: 0, lLeg: 0, rLeg: 0, lArm: 0, rArm: 0 };
