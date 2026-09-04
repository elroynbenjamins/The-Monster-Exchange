# Codex Implementation Notes

## Start here
Use `02_READY_TO_IMPLEMENT/refined_priority_splits/` first.
Each refined atlas folder includes:
- `native/` cleaner crops
- `x2_upscaled/` higher-quality versions

## If you need bulk coverage
Use `02_READY_TO_IMPLEMENT/extracted/`.

## If you need to re-slice from source
Use `02_READY_TO_IMPLEMENT/atlases/`.

## If you need visual direction
Use `01_DESIGN_CONCEPTS/`.

## Preferred grouped folders
Within each refined atlas folder, prefer the `grouped/` subfolders.
These provide a more useful functional organization and more semantic filenames than the raw numeric exports.

## Simplest import path
Use `04_BEST_ASSETS_ONLY/` first.
This is the most implementation-friendly view of the asset library and contains grouped x2-upscaled PNGs ready for direct import.


## Mandatory Visual & Mobile UI Rules

All Monstermarket UI graphics must follow these rules:

- Preserve the established **pixel-art style**. Do not switch to glossy vector, smooth 3D, realistic, or non-pixel UI.
- Design **mobile-first**, primarily for portrait phone layouts.
- Important information must remain readable at small screen sizes.
- Buttons and interactive controls must be touch-friendly and clearly separated.
- Avoid overly thin borders, tiny icons, excessive decorative clutter, or text baked into art when that hurts scaling/localization.
- Reusable icons should remain recognizable at compact sizes.
- Large panels should be sliceable/scalable where possible instead of being fixed-size screenshots.
- Maintain consistent visual language with the monster cards: dark panels, restrained fantasy trim, clear type colors, and crisp pixel edges.
- Prefer compact vertical layouts, bottom navigation, tabs, stacked cards, and short information rows suitable for one-handed/mobile use.
- Assets should support common mobile density scaling while keeping pixel edges intentional.
- Concept art that is not mobile-friendly should be treated as reference only, not implementation-ready UI.

### Codex priority
When implementing, Codex should prioritize:
1. Pixel consistency
2. Mobile readability
3. Touch target clarity
4. Reusability/scalability
5. Decorative detail

