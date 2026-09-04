"""Split the supplied v47 card sheets and build normalized Monsterdex card assets."""
from __future__ import annotations

import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\elroy\Downloads\Monstercards\Monstercards")
CATALOG = ROOT / "data" / "design-v47" / "species-catalog.json"
OUTPUT = ROOT / "assets" / "pixel" / "monsterdex"
CARDS = OUTPUT / "cards"
ACCEPTED = OUTPUT / "source-accepted"
MANIFEST = OUTPUT / "manifest.json"
TS_INDEX = ROOT / "src" / "content" / "generated-card-assets.ts"
TARGET_SIZE = (384, 480)

def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

def compact(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())

def runs(values: list[int], threshold: int, minimum_length: int) -> list[tuple[int, int]]:
    found, start = [], None
    for index, value in enumerate([*values, 0]):
        if value >= threshold and start is None:
            start = index
        elif value < threshold and start is not None:
            if index - start >= minimum_length:
                found.append((start, index))
            start = None
    return found

def detect_card_boxes(sheet: Image.Image) -> list[tuple[int, int, int, int]]:
    x_edges = [round(index * sheet.width / 5) for index in range(6)]
    y_edges = [round(index * sheet.height / 3) for index in range(4)]
    return [(x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]) for row in range(3) for column in range(5)]

def standalone_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    pixels = image.convert("RGB").load()
    points = [(x, y) for y in range(image.height) for x in range(image.width) if max(pixels[x, y]) < 245]
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1

