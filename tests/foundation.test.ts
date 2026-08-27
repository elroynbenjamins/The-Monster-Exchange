import assert from "node:assert/strict";
import test from "node:test";
import { SeededRandom, appraiseMonster, breed, byId, calculatePotential, content, createExpedition, createListing, createMonster, evaluateEvolution, resolveCurrentNode, tickMarket } from "../src/index.ts";

test("seeded monster generation is deterministic and potential derives from genes", () => {
  const species = byId(content.species, "mossveil");
  const a = createMonster(species, new SeededRandom(42), { day: 1 });
  const b = createMonster(species, new SeededRandom(42), { day: 1 });
  assert.deepEqual(a.genes, b.genes);
  assert.equal(a.potential, calculatePotential(a.genes, species.geneCaps));
});

test("breeding creates a persistent child with both parent IDs", () => {
  const species = byId(content.species, "mossveil");
  const rng = new SeededRandom(7);
  const mother = { ...createMonster(species, rng, { day: 1 }), sex: "female" as const };
  const father = { ...createMonster(species, rng, { day: 1 }), sex: "male" as const };
  const result = breed(mother, father, species, species, rng, 5);
  assert.deepEqual(result.offspring.lineage.parentIds, [mother.id, father.id]);
  assert.equal(result.offspring.lineage.generation, 1);
  assert.ok(result.offspring.potential >= 0 && result.offspring.potential <= 100);
});

test("evolution reports unmet requirements instead of silently evolving", () => {
  const species = byId(content.species, "mossveil");
  const monster = createMonster(species, new SeededRandom(9), { day: 1, level: 10 });
  const evolution = byId(content.evolutions, "mossveil-to-canopyre");
  const result = evaluateEvolution(monster, evolution);
  assert.equal(result.eligible, false);
  assert.ok(result.unmet.includes("level"));
});

test("market lists individuals and expires them on a world tick", () => {
  const species = byId(content.species, "mossveil");
  const rng = new SeededRandom(12);
  const monster = createMonster(species, rng, { day: 1, ownerId: "seller" });
  const index = { speciesId: species.id, supply: 10, demand: 10, lastPrice: 200 };
  const price = appraiseMonster(monster, species, content.traits, index);
  const listing = createListing(monster, "seller", price, 1, 1, rng);
  const next = tickMarket({ day: 1, indices: { [species.id]: index }, listings: [listing], events: [] });
  assert.equal(next.listings.length, 0);
  assert.equal(next.events[0]?.type, "market.listing-expired");
});

test("expeditions have fixed routes and consume stamina", () => {
  const zone = byId(content.zones, "greenreach-meadow");
  const expedition = createExpedition(zone, ["mon_a"], new SeededRandom(99), 3);
  const next = resolveCurrentNode(expedition, 12);
  assert.equal(next.currentNode, 1);
  assert.equal(next.stamina, 88);
  assert.equal(next.nodes[0]?.resolved, true);
});
