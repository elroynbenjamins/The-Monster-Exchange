# The Monster Exchange

Canonical application/package identifier: `com.elroybenjamins.themonsterexchange`. Android, iOS, and future distribution builds must keep this identifier unchanged; shared metadata lives in `app.config.json` and `src/config/app.ts`.

The Monster Exchange is a pixel-art monster management game where collecting, breeding, exploration, combat, and a living marketplace feed one another. This repository is the simulation-first starter: the rules are usable without a UI, deterministic under a seed, and driven by content definitions rather than species-specific code.

## Start here

Requirements: Node.js 22.6 or newer. No package download is required for the current foundation.

```bash
npm test
npm run check
npm start
npm run play
```

`npm start` runs a small reproducible world tick: it creates monsters, breeds an offspring, advances the market, starts an expedition, and resolves a combat action.

`npm run play` starts the terminal-based development client. It creates an autosave under `.local/`, lets you choose a partner, run or resume multi-node Greenreach expeditions, choose cautious, balanced, or bold field approaches, manage health and stamina, capture wild individuals, defeat protected alpha bosses for authored bounties, secure or risk route rewards, list monsters for sale, and advance the living market by resting. The terminal is a temporary development client, not the intended final interface.

The client also exposes the first homebase management loop: construct and upgrade facilities, deposit gathered resources, start breeding jobs, end days to advance construction and recovery, and claim offspring when their Nest timer completes. An Expedition Lodge increases route stamina and improves reward recovery during retreats. Fixed, data-driven equipment can be assigned to two monster slots and affects combat, expedition endurance, or capture work. Species research earned from battles and captures gradually narrows potential estimates and eventually reveals traits and exact potential. A Research Lab boosts those gains and converts expedition notes into focused species studies. Zone hazards are authored data, and suitable team types or tags provide visible preparation bonuses that reduce field risk.

Appearance settings persist a Light, Dark, or Follow Device preference plus reduced-motion accessibility. The future visual client should consume the shared palettes in `src/ui/theme.ts` and the matching semantic CSS variables in `assets/styles/theme.css`, rather than hard-coded component colors.

The Contract Board offers authored, time-limited objectives for captures, expedition completions, alpha victories, and completed marketplace sales. Up to three may be active at once; matching play advances them and completed work pays explicit Crown, item, and reputation rewards.

The terminal client now exposes the core management tools needed for regular play: detailed individual records, nicknames, active-team and skill editing, evolution, marketplace browsing and purchasing, inventory review, herb-based field care, and data-driven Workshop crafting.

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
4. **Living world (foundation in progress)** — one coordinated day tick now advances recovery, construction, breeding, listing expiry/sales, NPC listings, regional weather, seasons, and species populations. Next: persistent NPC portfolios, rival/friend progression, tournaments, contracts, and market news.
5. **Content pipeline** — JSON import/export, schema versioning/migrations, editor tooling, localization, balance simulations, and pixel-art integration.
6. **Production client** — choose the rendering shell after the simulation loop is proven; add audio, accessibility, tutorials, telemetry, packaging, and save migration tests.

## Adding content

Add definitions in `src/content`, use globally unique kebab-case IDs, and run `npm run check`. Keep balance values in definitions or centralized formulas. Do not add `if (speciesId === ...)` branches to a system; model the behavior as data or a reusable effect.

The recovered high-level design is recorded in [docs/DESIGN_BIBLE.md](docs/DESIGN_BIBLE.md), and architectural decisions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
