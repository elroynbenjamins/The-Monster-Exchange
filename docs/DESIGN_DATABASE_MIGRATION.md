# Design database v18 migration

`Monster_Exchange_Master_Design_Database_v18.xlsx` is the authoritative authored design source. The versioned JSON snapshot under `data/design-v18/` is the repository's reviewable migration input.

## Baseline audit

- Workbook species: 146
- Runtime species before migration: 102
- Stable IDs shared by both: 100
- Workbook species awaiting runtime migration: 46
- Runtime-only species: Aurevine and Tempestyr
- Workbook evolution paths: 54
- Workbook zones: 48
- Workbook zone encounter rows: 288

The two Exchange Crest guardians remain approved game content. They will follow the workbook roster as catalog numbers 147 and 148 instead of displacing workbook species 101 and 102. Their one-per-save bonding, no-breeding, no-wild-spawn, and no-market-sale rules remain intact.

## Migration order

1. **Source integrity — complete:** extract implementation sheets, validate IDs, coverage, and references.
2. **Species foundation:** migrate all 146 catalog identities, exact types, rarity, regions, ecology, and exact workbook combat stats. Move crest guardians to #147–148.
3. **Combat content:** migrate the 38-skill catalog, 146 passives, 541 learnset rows, and 876 weighted trait-pool rows.
4. **Evolution:** replace legacy generated paths with the 54 authored paths and 183 detailed requirement rows, including evolution-exclusive final forms.
5. **Exploration:** replace broad generated habitats with 48 authored zones and 288 weighted encounter rows.
6. **Economy:** migrate species market baselines, regional markets, individual valuation, materials, recipes, buyers, events, and sinks.
7. **Progression:** migrate trainer levels and skills, licences, research, tournaments, leagues, NPC archetypes, save schema, and RNG streams.
8. **Retire legacy generation:** remove fallback formulas only after every migrated subsystem has parity tests and old saves have explicit migrations.

Run these checks before each migration commit:

```bash
npm run audit:design
npm test
npm run check
```

Extracted JSON is generated data and must not be hand-edited. A newer approved workbook should produce a new versioned snapshot and migration audit.

