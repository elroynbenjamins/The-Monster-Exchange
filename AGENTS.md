# Product direction

- The production game targets Android phones with a native UI, not a website or WebView wrapper.
- `mobile/` is the React Native Android client. Reuse the pure TypeScript simulation in `src/`.
- `prototype/` contains historical browser design/test references only. Do not present browser work as implementation of the phone game.
- Use native controls, safe-area insets, Android Back behavior, readable text and at least 48dp touch targets. Preserve offline saves and validate economy actions in the shared rules.
- Follow the supplied pixel/mobile UI standard in `assets/pixel/ui/imported-2026-09-02/Monstermarket_UI_Graphics_For_Codex/05_ASSET_INDEX_AND_DOCUMENTATION/PIXEL_MOBILE_UI_STANDARD.md`. Reuse the supplied atlas artwork; dark panels, pixel edges, restrained brass trim, and real native text take priority over decoration.
- Report Android build/device verification separately from unit tests and JavaScript bundle checks. Never claim an APK/device test without actually performing it.
