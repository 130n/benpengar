"""Testscen: Bomberman-rutnät med gravstenar, skelett, ben och maskar."""
import sys
from pathlib import Path
from PIL import Image

T = 32
W, H = 11, 9
build = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
GRASS, TUFT, TUFT2 = (0x3F, 0x5A, 0x3A), (0x35, 0x4D, 0x31), (0x4E, 0x6B, 0x45)


def cell(sheet, col, row=0):
    return Image.open(build / sheet).crop((col * T, row * T, col * T + T, row * T + T))


def grass_tile(seed):
    t = Image.new("RGBA", (T, T), GRASS + (255,))
    for i in range(6):
        x, y = (seed * 7 + i * 11) % 29, (seed * 13 + i * 5) % 29
        t.putpixel((x, y), TUFT + (255,)); t.putpixel((x + 1, y - 1 if y else y), TUFT + (255,))
        t.putpixel(((x + 9) % 30, (y + 4) % 30), TUFT2 + (255,))
    return t


def render(frame):
    img = Image.new("RGBA", (W * T, H * T))
    for y in range(H):
        for x in range(W):
            img.alpha_composite(grass_tile(x * 31 + y * 17), (x * T, y * T))
    for y in range(H):
        for x in range(W):
            if x in (0, W - 1) or y in (0, H - 1) or (x % 2 == 0 and y % 2 == 0):
                img.alpha_composite(cell("graves.png", (x + y) % 2), (x * T, y * T))
    put = lambda im, cx, cy: img.alpha_composite(im, (cx * T, cy * T))
    for i, (cx, cy) in enumerate([(3, 1), (7, 5), (1, 7), (9, 3), (5, 3), (3, 7)]):
        put(cell("bones.png", i), cx, cy)
    put(cell("skeleton_walk.png", frame, 0), 5, 1)
    put(cell("skeleton_walk.png", frame, 2), 1, 5)
    put(cell("skeleton_walk.png", frame, 1), 9, 6)
    put(cell("worm_crawl.png", frame, 3), 7, 1)
    put(cell("worm_crawl.png", frame, 0), 5, 6)
    put(cell("worm_crawl.png", frame, 2), 7, 7)
    return img


frames = [render(i).resize((W * T * 3, H * T * 3), Image.NEAREST) for i in range(4)]
frames[0].save(build / "scene_x3.png")
pal = [f.convert("P", palette=Image.ADAPTIVE) for f in frames]
pal[0].save(build / "scene_x3.gif", save_all=True, append_images=pal[1:], duration=170, loop=0)
print("ok")
