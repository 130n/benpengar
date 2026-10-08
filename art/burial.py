"""Begravningsanimation: skelettet sjunker i en jordhög, en benhand sticker upp och
viftar med en grön sedel tills spelaren hämtar den (frames 10-13 loopas)."""
import sys
from pathlib import Path
from PIL import Image
from pixelate import pixelate, SIZE

GROUND = 27  # allt under denna rad är "i jorden"


def shifted(img, dy):
    out = Image.new("RGBA", (SIZE, SIZE))
    out.alpha_composite(img, (0, dy))
    for y in range(GROUND, SIZE):
        for x in range(SIZE):
            out.putpixel((x, y), (0, 0, 0, 0))
    return out


if __name__ == "__main__":
    build = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    skel = Image.open(build / "skeleton_walk.png").crop((0, 0, SIZE, SIZE))
    mound = pixelate(build / "burial_mound_0_hi.png")
    hands = [pixelate(p) for p in sorted(build.glob("burial_hand_*_hi.png"))]

    # 0-6: sjunker, 7-9: handen stiger, 10-13: viftar med sedeln (loopas tills spelaren tar den)
    frames = []  # (bild, ms)
    for dy, ms in [(0, 120), (2, 80), (5, 80), (9, 80), (14, 80), (20, 80), (27, 120)]:
        f = shifted(skel, dy)
        if dy:
            f.alpha_composite(mound)
        frames.append((f, ms))
    for rise, wave, ms in [(18, 1, 80), (10, 1, 80), (4, 1, 80), (2, 0, 160), (2, 1, 160), (2, 2, 160), (2, 1, 160)]:
        f = shifted(hands[wave], rise)
        f.alpha_composite(mound)
        frames.append((f, ms))

    sheet = Image.new("RGBA", (SIZE * len(frames), SIZE))
    for i, (f, _) in enumerate(frames):
        sheet.paste(f, (i * SIZE, 0))
    sheet.save(build / "burial.png")
    (build / "burial_timing.txt").write_text(",".join(str(ms) for _, ms in frames) + "\n")

    bg = (0x3F, 0x5A, 0x3A, 255)
    gif = []
    for f, _ in frames:
        c = Image.new("RGBA", (SIZE, SIZE), bg)
        c.alpha_composite(f)
        gif.append(c.resize((SIZE * 8, SIZE * 8), Image.NEAREST).convert("P", palette=Image.ADAPTIVE))
    gif[0].save(build / "burial_x8.gif", save_all=True, append_images=gif[1:],
                duration=[ms for _, ms in frames], loop=0, disposal=2)
    print("ok", len(frames))
