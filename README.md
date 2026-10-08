# Benpengar

Ett litet halloween-arkadspel i pixelgrafik, byggt för mobil i porträttläge.

Plocka bendelar på kyrkogården och bygg ihop skelett. Ett färdigt skelett kan
du använda för att begrava ett av skeletten som jagar dig (A) – då sticker en
benhand upp ur jorden med en sedel som du springer och hämtar. Fånga maskar och
släng ut dem som bete (B). Blir du tagen dras du i håret: första gången står det
rakt upp, andra gången är det borta – och spelet slut.

**Spela:** GitHub Pages-sidan för det här repot.

## Kontroller
| | Mobil | Tangentbord |
|---|---|---|
| Gå | styrkorset | piltangenter / WASD |
| A – begrav | A-knappen | Z / J / mellanslag |
| B – släng mask | B-knappen | X / K |

## Struktur
- `index.html`, `game.js` – spelet (ingen byggprocess, ren canvas).
  Balansvärden ligger i `CFG` överst i `game.js`.
- `assets/` – spritesheets som spelet laddar.
- `art/` – grafikpipelinen: SVG ritad på 32x32-rutnät → Chromium → pixelering.
  Se `art/README.md`.

## Köra lokalt
```bash
python3 -m http.server
# öppna http://localhost:8000
```
