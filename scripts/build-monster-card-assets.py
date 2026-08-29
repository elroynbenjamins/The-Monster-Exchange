"""Split the supplied 5x3 card sheets into lossless cards and combat portraits."""
from __future__ import annotations

import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\elroy\Downloads\Card Generation monsters 1-90")
OUTPUT = ROOT / "assets" / "pixel" / "monsterdex"
CARDS = OUTPUT / "cards"
PORTRAITS = OUTPUT / "portraits"
MANIFEST = OUTPUT / "manifest.json"


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def runs(values: list[int], threshold: int, minimum_length: int) -> list[tuple[int, int]]:
    found: list[tuple[int, int]] = []
    start = None
    for index, value in enumerate([*values, 0]):
        if value >= threshold and start is None:
            start = index
        elif value < threshold and start is not None:
            if index - start >= minimum_length:
                found.append((start, index))
            start = None
    return found


def detect_card_boxes(sheet: Image.Image) -> list[tuple[int, int, int, int]]:
    pixels = sheet.convert("RGB").load()
    row_activity = [sum(1 for x in range(sheet.width) if sum(pixels[x, y]) > 35) for y in range(sheet.height)]
    row_edges = [round(index * sheet.height / 3) for index in range(4)]
    row_bands: list[tuple[int, int]] = []
    for row in range(3):
        start, end = row_edges[row], row_edges[row + 1]
        active = [index for index in range(start, end) if row_activity[index] >= 5]
        if not active:
            raise RuntimeError(f"No card artwork detected in row {row}")
        row_bands.append((active[0], active[-1] + 1))
    boxes: list[tuple[int, int, int, int]] = []
    for top, bottom in row_bands:
        sample_bottom = min(bottom, top + 60)
        column_activity = [sum(1 for y in range(top, sample_bottom) if sum(pixels[x, y]) > 35) for x in range(sheet.width)]
        column_bands = runs(column_activity, 3, 30)
        if len(column_bands) != 5:
            raise RuntimeError(f"Expected five cards in row {top}-{bottom}, detected {column_bands}")
        boxes.extend((left, top, right, bottom) for left, right in column_bands)
    if len(boxes) != 15:
        raise RuntimeError(f"Expected fifteen cards, detected {len(boxes)}")
    return boxes


def portrait_crop(card: Image.Image) -> Image.Image:
    # Illustration panels occupy the middle of every supplied card. Crop a 4:3
    # frame inside that panel, then use nearest-neighbour sizing to preserve pixels.
    top = round(card.height * 0.245)
    bottom = round(card.height * 0.825)
    available_height = max(1, bottom - top)
    desired_width = round(available_height * 4 / 3)
    desired_width = min(desired_width, round(card.width * 0.94))
    left = (card.width - desired_width) // 2
    crop = card.crop((left, top, left + desired_width, bottom))
    return crop.resize((256, 192), Image.Resampling.NEAREST)


catalog = json.loads((ROOT / "data" / "design-v18" / "species-catalog.json").read_text(encoding="utf-8"))
names = {int(row["ID"]): row["Name"] for row in catalog if int(row["ID"]) <= 90}
CARDS.mkdir(parents=True, exist_ok=True)
PORTRAITS.mkdir(parents=True, exist_ok=True)
records: list[dict[str, object]] = []

for first in range(1, 91, 15):
    sheet_path = SOURCE / f"Monsters_Card_{first}-{first + 14}_final.png"
    sheet = Image.open(sheet_path).convert("RGB")
    boxes = detect_card_boxes(sheet)
    for offset in range(15):
        number = first + offset
        column, row = offset % 5, offset // 5
        bounds = boxes[offset]
        card = sheet.crop(bounds)
        species_slug = slug(names[number])
        card_name = f"{number:03d}--{species_slug}--card.png"
        portrait_name = f"{number:03d}--{species_slug}--portrait.png"
        card.save(CARDS / card_name, optimize=True)
        portrait_crop(card).save(PORTRAITS / portrait_name, optimize=True)
        records.append({
            "catalogNumber": number,
            "speciesId": species_slug,
            "card": f"monsterdex/cards/{card_name}",
            "portrait": f"monsterdex/portraits/{portrait_name}",
            "sourceSheet": sheet_path.name,
            "sourceCell": {"column": column, "row": row},
            "sourceBounds": list(bounds),
            "cardSize": list(card.size),
            "portraitSize": [256, 192],
        })

MANIFEST.write_text(json.dumps({"version": 1, "artworkModified": False, "entries": records}, indent=2) + "\n", encoding="utf-8")
print(f"Exported {len(records)} cards and {len(records)} portraits to {OUTPUT}")
