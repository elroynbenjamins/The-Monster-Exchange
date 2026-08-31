import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

type Row = Readonly<Record<string, unknown>>;
const root = new URL("../data/design-v45/", import.meta.url);
const read = async (name: string): Promise<readonly Row[]> => JSON.parse(await readFile(new URL(name, root), "utf8"));

test("v45 has exactly 221 stable, unique species identities", async () => {
  const species = await read("species-catalog.json");
  assert.equal(species.length, 221);
  assert.deepEqual(species.map((row) => row.ID), Array.from({ length: 221 }, (_, index) => index + 1));
  assert.equal(new Set(species.map((row) => row.ID)).size, 221);
  assert.equal(new Set(species.map((row) => row.Name)).size, 221);
  assert.equal(species.find((row) => row.ID === 8)?.Name, "Rifflin");
  assert.deepEqual(species.slice(219).map((row) => row.Name), ["Hailhorn", "Gloamfawn"]);
});

test("v45 foreign keys resolve across evolutions, learnsets, passives, and trait pools", async () => {
  const [species, evolutions, skills, learnsets, passives, traits, pools] = await Promise.all([
    read("species-catalog.json"), read("evolution-paths.json"), read("skill-catalog.json"),
    read("species-skill-learnsets.json"), read("species-passives.json"), read("trait-catalog.json"), read("species-trait-pools.json"),
  ]);
  const speciesIds = new Set(species.map((row) => row.ID));
  const speciesNames = new Set(species.map((row) => row.Name));
  const skillIds = new Set(skills.map((row) => row["Skill ID"]));
  const traitIds = new Set(traits.map((row) => row["Trait ID"]));
  assert.ok(evolutions.every((row) => speciesIds.has(row["From ID"]) && speciesIds.has(row["To ID"]) && speciesNames.has(row["From Species"]) && speciesNames.has(row["To Species"])));
  assert.ok(learnsets.every((row) => speciesIds.has(row["Monster ID"]) && skillIds.has(row["Skill ID"])));
  assert.equal(new Set(passives.map((row) => row["Monster ID"])).size, 221);
  assert.equal(new Set(passives.map((row) => row["Passive ID"])).size, 221);
  assert.ok(passives.every((row) => speciesIds.has(row["Monster ID"])));
  assert.ok(pools.every((row) => speciesIds.has(row["Monster ID"]) && traitIds.has(row["Trait ID"])));
});

test("v45 displayed Dex order is complete, separate, and evolution-family-contiguous", async () => {
  const [rowsRaw, species, evolutions] = await Promise.all([read("full-dex-order.json"), read("species-catalog.json"), read("evolution-paths.json")]);
  const rows = rowsRaw.filter((row) => Number.isInteger(row["Dex #"]) && Number.isInteger(row["Internal Species ID"]));
  assert.equal(rows.length, 221);
  assert.deepEqual(rows.map((row) => row["Dex #"]), Array.from({ length: 221 }, (_, index) => index + 1));
  assert.equal(new Set(rows.map((row) => row["Internal Species ID"])).size, 221);
  assert.deepEqual(rows.slice(0, 15).map((row) => row.Species), [
    "Sprigbara", "Fenbara", "Crownbara", "Cindlet", "Kilnback", "Pyroclastor", "Rifflin", "Brookotl", "Brineveil",
    "Joltmeer", "Voltbrace", "Tempestark", "Rimeket", "Duskrime", "Nocthyrme",
  ]);
  const parent = new Map(species.map((row) => [row.ID, row.ID]));
  const find = (id: unknown): unknown => parent.get(id) === id ? id : find(parent.get(id));
  for (const evolution of evolutions) {
    const fromRoot = find(evolution["From ID"]);
    const toRoot = find(evolution["To ID"]);
    if (fromRoot !== toRoot) parent.set(toRoot, fromRoot);
  }
  const positionsByFamily = new Map<unknown, number[]>();
  for (const row of rows) {
    const family = find(row["Internal Species ID"]);
    positionsByFamily.set(family, [...(positionsByFamily.get(family) ?? []), row["Dex #"] as number]);
  }
  for (const positions of positionsByFamily.values()) {
    assert.equal(Math.max(...positions) - Math.min(...positions) + 1, positions.length);
  }
});

test("v45 manifest records the generated content totals", async () => {
  const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
  assert.deepEqual(manifest, {
    designVersion: 45,
    sourceWorkbookVersion: "Monster Exchange Master Design Database v45 - Restored Middle Evolutions & 221 Card Roster",
    totalSpecies: 221,
    totalSkills: 110,
    totalPassives: 221,
    totalEvolutionPaths: 107,
    totalTraitPoolRows: 1312,
    totalEcologyRows: 221,
    totalObtainabilityRows: 221,
    totalMarketBaselineRows: 221,
    repairBasis: "Restored middle-evolution rows inherit family trait weights; ecology uses authored species descriptions; obtainability is evolution-only; market values use standard uncommon stage-2 factors.",
    sourceFile: "Monster Exchange Master Design Database v45 - Restored Middle Evolutions & 221 Card Roster",
  });
});
