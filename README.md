# Monstermarket

Monstermarket is a pixel-art monster management game where collecting, breeding, exploration, combat, and a living marketplace feed one another. This repository is the simulation-first starter: the rules are usable without a UI, deterministic under a seed, and driven by content definitions rather than species-specific code.

## Start here

Requirements: Node.js 22.6 or newer. No package download is required for the current foundation.

```bash
npm test
npm run check
npm start
```

`npm start` runs a small reproducible world tick: it creates monsters, breeds an offspring, advances the market, starts an expedition, and resolves a combat action.

## Architecture

```text
src/
  content/       editable game definitions (species, traits, regions, buildings)
  core/          shared domain types, IDs, seeded randomness
  systems/       pure simulation modules
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

1. **Foundation (current)** — definitions, deterministic generation, lineage-aware breeding, evolution eligibility, market ticks, buildings, expeditions, and timeline combat primitives.
2. **Playable loop** — persistent save format, inventory/currency, capture, expedition node resolution, healing/stamina, marketplace transactions, and a basic terminal or web UI.
3. **Combat depth** — status manager, skill resolver, switching, 3-active/2-reserve teams, weighted AI profiles, rewards, and battle records.
4. **Living world** — NPC portfolios, rival/friend progression, regional populations, seasons/weather, tournaments, contracts, and market news.
5. **Content pipeline** — JSON import/export, schema versioning/migrations, editor tooling, localization, balance simulations, and pixel-art integration.
6. **Production client** — choose the rendering shell after the simulation loop is proven; add audio, accessibility, tutorials, telemetry, packaging, and save migration tests.

## Adding content

Add definitions in `src/content`, use globally unique kebab-case IDs, and run `npm run check`. Keep balance values in definitions or centralized formulas. Do not add `if (speciesId === ...)` branches to a system; model the behavior as data or a reusable effect.

The recovered high-level design is recorded in [docs/DESIGN_BIBLE.md](docs/DESIGN_BIBLE.md), and architectural decisions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
