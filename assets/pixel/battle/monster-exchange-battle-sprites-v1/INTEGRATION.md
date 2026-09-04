# Battle Sprite Integration

## File selection

- Use `sprites/128/` during normal battles.
- Use `sprites/256/` for inspection screens, bosses, or high-density displays.
- Use `sprites.json` as the canonical mapping between monster IDs and files.

## Rendering

- Keep nearest-neighbor filtering enabled.
- Each file uses a consistent square canvas and bottom-centered subject.
- Use a bottom-center pivot near `(0.5, 0.88)` and adjust only when a scene requires it.
- Source sprites face left. Apply horizontal mirroring for monsters placed on the left/player side.

## Recommended animation

- Idle: show `idle.png` with a subtle 1–2 px vertical bob and breathing scale.
- Attack: switch to `attack.png`, move 8–16 px toward the target, then return.
- Hit: show `hit.png` for 120–180 ms with a brief light/red tint and small shake.
- Defeated: cross-fade or drop into `defeated.png` over 250–400 ms.
- Keep elemental attacks, impact particles, status effects, and screen shake separate from the monster sprite.

This four-pose system avoids producing costly frame-by-frame animation for every species while still giving battles clear motion and feedback.

