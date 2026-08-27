# Pixel-art asset contract

Art is placeholder-only in this repository. References are stable strings and missing files should render a development checkerboard.

Use lowercase kebab-case and this structure:

```text
assets/pixel/monsters/<species-id>/<species-id>--<variant>--<pose>--<direction>.png
assets/pixel/icons/types/type--<type-id>--16.png
assets/pixel/icons/traits/trait--<trait-id>--16.png
assets/pixel/regions/<region-id>/<region-id>--<scene>--<size>.png
assets/pixel/ui/ui--<component>--<state>.png
```

Examples:

- `mossveil--base--idle--right.png`
- `voltgrazer--albino--attack--left.png`
- `type--electric--16.png`
- `greenreach--meadow--320x180.png`

Rules: integer canvas sizes, nearest-neighbor scaling, transparent PNG for sprites/icons, no spaces, no version numbers in filenames, and no copyrighted lookalikes. Palette/source files may sit beside exports but runtime code references only final asset IDs.

UI colors must use the semantic variables in `styles/theme.css`; do not place light- or dark-specific colors directly in components. Pixel art should be checked against both palettes, while game information must never rely on color alone.
