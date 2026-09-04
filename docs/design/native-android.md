# Native Android client

## Product requirement

Android phones are the production target. React Native uses native views; no WebView, HTML, browser routing, or browser storage is used in `mobile/`. Old browser previews remain reference-only. This client does not yet port every old preview feature.

## Supplied design guidance

Imported UI source pack: `assets/pixel/ui/imported-2026-09-02/Monstermarket_UI_Graphics_For_Codex/`.
Read `README_FOR_CODEX.md`, `CODEX_IMPLEMENTATION_NOTES.md`, and `05_ASSET_INDEX_AND_DOCUMENTATION/PIXEL_MOBILE_UI_STANDARD.md` before visual changes. The supplied ZIP contains seven source atlas images and three Markdown files, not the ready-sliced folders described by the README. Do not claim those missing assets were used.

Native screens follow dark pixel-fantasy panels, restrained gold/brass borders, square geometry, stacked cards, and four thumb-accessible navigation tabs. Bottom navigation uses clipped icon windows from the supplied core HUD atlas. Labels and values are native text, never baked into screenshots. Compact monster portraits now use existing transparent 256px sprites displayed at 128dp for higher-density phones. Starter selection and market previews use full card art. No asset is repainted. Unavailable monster portraits have explicit placeholders.

The newly supplied battle ZIP failed archive validation (missing central-directory record). The previously imported and tested 90-species/four-pose pack remains the source of portraits; its integration notes were read. Do not overwrite that pack with the unreadable ZIP.

The subsequently provided extracted Downloads folder was also inspected: it contains the same seven atlases and three guidance files, with no ready-sliced folders. The full battle contact sheet is a visual reference, not a runtime sprite atlas.

The subsequently supplied extracted battle folder is an expanded **176-species** pack, imported separately under `assets/pixel/battle/monster-exchange-battle-sprites-v1-176/`. Native portrait imports now use all 176 identities. Sandscuttle and Shardscorp resolve to Duneclasp and Cragsting after the user's conditional approval and direct visual comparison with cards 129/130: sandy armour/purple venom and dark stone armour/crystal stinger, respectively. Their Poison → Poison/Rock types and two-stage evolution also match. All source poses are retained, but native battles themselves are still unimplemented. The original 90-species pack and historical browser battle are unchanged.

## Implemented native slice

- Four-screen story introduction, manager name, confirmed permanent starter choice; initial roster and Crowns use existing rules.
- Explore / Exchange / My Team bottom navigation, screen history, Android Back handling, safe-area insets, scrollable text, 48dp minimum controls and confirmation dialogs.
- World, region and city map browsing uses canonical map definitions and local bundled artwork; browsing never teleports the player. Destination/service lists expose navigation at phone-friendly sizes.
- Authored route travel shows fare, mode and duration. Confirmation applies the production travel/world-tick rules and enters the destination's major city. Locks and affordability are enforced.
- Exchange search, affordability filter, price/level/potential sorting, appraisal comparison, purchase review, discovery restrictions, personal listings and cancellation.
- Roster management, active team changes and three-day sale listings. A listing removes the monster from the usable roster until sale/cancellation/expiry. Crowns are credited only on sale. Rest advances the whole world rather than rerolling stock on every screen visit.
- One local campaign record joins all native screens. Device writes finish before state changes are published. Duplicate commands are blocked while saving; failed writes retain the previous playable state. Unreadable saves are preserved without silently starting over.

## Run and check

### Native Monsterdex / card rendering

The Dex tab offers a virtualized 244-card gallery, search, type/status filters, sorting, discovery totals, full-card viewing, previous/next navigation and evolution-family links. Card gallery mode exposes artwork only; it never grants discovery or ownership. My discoveries keeps unknown cards hidden and seen descriptions locked until caught.

