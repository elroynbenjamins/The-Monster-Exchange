# Monster Exchange design v44 snapshot

These JSON files are generated from the Google workbook **Monster Exchange Master Design Database v44 - Dex Completion Kit Passive Starter Save Integration** (spreadsheet ID `1L85hQwlUniEKeQynIAhiS7CiTAi2BSrh_5i-qxxoI8A`).

The workbook is the design authority. `scripts/generate-v44-runtime.mjs` converts the species catalog, finalized Dex order, combat stats, market baselines, and supported evolution requirements into `src/content/generated-v44.ts`. Re-run the generator after replacing these snapshots with a newer authoritative export.

Raw rows intentionally preserve null cells and advanced evolution fields that the current runtime does not yet model. Do not infer or invent values for those cells.
