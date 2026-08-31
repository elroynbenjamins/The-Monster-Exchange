# Pixel-art asset contract

Monster artwork has been intentionally removed while the replacement set is produced. Missing monster art should render a development checkerboard. Existing map assets remain temporary until the new world, region, and city map set arrives.

Use lowercase kebab-case and this structure:

```text
assets/pixel/monsters/<species-id>/<species-id>--<variant>--<pose>--<direction>.png
assets/pixel/icons/types/type--<type-id>--16.png
assets/pixel/icons/traits/trait--<trait-id>--16.png
assets/pixel/regions/<region-id>/<region-id>--<scene>--<size>.png
assets/pixel/maps/continents/continent--<continent-id>--world-map.png
assets/pixel/maps/regions/region--<region-id>--map.png
assets/pixel/maps/cities/city--<city-id>--map.png
assets/pixel/monsters/concept-portraits/<species-id>--concept-portrait.png
assets/pixel/ui/ui--<component>--<state>.png
assets/pixel/monsterdex/atlases/monster-cards--<first-number>-<last-number>.png
assets/pixel/monsterdex/cards/<catalog-number>--<species-id>--card.png
assets/pixel/monsterdex/portraits/<catalog-number>--<species-id>--portrait.png
```

Examples:

- `mossveil--base--idle--right.png`
- `voltgrazer--albino--attack--left.png`
- `type--electric--16.png`
- `greenreach--meadow--320x180.png`
- `ui--app-icon--exchange-crest.png` (current primary application icon)
- `monster-cards--001-015.png` (Monsterdex card atlas; five columns by three rows)
- `001--mossveil--card.png` (clean catalog card cropped from its source atlas)
- `001--mossveil--portrait.png` (256×192 combat portrait crop; nearest-neighbor scaling)
- `continent--heartland--world-map.png`
- `region--stormpeak--map.png`

Rules: integer canvas sizes, nearest-neighbor scaling, transparent PNG for sprites/icons, no spaces, no version numbers in filenames, and no copyrighted lookalikes. Palette/source files may sit beside exports but runtime code references only final asset IDs.

UI colors must use the semantic variables in `styles/theme.css`; do not place light- or dark-specific colors directly in components. Pixel art should be checked against both palettes, while game information must never rely on color alone.
