// Benpengar – originalmusik i 8-bitarsstil, genererad med Web Audio.
// Ett kusligt "boom-chicka"-komp i E-moll: bas på slag 1 och 3, virvel på 2 och 4,
// hi-hat på åttondelarna och en fyrkantsvågsmelodi ovanpå. 16 takter som loopar.
'use strict';

const Music = (() => {
  const BPM = 132;
  const EIGHTH = 60 / BPM / 2;

  // Melodi: [ton, längd i åttondelar]. 'r' = paus. Åtta åttondelar per takt.
  const A = [
    ['E4', 2], ['G4', 1], ['B4', 1], ['A4', 2], ['G4', 2],
    ['F#4', 1], ['G4', 1], ['F#4', 1], ['E4', 1], ['D#4', 2], ['E4', 2],
    ['A4', 2], ['C5', 1], ['B4', 1], ['A4', 2], ['E4', 2],
    ['F#4', 2], ['A4', 1], ['G4', 1], ['F#4', 2], ['D#4', 2],
  ];
  const A2 = [
    ['E4', 2], ['G4', 1], ['B4', 1], ['E5', 2], ['D5', 1], ['B4', 1],
    ['C5', 2], ['B4', 1], ['A4', 1], ['G4', 2], ['E4', 2],
    ['F#4', 1], ['G4', 1], ['A4', 1], ['B4', 1], ['D#5', 2], ['F#4', 2],
    ['E4', 4], ['r', 4],
  ];
  const B = [
    ['C5', 2], ['C5', 1], ['B4', 1], ['A4', 2], ['G4', 2],
    ['B4', 2], ['B4', 1], ['A4', 1], ['G4', 2], ['D4', 2],
    ['A4', 1], ['B4', 1], ['C5', 1], ['D5', 1], ['E5', 2], ['C5', 2],
    ['B4', 2], ['A4', 1], ['G4', 1], ['F#4', 2], ['B3', 2],
  ];
  const MELODY = [...A, ...A2, ...B, ...A2];
  // Ackord per takt: [grundton, kvint] för boom-chicka-basen
  const CH = { Em: ['E2', 'B2'], Am: ['A2', 'E3'], B7: ['B2', 'F#2'], C: ['C3', 'G2'], G: ['G2', 'D3'] };
  const BARS = ['Em', 'Em', 'Am', 'B7', 'Em', 'C', 'B7', 'Em', 'C', 'G', 'Am', 'B7', 'Em', 'C', 'B7', 'Em'];
  const STEPS = BARS.length * 8;

  // Kort sorglig slinga när spelet tar slut
  const OVER = [['B4', 2], ['G4', 2], ['E4', 2], ['D#4', 2], ['E4', 6]];

  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = (n) => {
    const m = /^([A-G]#?)(\d)$/.exec(n);
    return 440 * 2 ** ((SEMI[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12);
  };

  // melodin utplattad till steg: steg -> [ton, längd]
  const melodyAt = new Map();
  { let s = 0; for (const [n, len] of MELODY) { if (n !== 'r') melodyAt.set(s, [n, len]); s += len; } }

  let ctx = null, master = null, noise = null, timer = null, step = 0, nextTime = 0, playing = false;
  let muted = false;
  try { muted = localStorage.getItem('benpengar-muted') === '1'; } catch { /* privat läge */ }

  function attach(audioCtx) {
    if (ctx || !audioCtx) return;
    ctx = audioCtx;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(type, f, t, dur, vol, slide = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function hit(t, dur, vol, hp) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master);
    s.start(t); s.stop(t + dur);
  }

  function scheduleStep(s, t) {
    const beat = s % 8;
    const [root, fifth] = CH[BARS[Math.floor(s / 8)]];
    // boom: bas på slag 1 och 3
    if (beat === 0) tone('triangle', freq(root), t, EIGHTH * 1.6, 0.22);
    if (beat === 4) tone('triangle', freq(fifth), t, EIGHTH * 1.6, 0.22);
    // chicka: virvel på 2 och 4, hi-hat på resten av åttondelarna
    if (beat === 2 || beat === 6) hit(t, 0.09, 0.09, 1500);
    else hit(t, 0.03, 0.035, 7000);
    const m = melodyAt.get(s);
    if (m) tone('square', freq(m[0]), t, m[1] * EIGHTH * 0.92, 0.045);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.12) {
      scheduleStep(step, nextTime);
      step = (step + 1) % STEPS;
      nextTime += EIGHTH;
    }
  }

  function start() {
    if (!ctx || playing || muted) return;
    playing = true;
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(tick, 25);
  }
  function stop() {
    playing = false;
    clearInterval(timer);
    timer = null;
  }
  function gameOver() {
    stop();
    if (!ctx || muted) return;
    let t = ctx.currentTime + 0.1;
    for (const [n, len] of OVER) { tone('square', freq(n), t, len * EIGHTH * 1.4, 0.05, n === 'E4' && len > 2 ? 0.97 : 0); t += len * EIGHTH * 1.4; }
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('benpengar-muted', muted ? '1' : '0'); } catch { /* ignoreras */ }
    if (muted) stop(); else start();
    return muted;
  }

  // Renderar hela slingan offline (för att lyssna/exportera utan att spela)
  async function renderLoop(rate = 22050) {
    const len = STEPS * EIGHTH + 0.6;
    const off = new OfflineAudioContext(1, Math.ceil(rate * len), rate);
    const saved = [ctx, master, noise];
    ctx = null; attach(off);
    for (let s = 0; s < STEPS; s++) scheduleStep(s, 0.05 + s * EIGHTH);
    const buf = await off.startRendering();
    [ctx, master, noise] = saved;
    return buf;
  }

  return { attach, start, stop, gameOver, toggleMute, renderLoop, get muted() { return muted; }, get playing() { return playing; } };
})();
