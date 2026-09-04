# Android-first training battle integration

> Historical browser prototype notes only. The production game is a native Android phone app, **not a WebView**. New native work lives in `mobile/`; see [native Android implementation](native-android.md). The browser features below are not automatically available in that client.

Run `npm run preview` to rebuild the pure combat modules and start the historical local preview. `npm run game` now starts the native Android development client. Open `/prototype/battle/` in the historical preview for training, or enter any city arena from its facility panel.

The preview root now opens `/prototype/welcome/`: a four-chapter, phone-first story introduction moving from Ardenfall through Greenreach to Willowmere. Back/Continue, Skip, replay from the world map, and a returning-player shortcut are available. Chapter progress uses its own local save slot; it never changes campaign or training saves. The last chapter opens the existing Willowmere city preview. Starter selection and a guided first battle are not yet connected to this introduction.

## Implemented

- The browser training screen runs the production combat engine locally: speed order, skills, energy, cooldowns, passives, shields, statuses, AI, and victory/defeat.
- One lock spans a player action, all enemy responses, and visual playback. Matchup changes and restart are disabled during that interval.
- Training automatically saves each committed move before animation and resumes on reopening the same preview origin. The bounded, versioned action replay restores both state and random sequence, including pending enemy turns and completed results.
- Matchup selections are staged until New battle is confirmed. Cancel keeps the existing match; incompatible or malformed saves remain untouched until replacement is confirmed. Unavailable device storage is reported without blocking play. Another tab changing the save locks this screen until reload.
- All 90 ZIP species map to v47 IDs. Pack names `bogcrumbler` and `knubback` resolve to canonical `bogrumbler` and `knobback`; source files are preserved.
- Every supplied pose exists at 128 and 256 pixels. The battle uses 256px images for high-density phone displays.
- Collapsible matchup selection, bottom action tray, touch controls, and reduced-motion support work at phone widths.
- City arenas open training, transit opens the world map, and research opens Monsterdex. Unimplemented facilities are explicitly marked unavailable when opened.
- Map images retain their coordinate-plane aspect ratio on phones, preventing cropped artwork from drifting away from markers. Directory lists remain an alternative to dense map hotspots.
- The preview server serves only assets and prototypes, handles directory index links, and rejects malformed or out-of-scope paths.

## Boundaries

This is a browser/WebView-oriented implementation, not a packaged Android APK. Android device/emulator validation, native Back behavior, packaging, and native lifecycle validation still need work. Saves are local to this browser/WebView and origin (including port), not cloud backups; clearing app/site data removes them. Content changes invalidate old training replays; bump the engine revision in the training adapter when combat rules change. Training intentionally does not modify campaign saves or award rewards. Sprite generation beyond the supplied ZIP remains incomplete; opaque generated drafts are not used in combat.

Build output in `prototype/battle/runtime` is generated from `src/game/training-battle.ts` and its dependencies. Do not hand-edit it; use `npm run build:battle` after engine changes.