def normalize_card(card: Image.Image) -> Image.Image:
    card = card.convert("RGB")
    scale = min(TARGET_SIZE[0] / card.width, TARGET_SIZE[1] / card.height)
    size = max(1, round(card.width * scale)), max(1, round(card.height * scale))
    resized = card.resize(size, Image.Resampling.NEAREST)
    canvas = Image.new("RGB", TARGET_SIZE, "black")
    canvas.paste(resized, ((TARGET_SIZE[0] - size[0]) // 2, (TARGET_SIZE[1] - size[1]) // 2))
    return canvas

# Printed names in row-major order. This documents UUID source sheets and lets
# canonical v47 spelling resolve minor lettering differences on generated cards.
SHEET_NAMES = {
 "1170ea2e-eba3-41c2-9262-c9daaeed860d": ["Sensecrown","Clearcroak","Vitrawisp","Gleamgulper","Prismite","Astrolelly","Deepmaw","Aetherbale","Midnightaxe","Brinehorn","Aurorwhal","Kelpskein","Wrathfrond","Needlesnout","Riftrostrum"],
 "158e8bba-7930-4ceb-a930-a1d7513effa0": ["Tundrusk","Paleolith","Glacmast","Puffleice","Loomstride","Aurawool","Craghush","Rimeclam","Whetmoth","Voltgrazer","Tempestride","Skyrill","Galecrest","Cloudrum","Kitespine"],
 "4ffd29dd-ab35-4bc4-883d-4671b5baa90d": ["Gravell","Faultusk","Shardpang","Ferrapine","Knockback","Rampartail","Forgeclus","Rootsnuff","Timberbeak","Burrowarden","Dustsnout","Belloram","Echonaris","Tidepup","Reefhowl"],
 "5c832a6c-60fa-41df-8fee-ea72490e9861": ["Shardscorp","Sickletot","Quillrend","Crescentire","Spinewyr","Thorntrance","Glintail","Facetoad","Prismink","Veilscale","Chromaw","Hummcrest","Resonadon","Voltchorus","Starburrow"],
 "7134f0d8-15e9-4362-a97c-61eb23f25955": ["Umbrelloom","Abyssbell","Riftjaw","Eonbriar","Wrathjelly","Tapshade","Knucklemurum","Hexfinger","Riftwarden","Aurevine","Tempestyr"],
 "75abd1d9-2f97-4515-85cc-3aa68962cba8": ["Gloamkit","Nocturnyx","Mispling","Gloamfang","Mournglade","Mushhare","Pallop","Peepscale","Venomdrake","Duskfang","Umbrasp","Mothwing","Echonoct","Saltweb","Cryptarach"],
 "7e2d6a7a-4851-48a5-b9cc-f071d05a245a": ["Bramblemi","Voltimiri","Rimeri","Omeniri","Noctimeri","Alloymiri","Oraciri","Mossveil","Candypre","Pebblit","Cairnox","Dunelet","Mirrormaw","Dustlet","Siroccoil"],
 "8ecb125d-e071-4499-8f4f-be46e68c4a2e": ["Stormpard","Lumigill","Faelotl","Stridestamp","Quillmarshal","Serpentjudge","Velvetstripe","Glyphneck","Hearthmish","Resonuckle","Prismtail","Glimmerswilt","Razorcrest","Ferricram","Bastionsect"],
 "903d9efa-6729-49f1-81fd-edcca70fc551": ["Rookling","Drowseed","Somniloak","Mossfist","Grovegrip","Reedblade","Thornscythe","Ferramantis","Tumblet","Burrowbeak","Mirethew","Runebuck","Semiri","Cindermi","Brookmire"],
 "97093002-a800-467a-ac6f-72f8bef7c8e7": ["Spriggara","Fenbara","Crownbara","Cindlet","Kilnback","Pyroclastor","Rifflin","Brooktob","Brineveil","Joltmere","Voltbrace","Tempestark","Rimekit","Duskrime","Nocthyme"],
 "98534767-41ea-4333-ad3e-95c3877e3f3c": ["Oreling","Magnox","Clinkshade","Oathcoil","Coldforge","Epochshield","Frostuft","Hailhorn","Rimehorn","Chillip","Crystalid","Borealine","Fluffin","Reclarity","Hyperglace"],
 "ab5eaefa-58a5-4ac4-ab66-5062d3286bd8": ["Budmote","Crownbloom","Fuzzvolt","Loomspark","Bramblejaw","Thicketew","Knucklebug","Burlbrute","Quillhog","Scribetail","Frondle","Thornlion","Colobug","Dynamoira","Tusslegrub"],
 "bfde8f3b-f2a4-4f19-a0c9-527dbde203c7": ["Brinibble","Steamvat","Emberfin","Anemflare","Clawtide","Pugilcrab","Drizzlepod","Noktide","Prismjab","Caveclug","Spectracest","Omnimeshell","Voltspurr","Mucklet","Bogrumbler"],
 "ChatGPT Image 31 aug 2026, 14_40_35": ["Emberrook","Terradrake","Abysswyrm","Umbralisk","Scarabrex","Warmaw","Hearthscale","Moonjackal","Frostbasil","Petalnix","Starimp","Lullacorn","Wispmoth","Tidebelle","Gleamgoyle"],
 "e383cdfa-67cc-4b34-8925-16c11c8d37a4": ["Scentail","Nightvine","Mangroknot","Baritonose","Viletail","Siltwrath","Marshgrin","Mossborne","Cackleman","Whirlroo","Oracline","Burrowseer","Sunoracle","Stridepelt","Velocrest"],
 "f42f39e7-5edc-4bd2-9f4f-55edecec7141": ["Arcwren","Stormscribe","Skyvise","Aetheray","Sparkspine","Duneskip","Springarc","Ashwing","Solvulture","Sootskip","Cauterwing","Cinderskink","Ashmaul","Vulcaroo","Sandscuttle"],
}
STANDALONE_NAMES = {"93762852-e9ae-467c-a454-6a79e78e83b8":"Ironstork", "a8fefcd8-5de1-4a00-88cc-b8c39cbd85c7":"Veilpaca"}

catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
by_compact = {compact(row["Name"]): row for row in catalog}
ALIASES = {
 "astrolelly":"asterolith", "midnightaxe":"nightwake", "wrathfrond":"wraithfrond", "glacmast":"glacimast",
 "puffleice":"puffleece", "rimeclam":"rimeclaw", "whetmoth":"whitewroth", "gravell":"gravvel",
 "knockback":"knobback", "forgeclus":"forgeclub", "timberbeak":"termibreak", "belloram":"bellroam",
 "shardscorp":"cragsting", "sickletot":"sickletoe", "crescentire":"crescentyr", "spinewyr":"spinewry",
 "thorntrance":"thornmirage", "glintail":"glintad", "chromaw":"chromavex", "wrathjelly":"wraithjelly",
 "knucklemurum":"knucklemurmur", "mispling":"wispling", "gloamfang":"gloamfawn", "mushhare":"hushhare",
 "peepscale":"pipscale", "venomdrake":"venodrake", "umbrasp":"umbraasp", "mothwing":"murmurwing",
 "saltweb":"siltweb", "rimeri":"rimeiri", "noctimeri":"noctimiri", "candypre":"canopyre",
 "hearthmish":"hearthwish", "glimmerswilt":"glimmerguilt", "ferricram":"ferricrawl", "rookling":"rooklimb",
 "somniloak":"somnaloak", "mirethew":"mirthmew", "semiri":"simiri", "cindermi":"cinderimi",
 "brookmire":"brookimi", "spriggara":"sprigbara", "brooktob":"brookotl", "joltmere":"joltmeer",
 "rimekit":"rimeket", "nocthyme":"nocthyrme", "crystalid":"crysalid", "borealine":"borealume",
 "fluffin":"floelet", "reclarity":"regaldrift", "hyperglace":"imperglace", "thicketew":"thicketyr",
 "knucklebug":"knucklebud", "quillhog":"quillop", "thornlion":"thornloom", "colobug":"coilbud",
 "noktide":"noxitide", "caveclug":"caviclub", "spectracest":"spectrafist", "omnimeshell":"chimeshell",
 "voltspurr":"voltspur", "scentail":"scenttail", "mangroknot":"mangroknob", "viletail":"vialtail",
 "siltwrath":"siltwraith", "marshgrin":"marshgrim", "mossborne":"mossdrowse", "cackleman":"cacklemaw",
 "whirlroo":"whirloo", "skyvise":"skydisc", "sootskip":"sootsnip", "vulcaroo":"vulcarodo",
 "sandscuttle":"duneclasp",
 "ironstork":"steelstork",
}

def resolve(printed_name: str) -> dict[str, object]:
    key = compact(printed_name)
    key = ALIASES.get(key, key)
    if key in by_compact:
        return by_compact[key]
    raise RuntimeError(f"No explicit v47 species match for {printed_name!r}")

CARDS.mkdir(parents=True, exist_ok=True)
for old in CARDS.glob("*.png"):
    old.unlink()
records, seen = [], set()
for source_path in sorted(SOURCE.glob("*.png")):
    image = Image.open(source_path).convert("RGB")
    if source_path.stem in STANDALONE_NAMES:
        names, boxes = [STANDALONE_NAMES[source_path.stem]], [standalone_bounds(image)]
    else:
        names, boxes = SHEET_NAMES[source_path.stem], detect_card_boxes(image)
        if source_path.stem == "7134f0d8-15e9-4362-a97c-61eb23f25955":
            boxes = boxes[:11]
    if len(boxes) != len(names):
        raise RuntimeError(f"{source_path.name}: detected {len(boxes)} cards, expected {len(names)}")
    for cell, (printed_name, bounds) in enumerate(zip(names, boxes)):
        row = resolve(printed_name)
        species_name, number = str(row["Name"]), int(row["ID"])
        species_id = slug(species_name)
        if species_id in seen:
            raise RuntimeError(f"Duplicate card for {species_name}")
        seen.add(species_id)
        filename = f"{number:03d}--{species_id}--card.png"
        normalize_card(image.crop(bounds)).save(CARDS / filename, optimize=True)
        records.append({"internalId":number,"speciesId":species_id,"speciesName":species_name,"printedName":printed_name,"card":f"monsterdex/cards/{filename}","sourceSheet":source_path.name,"sourceCell":cell,"sourceBounds":list(bounds),"cardSize":list(TARGET_SIZE)})

for source_path in sorted(ACCEPTED.glob("*--accepted-concept.png")):
    match = re.match(r"(\d{3})--([a-z0-9-]+)--accepted-concept\.png$", source_path.name)
    if not match:
        raise RuntimeError(f"Malformed accepted concept filename: {source_path.name}")
    number, species_id = int(match.group(1)), match.group(2)
    row = next((candidate for candidate in catalog if int(candidate["ID"]) == number and slug(candidate["Name"]) == species_id), None)
    if row is None:
        raise RuntimeError(f"Accepted concept does not match v47: {source_path.name}")
    if species_id in seen:
        raise RuntimeError(f"Duplicate accepted card for {row['Name']}")
    seen.add(species_id)
    filename = f"{number:03d}--{species_id}--card.png"
    image = Image.open(source_path).convert("RGB")
    normalize_card(image).save(CARDS / filename, optimize=True)
    records.append({"internalId":number,"speciesId":species_id,"speciesName":row["Name"],"printedName":row["Name"],"card":f"monsterdex/cards/{filename}","sourceSheet":f"source-accepted/{source_path.name}","sourceCell":0,"sourceBounds":[0,0,image.width,image.height],"cardSize":list(TARGET_SIZE),"acceptedConcept":True})

records.sort(key=lambda entry: entry["internalId"])
missing = [{"internalId":int(row["ID"]),"speciesId":slug(row["Name"]),"speciesName":row["Name"]} for row in catalog if slug(row["Name"]) not in seen]
MANIFEST.write_text(json.dumps({"version":47,"artworkModified":False,"normalization":{"method":"aspect-preserving nearest-neighbor fit on black canvas","cardSize":list(TARGET_SIZE)},"entries":records,"missing":missing}, indent=2)+"\n", encoding="utf-8")
asset_index = {entry["speciesId"]: {"internalId": entry["internalId"], "cardAssetId": entry["card"]} for entry in records}
TS_INDEX.write_text("// Generated by scripts/build-monster-card-assets.py. Do not edit by hand.\nexport const GENERATED_CARD_ASSETS = " + json.dumps(asset_index, indent=2) + " as const;\n", encoding="utf-8")
print(f"Exported {len(records)} normalized cards; {len(missing)} v47 species have no supplied card.")
print("Missing:", ", ".join(entry["speciesName"] for entry in missing))
