# The Monster Exchange

Canonical application/package identifier: `com.elroybenjamins.themonsterexchange`. Android, iOS, and future distribution builds must keep this identifier unchanged; shared metadata lives in `app.config.json` and `src/config/app.ts`.

Google Play release documentation: [Privacy Policy](PRIVACY.md) · [Data safety and release checklist](docs/GOOGLE_PLAY_DATA_SAFETY.md). The current declaration assumes the shipped build remains offline and contains no analytics, ads, accounts, cloud services, payments, or third-party data-collection SDKs.

The Monster Exchange is a pixel-art monster management game where collecting, breeding, exploration, combat, and a living marketplace feed one another. This repository is the simulation-first starter: the rules are usable without a UI, deterministic under a seed, and driven by content definitions rather than species-specific code.

## Start here

Requirements: Node.js 22.6 or newer. No package download is required for the current foundation.

```bash
npm test
npm run check
npm run audit:design
npm start
npm run play
npm run monsterdex
```

`npm start` runs a small reproducible world tick: it creates monsters, breeds an offspring, advances the market, starts an expedition, and resolves a combat action.

`npm run monsterdex` opens the local visual-client prototype at `http://127.0.0.1:4173`. It uses clean individual cards and 256×192 combat portraits generated losslessly from the supplied #1–90 card atlases. It supports responsive scrolling, search, type/rarity/record filters, light and dark themes, clickable details, previous/next navigation, persistent demo discovery states, and a compact combat preview. The shared `src/systems/monsterdex.ts` module derives real unknown/seen/caught records from save ownership and species research.

The reusable `scripts/build-monster-card-assets.py` pipeline rebuilds the individual cards, combat portraits, and manifest from the six source sheets. It detects the real card borders independently for each differently sized sheet, uses nearest-neighbor portrait scaling, and never repaints the supplied artwork.

`npm run play` starts the terminal-based development client. It creates an autosave under `.local/`, lets you choose a partner, run or resume multi-node Greenreach expeditions, choose cautious, balanced, or bold field approaches, manage health and stamina, capture wild individuals, defeat protected alpha bosses for authored bounties, secure or risk route rewards, list monsters for sale, and advance the living market by resting. The terminal is a temporary development client, not the intended final interface.

The client also exposes the first homebase management loop: construct and upgrade facilities, deposit gathered resources, start breeding jobs, end days to advance construction and recovery, and claim offspring when their Nest timer completes. An Expedition Lodge increases route stamina and improves reward recovery during retreats. Fixed, data-driven equipment can be assigned to two monster slots and affects combat, expedition endurance, or capture work. Species research earned from battles and captures gradually narrows potential estimates and eventually reveals traits and exact potential. A Research Lab boosts those gains and converts expedition notes into focused species studies. Zone hazards are authored data, and suitable team types or tags provide visible preparation bonuses that reduce field risk.

Appearance settings persist a Light, Dark, or Follow Device preference plus reduced-motion accessibility. The future visual client should consume the shared palettes in `src/ui/theme.ts` and the matching semantic CSS variables in `assets/styles/theme.css`, rather than hard-coded component colors.

The Contract Board offers authored, time-limited objectives for captures, expedition completions, alpha victories, and completed marketplace sales. Up to three may be active at once; matching play advances them and completed work pays explicit Crown, item, and reputation rewards. Contracts can be abandoned, and claimed or expired work returns to the board for repeat play.

The terminal client now exposes the core management tools needed for regular play: detailed individual records, nicknames, active-team and skill editing, evolution, marketplace browsing and purchasing, inventory review, herb-based field care, and data-driven Workshop crafting.

Marketplace discovery supports species, affordability, and maximum-price filters; price, potential, and level sorting; and appraisal comparisons before purchase. Expedition briefings show authored zone descriptions, current weather, hazards, team-level readiness, and protection. Wild-species weights respond to population, season, and weather, making the ecology affect actual encounters.

The Trainer Network introduces persistent named characters. Rival Rowan Vale and research friend Tessa Reed own actual monster rosters, train them on world ticks, remember challenge records, build relationships through repeat battles, and award authored victory purses.

The current playable runtime contains the initial 100-species Word catalog plus the two Exchange Crest guardians. The newer master design database v18 is now the authoritative migration source: its repository snapshot contains 146 workbook species, exact combat data, 54 evolution paths, 48 zones, 288 encounter rows, and detailed skill, passive, trait, breeding, progression, and market systems. The migration is intentionally staged so working saves and mechanics remain valid; see [the migration plan](docs/DESIGN_DATABASE_MIGRATION.md).

The Exchange Crest is the selected application icon. Its paired guardians are also game species beyond the initial catalog: Legendary Grass/Fairy Aurevine protects balance and recovery, while Legendary Electric/Dragon Tempestyr represents momentum and decisive change. Both have signature crest skills and passives. They never appear in ordinary wild or NPC-market rolls, cannot breed or be sold, and may bond only once per save: Aurevine rewards broad research at 20 reputation; Tempestyr rewards an accomplished battle roster at 30 reputation.

World-map navigation is data-driven through normalized clickable areas. The Heartland continent opens its regions, while the late-game Frontier continent requires the `late-game-continent` unlock. Uploaded Stormpeak, Crystal Depths, and Rift maps zoom from their continent and expose clickable major-city areas for Thunderwatch, Luminspire, and Nullspire. Missing region and city maps return an explicit awaiting-upload state until their art arrives.

