"""Kopierar färdiga spritesheets till spelet (assets/ i repots rot)."""
import shutil
import sys
from pathlib import Path

SHEETS = ["skeleton_walk.png", "player_walk.png", "player_pull.png", "bones.png", "graves.png",
          "worm_crawl.png", "counter_combos.png", "burial.png"]

build = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
dest = Path(__file__).resolve().parents[1] / "assets"
dest.mkdir(parents=True, exist_ok=True)
for name in SHEETS:
    shutil.copy(build / name, dest / name)
print("ok", dest)
