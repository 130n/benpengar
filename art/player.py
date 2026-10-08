"""Spelarens spritesheets: gång (3 hårstadier x 4 riktningar x 4 frames) och dragning (32x48)."""
import sys
from pathlib import Path
from PIL import Image, ImageOps
from pixelate import pixelate, SIZE, DIRS

STATES = ["normal", "spiky", "bald"]

if __name__ == "__main__":
    build = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    # rad = stadium*4 + riktning (ner, upp, höger, vänster)
    sheet = Image.new("RGBA", (SIZE * 4, SIZE * 12))
    for s, st in enumerate(STATES):
        rows = {d: [pixelate(build / f"player_{st}_{d}_{i}_hi.png") for i in range(4)] for d in ("down", "up", "right")}
        rows["left"] = [ImageOps.mirror(f) for f in rows["right"]]
        for r, d in enumerate(DIRS):
            for c, f in enumerate(rows[d]):
                sheet.paste(f, (c * SIZE, (s * 4 + r) * SIZE))
    sheet.save(build / "player_walk.png")
    # dragning: rad 0 = normal->spiky, rad 1 = spiky->kal
    pull = Image.new("RGBA", (SIZE * 7, 48 * 2))
    for stage in (1, 2):
        for i in range(7):
            pull.paste(pixelate(build / f"pull{stage}_{i}_hi.png"), (i * SIZE, (stage - 1) * 48))
    pull.save(build / "player_pull.png")
    print("ok")
