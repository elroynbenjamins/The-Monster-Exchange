# Architecture decisions

## Simulation boundary

The game engine is a TypeScript library with no UI dependencies. Every random decision receives a `RandomSource`; tests and saved runs can therefore reproduce outcomes. Systems return domain events suitable for animation, logs, analytics, and eventual multiplayer validation.

## Data versus state

Definitions are authored facts: a species' base stats, an evolution's requirements, or a building's costs. State is what changes during a save: an individual's XP, a listing's expiry, or an expedition's current node. State refers to definitions by ID.

## Module contracts

- `genetics`: creates genes and computes the displayed potential score.
- `monsters`: creates persistent individuals from species definitions.
- `breeding`: checks compatibility, records lineage, and combines parental genes.
- `evolution`: evaluates data-defined requirements; it does not silently mutate a monster.
- `market`: values individuals, expires listings, and updates supply/demand indices per tick.
- `homebase`: validates construction and advances production jobs.
- `exploration`: creates finite route runs from authored zones and tracks stamina/progress.
- `combat`: calculates final stats and damage; later layers will own timelines, statuses, targeting, and AI.

## Compatibility policy

IDs are public save-data contracts. Rename them only through a migration. New fields should have safe defaults. Content and save formats have independent versions.

## Near-term folder growth

When a system becomes large, promote its file to a folder with `index.ts`, `types.ts`, and focused resolvers. Do not introduce an event bus, dependency injection framework, database, or frontend state library until an actual caller requires it.
