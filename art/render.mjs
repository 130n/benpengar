// Renderar SVG-frames till högupplösta PNG via Chromium.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');
import { writeFileSync, mkdirSync } from 'node:fs';
import { skeletonSVG, WALK, PARTS, IDLE } from './skeleton-svg.mjs';
import { ITEMS } from './items-svg.mjs';
import { playerSVG, pullFrames, HAIR_STATES } from './player-svg.mjs';

const out = process.argv[2] ?? 'build';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
for (const [dir, frames] of Object.entries(WALK)) {
  for (const [i, f] of frames.entries()) {
    const svg = skeletonSVG(dir, f);
    writeFileSync(`${out}/walk_${dir}_${i}.svg`, svg);
    await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
    await page.locator('svg').screenshot({ path: `${out}/walk_${dir}_${i}_hi.png`, omitBackground: true });
  }
}
for (const [name, frames] of Object.entries(ITEMS)) {
  for (const [i, svg] of frames.entries()) {
    writeFileSync(`${out}/${name}_${i}.svg`, svg);
    await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
    await page.locator('svg').screenshot({ path: `${out}/${name}_${i}_hi.png`, omitBackground: true });
  }
}
// Ett lager per bendel (framifrån, stillastående) för benräknaren
for (const p of PARTS) {
  await page.setContent(`<body style="margin:0;background:transparent">${skeletonSVG('down', IDLE, 512, [p])}</body>`);
  await page.locator('svg').screenshot({ path: `${out}/layer_${p}_hi.png`, omitBackground: true });
}
// Spelare: hårstadium x riktning x frame, och dragningsanimationerna (32x48)
async function shot(svg, path) {
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  await page.locator('svg').screenshot({ path, omitBackground: true });
}
for (const st of HAIR_STATES) {
  for (const [dir, frames] of Object.entries(WALK)) {
    for (const [i, f] of frames.entries()) {
      await shot(playerSVG(dir, f, st, st === 'normal' ? 'normal' : 'shock'), `${out}/player_${st}_${dir}_${i}_hi.png`);
    }
  }
}
for (const stage of [1, 2]) {
  for (const [i, svg] of pullFrames(stage).entries()) await shot(svg, `${out}/pull${stage}_${i}_hi.png`);
}
await browser.close();
