# Monstermarket UI Graphics for Codex

This package is split into clear groups so Codex can distinguish between concept/reference material and production-ready source art.

## 01_DESIGN_CONCEPTS
Visual direction only: style guides and reference screens.

## 02_READY_TO_IMPLEMENT
Main production asset source.

Contains:
- `atlases/` — higher-quality atlas sheets
- `extracted/` — bulk automatically split PNG assets
- `refined_priority_splits/` — cleaner crops for all major atlases, with both native and x2 upscaled exports
- `asset_manifest.json`
- `asset_manifest.csv`

## 03_TOOLS_AND_GUIDES
Support material such as crop-box overlay guides.

## Recommended workflow
1. Review `01_DESIGN_CONCEPTS/` for style direction.
2. Use `02_READY_TO_IMPLEMENT/refined_priority_splits/` first for the cleanest per-asset files.
3. Use `02_READY_TO_IMPLEMENT/atlases/` when re-slicing or building scalable UI components.
4. Use `02_READY_TO_IMPLEMENT/extracted/` for bulk extracted pieces if needed.

## Quality update
The refined sets now include `x2_upscaled/` exports to provide higher-quality source files where useful.

## Grouped semantic refined assets
The refined asset folders now also include a `grouped/` structure with assets split by likely function (for example buttons, icons, chips, panels, bars, widgets, cards, and type badges) and renamed with more semantic filenames.

For the cleanest implementation workflow, Codex should usually use:
1. `02_READY_TO_IMPLEMENT/refined_priority_splits/<group>/grouped/x2_upscaled/`
2. or `.../grouped/native/` if the native size is preferred.

## 04_BEST_ASSETS_ONLY
This top-level folder contains the **recommended assets Codex should use first**.
These are copied from the grouped `x2_upscaled` refined folders, so they are:
- cleaner cropped
- function-grouped
- more semantically named
- higher quality

If Codex wants the easiest implementation path, start with `04_BEST_ASSETS_ONLY/`.

## 05_ASSET_INDEX_AND_DOCUMENTATION
Implementation-facing documentation has been added here, including a naming index, UI component catalog, quick reference, searchable CSV lookup, and asset search keywords.

This folder contains documentation only. Production art remains in `04_BEST_ASSETS_ONLY/` and `02_READY_TO_IMPLEMENT/`.


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