The old raster exports were cut on an equal grid, which truncated some titles/borders. Native cards now use `mobile/cards.ts` and `native-card-frames.json`: row-specific black gutters identify complete frames from unchanged original sheets, and `CardArt` contains the entire frame in a consistent 4:5 slot. `source-sheets/` retains byte-for-byte copies of the input atlases. Native display does not rely on the malformed historical single-card exports. Printed artwork may use old spellings; canonical names remain native text with a note in the detail view.

Regenerate with `npm.cmd run build:native-cards` (uses the PNG reader already installed in `mobile/node_modules`). Sources are cached in the repository; a clean first import accepts the Monstercards directory as its script argument. This changes frame metadata only, never paints or rewrites images.

From the repository root:

```text
npm install --prefix mobile
node --experimental-strip-types scripts/build-native-assets.ts
npm run typecheck --prefix mobile
npm test
npm run check
npm run bundle:android --prefix mobile
npm run android --prefix mobile
```

The last command needs a configured Android SDK, Java development kit, and emulator/device. The Android bundle check is not an APK build or a device test. Browser screenshots must not substitute for Android acceptance testing.

Dependencies are isolated in `mobile/` and locked by its package lock. Expo SDK 55 is a deliberate supported baseline; versions are aligned with its installed `bundledNativeModules.json`. Reference: [Expo native storage](https://docs.expo.dev/versions/v55.0.0/sdk/async-storage/), [safe-area support](https://docs.expo.dev/versions/v55.0.0/sdk/safe-area-context/), [Android Back handling](https://reactnative.dev/docs/0.83/backhandler).

## Remaining work / limits

- Real Android emulator/device visual and interaction QA, release signing, APK/AAB packaging, performance profiling and TalkBack tests are still required.
- Native battles, expedition screens, breeding, most city facilities and live auctions are not implemented here; unavailable facilities say so. The Exchange is an offline NPC simulation, not a network marketplace.
- Early native saves use deterministic action replay (1,000-command cap) and a content/rules fingerprint. Incompatible versions stop with a recovery message; migration/export and checkpoint compaction are still needed before release. Clearing app data removes the local save.
- Native saves do not import terminal or browser prototype saves. Story progress before confirming the first partner is not yet persisted on Android.
- Native atlas now has 48dp selectable numbered pins, matching destination chips, horizontal/vertical scrolling and 1×/2× zoom controls. World pins use presentation-only coordinates for the replacement network artwork, with the baked desktop sidebar/HUD clipped out. Region/city pins still use authored hotspot centres; larger interactive border outlines and device geometry QA remain future work.
- Tab switching preserves the map stack and navigating back to an existing map removes duplicate history. Travel still uses shared authored routes, confirmation, costs, story locks and save-before-publish semantics. Browsing does not move the player. City Exchange and inn actions are connected; other unavailable facilities are explicitly labelled.
- Market dashboard includes actual active NPC offer counts, species floor-asking-price tickers, wallet balance and a six-species comparison chart. These are offline asking quotes, not executed sales, live prices or historical trends. No fabricated percentage movements are shown. Existing card listings and transaction confirmations remain in place.
- Starter selection is a native horizontally paged card carousel. The selected card receives a clear state and the final choice remains save-before-publish.
- The opening story now presents three ordered steps: meet Tessa, learn the capture cycle, and complete a guaranteed Mossveil capture that consumes one Field Capsule. Completing it unlocks the Exchange and replaces protected preview stock with five non-starter offers. Starter trading stays rule-blocked until the Stonehollow chapter; the UI also hides those protected offers.
- Home Base has a generated portrait pixel-art overview at `assets/pixel/homebase/homebase-overview-v1.png`, native resource/slot displays, and build/upgrade cards for all five shared facility definitions. Costs, slot limits, construction days, maximum levels and completion on world ticks are enforced by the shared homebase rules. The image contains no baked labels or controls.
- The estate now opens on the unchanged centre with swipe/West/Home/East navigation across three potential parcels on each side. Each purchased parcel adds three habitat plots independently of central facility slots. All 18 types have level 1–3 artwork in a new 54-cell atlas and persistent validated construction/upgrade state in world.dynamicState. Breeding assignment is explicitly not connected yet. Land costs 300/600/900 Crowns per side; habitat costs and days scale with target level. Tests cover land independence, replay, capacity, upgrade timing, duplicate builds, and invalid types (150 total passing tests).
- Home is now the native launch screen and navigation root. The unchanged central base art has 48dp+ native building entry points for Keeper Hall/story, Monster Yard/team, Exchange/market, Archive/dex, Expedition Post, Workshop & Clinic/services, and Travel Gate/world. These are service entrances, not claims that corresponding upgradeable facilities have been constructed. Browsing Home does not teleport the player's regional location. A compact Home/Field journey/Story bar replaces the six-destination menu; Android Back returns through Home.
- Expedition Post exposes the existing shared route simulation with tutorial, region and zone guards, cautious/balanced/bold approaches, condition costs, unbanked rewards, retreat and completion. This is not a new animated battle implementation. Commands replay deterministically and rest is blocked during active expeditions. Two additional tests cover native expedition progression/replay and gating (152 total).
- Card printed names now lead native species presentation and search (74 differences), via displayContent; stable species IDs, canonical simulation content and its fingerprint are unchanged. Self-name mentions in descriptions follow the card label too.
- Resource visual pass: pack/base inventories, deposit rows, crafting inputs/outputs, construction costs, habitat build costs, capsules, quest rewards and expedition loot use a new pixel item atlas. Five facility icons reuse the supplied homebase atlas. Expedition region artwork, active-team portraits and route progress add context without changing simulation. All starting supplies, equipment and recipe materials have mapped icons (156 tests). Device visual/touch QA remains outstanding; material counts are real state, not decorative text.
- Equipment is now manageable from Monster Yard: two visible slots, an expandable six-item catalog, item icons, numerical effects, pack counts and equip/remove confirmations. The native command delegates to shared equipment rules and additionally requires roster membership. Equipped gear leaves the pack; removal returns it. Expedition lock, missing stock, duplicate items, slot limits, replay and failed device writes have native regression tests (159 tests total).
- Encounter nodes support one wild search per node, persisted sightings and pending encounter state, controlled weakening costing 5 stamina per partner, probabilistic capsule throws using shared capture/equipment rules, retries and release. Pending captures block route advancement. This is a field manoeuvre UI, not full animated combat. Chapter 2 rewards an independent wild capture plus expedition completion with 150 Crowns and 3 capsules, once. The tutorial capture uses a distinct individual ID to prevent overwriting the starter. Automated coverage totals 154 tests; physical phone validation remains outstanding.
- Refinement pass: base artwork is contained rather than cropped; construction buttons account for affordability. Pack-to-store deposits, shared workshop crafting, one-herb care, day advancement, and paid permanent plot expansion (200 then 400 Crowns, capped at five) are available natively. A one-time foundation reward requires the capture lesson and an active facility, awarding 40 timber, 20 stone and 15 herbs to base stores. Two fixed navigation rows keep every destination visible with 48dp minimum targets.
- Replay compatibility now grandfathers only trading that precedes the capture tutorial, avoiding unintended starter permissions on reload of a new campaign. Malformed story steps are rejected explicitly. Native construction uses the shared expedition guards. Regression coverage totals 147 passing tests; device touch/layout verification remains separate and outstanding.

## Verification performed

- Native TypeScript check passes.
- Android Hermes bundle export succeeds; local map art, HUD atlas and all 176 mapped idle portraits resolve.
- 139 shared-system tests pass, including native campaign/transaction/save behavior, expanded sprite mappings, all 244 card identities, containment at phone sizes, non-overlapping source frames and discovery preservation.
- Content validation passes for 734 definitions.
- No Android SDK/emulator was found during this run; native visual/device validation and an APK build have not been performed.
