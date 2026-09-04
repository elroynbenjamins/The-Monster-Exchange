# Native wild encounter slice

Expedition encounter nodes now offer Fight to enter a one-on-one production-engine battle. Your first healthy expedition partner appears bottom-left, mirrored toward the wild monster at top-right. Native controls expose legal basic attacks, skills, recovery and explicit opponent turns. Actual HP, Energy and statuses are displayed; damage persists in campaign conditions. Capsules remain available during ongoing encounters; defeated monsters cannot be captured. Leave clears the encounter. No XP or duplicate battle reward is added in this slice; route rewards remain unchanged.

The updated supplied pack contains 244 species with four poses each, not frame sequences. All 976 pose paths resolve. Ironstork maps to steelstork, matching the accepted printed card name. New assets live separately under encounter-244; older packs are preserved. Regenerate static imports with scripts/build-encounter-poses.ts.

Attack movement, hit reaction and defeated poses are presentation effects. Team switching, automatic opponent-turn presentation, battle logs, idle breathing, particles, capture animations, boss encounters and victory rewards remain follow-up work. This is not the finished combat feature.

Native commands preserve old capture replay behavior and persist new battle snapshots through the existing save-before-publish command record. Unit tests cover deterministic reload, combat completion, duplicate entry, shortcut rejection and capture-after-defeat rejection. Physical Android layout, animation and accessibility QA remains required.
