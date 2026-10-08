"""Benräknare: skelettet framifrån i 6 lager, alla 64 kombinationer.

Kombination = bitmask över PARTS (skalle=1, torso=2, armL=4, armR=8, benL=16, benR=32).
Delar som saknas ritas som grå spöksiluett bakom. Konturen läggs på unionen av
lagren, så delar som möts (bäcken/ben) får inte dubbla konturer.

Fördelning av upplockade delar (generiska armar/ben, 2 per skelett):
skelett k (1-indexerat) har skalle om skallar >= k, vänster arm om armar >= 2k-1,
höger arm om armar >= 2k, osv. Varje del går alltså till första skelettet som saknar den.
"""
import sys
from pathlib import Path
from PIL import Image
from pixelate import pixelate, outline, PALETTE, SIZE

PARTS = ["skull", "torso", "armL", "armR", "legL", "legR"]
ORDER = ["legL", "legR", "armL", "armR", "torso", "skull"]  # samma z-ordning som SVG:n
GHOST = (0x55, 0x5A, 0x66)
GHOST_EDGE = (0x3A, 0x3E, 0x4A)


def combo(layers, mask):
    union = Image.new("RGBA", (SIZE, SIZE))
    ghost = Image.new("RGBA", (SIZE, SIZE))
    for p in ORDER:
        lay = layers[p]
        if mask & (1 << PARTS.index(p)):
            union.alpha_composite(lay)
        else:
            sil = Image.new("RGBA", (SIZE, SIZE))
            for y in range(SIZE):
                for x in range(SIZE):
                    if lay.getpixel((x, y))[3]:
                        sil.putpixel((x, y), GHOST + (255,))
            ghost.alpha_composite(sil)
    # spöket får en egen mörk kant, den riktiga delen sin vanliga kontur ovanpå
    out = Image.new("RGBA", (SIZE, SIZE))
    if ghost.getbbox():
        g = outline(ghost)
        g = Image.eval(g, lambda v: v)  # kopia
        for y in range(SIZE):
            for x in range(SIZE):
                px = g.getpixel((x, y))
                if px[:3] == PALETTE["outline"]:
                    g.putpixel((x, y), GHOST_EDGE + (255,))
        out.alpha_composite(g)
    if union.getbbox():
        out.alpha_composite(outline(union))
    return out


def counts_to_masks(c):
    """c = {'skull': n, 'torso': n, 'arm': n, 'leg': n} -> lista med bitmasker, en per påbörjat skelett."""
    n = max(c["skull"], c["torso"], (c["arm"] + 1) // 2, (c["leg"] + 1) // 2)
    masks = []
    for k in range(1, n + 1):
        m = 0
        m |= (c["skull"] >= k) << 0
        m |= (c["torso"] >= k) << 1
        m |= (c["arm"] >= 2 * k - 1) << 2
        m |= (c["arm"] >= 2 * k) << 3
        m |= (c["leg"] >= 2 * k - 1) << 4
        m |= (c["leg"] >= 2 * k) << 5
        masks.append(m)
    return masks


if __name__ == "__main__":
    build = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    layers = {p: pixelate(build / f"layer_{p}_hi.png", outlined=False) for p in PARTS}
    sheet = Image.new("RGBA", (SIZE * 8, SIZE * 8))
    cells = {}
    for m in range(64):
        cells[m] = combo(layers, m)
        sheet.paste(cells[m], ((m % 8) * SIZE, (m // 8) * SIZE))
    sheet.save(build / "counter_combos.png")

    # HUD-exempel: 3 skallar, 4 ben, 1 torso (+ 2 färdiga skelett i poäng)
    hud = Image.new("RGBA", (352, 40), (0x22, 0x1A, 0x2B, 255))
    for i, m in enumerate(counts_to_masks({"skull": 3, "torso": 1, "arm": 0, "leg": 4})):
        hud.alpha_composite(cells[m], (4 + i * 34, 4))
    hud.save(build / "hud_example.png")
    hud.resize((352 * 4, 40 * 4), Image.NEAREST).save(build / "hud_example_x4.png")
    print("ok")