Regional travel now uses authored bidirectional road, rail, ferry, and airship routes that consume Crowns and world days. City maps expose normalized hotspots for markets, arenas, monster storage, clinics, workshops, breeding, expedition guilds, government landmarks, and transport hubs. Six city maps and eleven regional maps are currently ready; missing art remains an explicit awaiting-upload destination.

Player location now persists in save version 8. The terminal client's World Map lets keepers leave or enter a region's major city, use its market, arena, storage, clinic, workshop, expedition, and transport services, and travel along authored routes. Journey time executes the complete living-world tick, so weather, markets, recovery, construction, breeding, contracts, and trainer progression continue while travelling. Version 7 saves migrate safely to Hearthbrook.

All twelve mapped regions now have playable expedition ecology. Thirteen zones span Greenreach's two-step opening route through Frostmarch, Stonehollow, Aurelia, Iron Dominion, Mistwater Coast, Mirefen, and the four late-game Frontier regions. Each has an authored level band, encounter distribution, environmental hazard, preparation counters, alpha boss, and rewards. Reaching a region unlocks its entry zone; expedition selection remains local to the player's current region. Content validation rejects empty encounter pools.

Recent usability rules are centralized rather than embedded in menus: nicknames normalize safely and stay unique, field care avoids wasting herbs, crafting reports exact available quantities, market searches support quality thresholds and value labels, contracts expose percentage progress, and trainer profiles show relationship tiers plus estimated challenge difficulty.

## Architecture

```text
src/
  content/       editable game definitions (species, traits, regions, buildings)
  core/          shared domain types, IDs, seeded randomness
  systems/       pure simulation modules
  ui/            shared visual preferences and semantic theme palettes
  demo.ts        runnable vertical-slice example
tests/           behavior tests across system boundaries
scripts/         content validation
docs/            design bible and contributor conventions
assets/          placeholder pixel-art tree and naming guide
prototype/       interactive visual-client experiments
```

Systems accept state and return new state or explicit events. They do not know about a rendering framework, persistence layer, or network transport. A future client can therefore use the same simulation in a desktop, web, or mobile shell. Save data should store content IDs and a `contentVersion`, never embedded copies of definitions.

## Design rules

- Individuals matter: genetics, traits, lineage, learned skills, records, and ownership persist.
- Potential summarizes genetics; it is not an extra combat multiplier.
- NPCs and rivals use the same monster, market, breeding, and battle rules as the player.
- Regions have authored identities and level ranges; the world does not magically match the player.
- Market listings represent individual monsters. Prices emerge from quality, scarcity, demand, age, fame, and current events.
- Content is original. Never make a species as “our version of” a recognizable copyrighted creature.
- Art is replaceable data referenced by stable, lowercase IDs. See [assets/README.md](assets/README.md).

## Roadmap

1. **Foundation (complete)** — definitions, deterministic generation, lineage-aware breeding, evolution eligibility, market ticks, buildings, expeditions, and timeline combat primitives.
2. **Playable loop (in progress)** — versioned/migrated autosaves, inventory/currency, selectable and unlockable expedition zones, health/stamina and field care, retreat/defeat, capture, full marketplace browsing/purchasing/player selling, NPC listings, time-limited contracts, detailed roster/team/skill/evolution commands, equipment loadouts, species research and focused Lab studies, timed breeding, data-driven Workshop crafting, functional homebase facilities, risk/reward expedition approaches, team-based hazard protection, and authored route bosses are connected. Next: repeatable contract generation, more regional content, and a visual client.
3. **Combat depth (in progress)** — deterministic speed-timeline battles now support the complete centralized 18-type chart, three active/two reserve teams, action-cost switching, Energy, cooldowns, data-defined stackable statuses, damage-over-time, control, healing, cleansing, shields, fixed equipment, species passives, capped team synergies, Wet/Electric and other status combinations, weighted AI, XP, reputation, fame, and persistent battle records. Next: manual reserve replacement, boss triggers, and battle rewards beyond XP.
4. **Living world (foundation in progress)** — one coordinated day tick now advances recovery, construction, breeding, contract expiry, listing expiry/sales, NPC listings, named trainer growth, regional weather, seasons, and species populations. Encounter frequency responds to population, season, and weather. The persistent rival/friend foundation and repeat challenges are playable. Next: trainer trading, tournaments, and market news.
5. **Content pipeline (in progress)** — the approved 100-species concept catalog is implemented and validated for numbering, rarity balance, type coverage, evolution progression, habitats, and asset IDs. Next: signature skills/passives for individual families, expanded regional habitats, JSON import/export, schema migrations, editor tooling, localization, deeper balance simulations, and pixel-art integration.
6. **Production client** — choose the rendering shell after the simulation loop is proven; add audio, accessibility, tutorials, telemetry, packaging, and save migration tests.

## Adding content

Add definitions in `src/content`, use globally unique kebab-case IDs, and run `npm run check`. Keep balance values in definitions or centralized formulas. Do not add `if (speciesId === ...)` branches to a system; model the behavior as data or a reusable effect.

The recovered high-level design is recorded in [docs/DESIGN_BIBLE.md](docs/DESIGN_BIBLE.md), and architectural decisions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
