# Skelett-sprites

SVG ritas på ett 32x32-rutnät → renderas i Chromium → pixeleras (palett-snäpp,
majoritetsröst per block, 1 px kontur).

```bash
PLAYWRIGHT_PATH=$(npm root -g)/playwright node render.mjs build
python3 pixelate.py build
python3 scene.py build   # testscen
python3 counter.py build # benräknare: 64 kombinationer + HUD-exempel
python3 burial.py build  # begravning: sjunker + hand med sedel
python3 player.py build  # spelare: 3 hårstadier + dragning
python3 export.py build  # kopierar sheets till ../assets
```

| Fil | Innehåll |
|---|---|
| `build/skeleton_walk.png` | 4 frames x 4 rader: ner, upp, höger, vänster (speglad) |
| `build/bones.png` | skalle, bröstkorg, arm, ben, arm (speglad), ben (speglad) |
| `build/graves.png` | gravsten, kors |
| `build/worm_crawl.png` | 4 frames x 4 rader: ner, upp, höger, vänster |
| `build/scene_x3.gif` | testscen i Bomberman-rutnät |
| `build/counter_combos.png` | benräknaren: 8x8 celler, cell = bitmask (skalle 1, torso 2, armV 4, armH 8, benV 16, benH 32) |
| `build/hud_example.png` | HUD med 3 skallar, 1 torso, 4 ben |
| `build/burial.png` | begravning: 0-6 sjunker, 7-9 handen stiger, 10-13 viftar med sedeln (loop) |
| `build/player_walk.png` | spelare, rad = hårstadium*4 + riktning (normal, spiky, kal) |
| `build/player_pull.png` | dragning 32x48, rad 0 normal->spiky, rad 1 spiky->kal |
