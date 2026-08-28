# Master design database v18 snapshot

These JSON files are a read-only implementation snapshot extracted from `Monster_Exchange_Master_Design_Database_v18.xlsx` on August 28, 2026. The workbook remains the authored design source; this directory provides deterministic, reviewable inputs for the game repository.

Run `npm run audit:design` to validate stable species identities, sheet coverage, evolution references, zone references, and the current migration gap.

Migration policy:

1. Never change catalog numbers or derive IDs differently after release.
2. Migrate coherent systems rather than mixing workbook and legacy values inside one calculation.
3. Preserve old save compatibility through explicit content/save migrations.
4. Keep special obtainability rules out of ordinary encounter and breeding pools.
5. Regenerate snapshots from a newer approved workbook version; do not hand-edit extracted JSON.

The original `.xlsx` is intentionally not committed here because it is a large authored artifact. The normalized snapshot is sufficient for runtime generation and code review.
