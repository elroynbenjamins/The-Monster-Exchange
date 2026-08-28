import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../data/design-v18/", import.meta.url);
const read = async (name: string): Promise<ReadonlyArray<Readonly<Record<string, unknown>>>> => JSON.parse(await readFile(new URL(name, root), "utf8"));

test("the v18 source snapshot has complete implementation coverage", async () => {
  const [species, stats, passives, learnsets, traits, market] = await Promise.all([
    read("species-catalog.json"), read("species-combat-stats.json"), read("species-passives.json"),
    read("species-skill-learnsets.json"), read("species-trait-pools.json"), read("species-market-baselines.json"),
  ]);
  assert.equal(species.length, 146);
  assert.equal(stats.length, 146);
  assert.equal(passives.length, 146);
  assert.equal(market.length, 146);
  assert.equal(new Set(learnsets.map((row) => row.Species)).size, 146);
  assert.equal(new Set(traits.map((row) => row.Species)).size, 146);
});

test("the v18 source snapshot has internally linked exploration and evolution data", async () => {
  const [species, paths, zones, encounters] = await Promise.all([
    read("species-catalog.json"), read("evolution-paths.json"), read("zone-design.json"), read("zone-encounters.json"),
  ]);
  const names = new Set(species.map((row) => row.Name));
  const zoneIds = new Set(zones.map((row) => row["Zone ID"]));
  assert.equal(paths.length, 54);
  assert.equal(zones.length, 48);
  assert.equal(encounters.length, 288);
  assert.ok(paths.every((row) => names.has(row["From Species"]) && names.has(row["To Species"])));
  assert.ok(encounters.every((row) => names.has(row.Monster) && zoneIds.has(row["Zone ID"])));
});

