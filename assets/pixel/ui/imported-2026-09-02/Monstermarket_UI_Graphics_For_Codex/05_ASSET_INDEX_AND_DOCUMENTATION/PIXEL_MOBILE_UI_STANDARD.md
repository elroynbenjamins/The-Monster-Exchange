# Monstermarket Pixel + Mobile UI Standard

This standard is mandatory for all current and future UI source packs.

## Style
- Pixel-art UI only.
- Crisp, deliberate pixel edges.
- Fantasy merchant / monster exchange identity.
- Dark readable backgrounds with controlled gold/brass accents.
- Type colors remain clear and consistent.

## Mobile-first requirements
- Portrait-phone layout is the default.
- Use compact cards and vertically stackable modules.
- Touch controls must be large enough to tap reliably.
- Critical text and icons must remain legible on small screens.
- Do not overcrowd screens with desktop-style information density.
- Prefer bottom navigation, tabs, drawers, collapsible sections, and scrollable lists.
- Charts and market widgets must have simplified mobile states.
- Modal windows should fit within phone-safe margins.
- Avoid embedding essential text into image assets when dynamic UI text is better.

## Asset production
- Keep transparent PNG output.
- Preserve pixel edges when scaling.
- Use native or clean integer-scale versions where possible.
- Panels should be reusable/sliceable.
- Icons should have compact variants.
- Include active, inactive, selected, disabled, alert, and pressed states when relevant.

## Codex usage
Codex should reject or treat as concept-only any asset that:
- breaks the pixel-art look,
- requires a desktop-sized canvas,
- has unreadably small text,
- has controls too small for touch,
- cannot reasonably scale to a phone UI.
