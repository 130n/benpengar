"""Pixelerar högupplösta renderingar till 8-bitars sprites.

Steg: snäpp varje pixel till paletten -> majoritetsröst per block
(mörka detaljer viktas upp så ögon/tänder överlever) -> 1px kontur -> städning.
"""
import sys
from collections import Counter
from pathlib import Path
from PIL import Image, ImageOps

PALETTE = {
    "outline": (0x2A, 0x1F, 0x33),
    "bone": (0xF3, 0xEA, 0xD2),
    "shade": (0xB8, 0xA9, 0x8A),
    "light": (0xFF, 0xFF, 0xFF),
    "stone": (0x8B, 0x90, 0xA0),
    "stoneShade": (0x5F, 0x63, 0x75),
    "stoneLight": (0xB9, 0xBF, 0xCC),
    "moss": (0x6F, 0x9A, 0x4C),
    "worm": (0xE5, 0x8B, 0xA0),
    "wormShade": (0xB7, 0x5A, 0x76),
    "wormLight": (0xF7, 0xC1, 0xCC),
    "dirt": (0x7A, 0x54, 0x40),
    "dirtShade": (0x52, 0x38, 0x29),
    "dirtLight": (0xA0, 0x74, 0x58),
    "cash": (0x5F, 0xAE, 0x4E),
    "cashShade": (0x3D, 0x7A, 0x36),
    "cashLight": (0xB4, 0xE3, 0x9A),
    "skin": (0xF4, 0xC7, 0xA1),
    "skinShade": (0xD4, 0x96, 0x72),
    "hair": (0xC4, 0x5E, 0x2C),
    "hairShade": (0x8A, 0x3B, 0x1E),
    "hairLight": (0xE8, 0x93, 0x5A),
    "shirt": (0x4F, 0x86, 0xC6),
    "shirtShade": (0x35, 0x5C, 0x93),
    "pants": (0x3E, 0x3A, 0x58),
    "shoe": (0x6B, 0x4A, 0x3A),
}
WEIGHT = {"outline": 1.3, "light": 1.3, "bone": 1.0, "shade": 1.0}
SIZE = 32


def nearest(rgb):
    return min(PALETTE, key=lambda k: sum((a - b) ** 2 for a, b in zip(PALETTE[k], rgb)))


BLOCK = 16  # renderingen görs i 16x, en art-pixel = 16x16 block


def pixelate(src: Path, outlined: bool = True) -> Image.Image:
    hi = src.convert("RGBA") if isinstance(src, Image.Image) else Image.open(src).convert("RGBA")
    w, h = hi.width // BLOCK, hi.height // BLOCK
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = hi.load()
    for by in range(h):
        for bx in range(w):
            votes, opaque = Counter(), 0
            for y in range(by * BLOCK, (by + 1) * BLOCK):
                for x in range(bx * BLOCK, (bx + 1) * BLOCK):
                    r, g, b, a = px[x, y]
                    if a > 128:
                        opaque += 1
                        votes[nearest((r, g, b))] += 1
            if opaque > BLOCK * BLOCK * 0.45:
                name = max(votes, key=lambda k: votes[k] * WEIGHT.get(k, 1.0))
                out.putpixel((bx, by), PALETTE[name] + (255,))
    return outline(out) if outlined else out


def outline(img: Image.Image) -> Image.Image:
    res = img.copy()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if img.getpixel((x, y))[3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and img.getpixel((nx, ny))[3]:
                    res.putpixel((x, y), PALETTE["outline"] + (255,))
                    break
    return res


DIRS = ["down", "up", "right", "left"]  # rad-ordning i spritesheeten


if __name__ == "__main__":
    build = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    rows = {d: [pixelate(p) for p in sorted(build.glob(f"walk_{d}_*_hi.png"))] for d in DIRS[:3]}
    rows["left"] = [ImageOps.mirror(f) for f in rows["right"]]
    n = len(rows["down"])
    sheet = Image.new("RGBA", (SIZE * n, SIZE * len(DIRS)))
    for r, d in enumerate(DIRS):
        for c, f in enumerate(rows[d]):
            sheet.paste(f, (c * SIZE, r * SIZE))
    sheet.save(build / "skeleton_walk.png")
    sheet.resize((sheet.width * 8, sheet.height * 8), Image.NEAREST).save(build / "skeleton_walk_x8.png")
    bg = (0x3B, 0x4A, 0x3A, 255)  # gräsgrön bakgrund för förhandsvisning
    gif = []
    for i in range(n):
        canvas = Image.new("RGBA", (SIZE * len(DIRS) + 4 * (len(DIRS) - 1), SIZE), bg)
        for c, d in enumerate(DIRS):
            canvas.alpha_composite(rows[d][i], (c * (SIZE + 4), 0))
        gif.append(canvas.resize((canvas.width * 6, canvas.height * 6), Image.NEAREST).convert("P"))
    gif[0].save(build / "skeleton_walk_x6.gif", save_all=True, append_images=gif[1:], duration=160, loop=0, disposal=2)

    # Föremål: en rad per grupp, mask i 4 riktningar (vänster = spegling)
    def group(name):
        return [pixelate(p) for p in sorted(build.glob(f"{name}_*_hi.png"))]

    def save_row(frames, name):
        row = Image.new("RGBA", (SIZE * len(frames), SIZE))
        for i, f in enumerate(frames):
            row.paste(f, (i * SIZE, 0))
        row.save(build / f"{name}.png")
        return row

    bones = group("bones")  # skalle, bröstkorg, arm, ben
    save_row(bones + [ImageOps.mirror(bones[2]), ImageOps.mirror(bones[3])], "bones")
    graves = group("graves")
    save_row(graves, "graves")
    worm = {d: group(f"worm_{d}") for d in ("down", "up", "right")}
    worm["left"] = [ImageOps.mirror(f) for f in worm["right"]]
    wsheet = Image.new("RGBA", (SIZE * 4, SIZE * 4))
    for r, d in enumerate(DIRS):
        for c, f in enumerate(worm[d]):
            wsheet.paste(f, (c * SIZE, r * SIZE))
    wsheet.save(build / "worm_crawl.png")
    wgif = []
    for i in range(4):
        canvas = Image.new("RGBA", (SIZE * 4 + 12, SIZE), bg)
        for c, d in enumerate(DIRS):
            canvas.alpha_composite(worm[d][i], (c * (SIZE + 4), 0))
        wgif.append(canvas.resize((canvas.width * 6, canvas.height * 6), Image.NEAREST).convert("P"))
    wgif[0].save(build / "worm_crawl_x6.gif", save_all=True, append_images=wgif[1:], duration=180, loop=0, disposal=2)
    print("ok", n)
