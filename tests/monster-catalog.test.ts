import assert from "node:assert/strict";
import test from "node:test";
import { GAME_TYPES } from "../src/core/types.ts";
import { content } from "../src/content/index.ts";
import { CREST_GUARDIANS } from "../src/content/crest-guardians.ts";

test("the approved Word catalog is implemented as 100 playable species", () => {
  assert.ok(content.species.length >= 100);
  assert.deepEqual(content.species.slice(0, 100).map(({ catalogNumber }) => catalogNumber), Array.from({ length: 100 }, (_, index) => index + 1));
  assert.equal(new Set(content.species.map(({ id }) => id)).size, content.species.length);
  assert.ok(content.species.every((species) => species.description.length > 20));
});

test("catalog rarity and type coverage remain balanced", () => {
  const rarityCounts = Object.fromEntries(["common", "uncommon", "rare", "epic", "legendary"].map((rarity) => [rarity, content.species.filter((species) => species.rarity === rarity).length]));
  assert.deepEqual(rarityCounts, { common: 40, uncommon: 30, rare: 24, epic: 4, legendary: 4 });
  for (const type of GAME_TYPES) assert.ok(content.species.filter((species) => species.types.includes(type)).length >= 7, `${type} is underrepresented`);
});

test("the Exchange Crest guardians are distinct legendary game species", () => {
  const aurevine = content.species.find(({ id }) => id === "aurevine")!;
  const tempestyr = content.species.find(({ id }) => id === "tempestyr")!;
  assert.deepEqual([aurevine.rarity, tempestyr.rarity], ["legendary", "legendary"]);
  assert.deepEqual(aurevine.types, ["grass", "fairy"]);
  assert.deepEqual(tempestyr.types, ["electric", "dragon"]);
  assert.ok(aurevine.skillPool.includes("crest-renewal"));
  assert.ok(tempestyr.skillPool.includes("crest-thunderbolt"));
  assert.ok(aurevine.tags.includes("crest-guardian") && tempestyr.tags.includes("crest-guardian"));
  assert.equal(CREST_GUARDIANS.length, 2);
  assert.ok(CREST_GUARDIANS.every(({ visualConcept, sanctuary }) => visualConcept.length > 40 && sanctuary.length > 20));
  for (const zone of content.zones) {
    assert.ok(!zone.speciesPool.some(({ speciesId }) => speciesId === "aurevine" || speciesId === "tempestyr"), "guardians must not be ordinary wild rolls");
  }
});

test("proposed families become sequential, stronger evolution paths", () => {
  assert.equal(content.evolutions.length, 38);
  const cindlet = content.species.find(({ id }) => id === "cindlet")!;
  const kilnback = content.species.find(({ id }) => id === "kilnback")!;
  const pyroclastor = content.species.find(({ id }) => id === "pyroclastor")!;
  assert.deepEqual(cindlet.evolutionIds, ["cindlet-to-kilnback"]);
  assert.deepEqual(kilnback.evolutionIds, ["kilnback-to-pyroclastor"]);
  assert.deepEqual(pyroclastor.evolutionIds, []);
  const budget = (id: string) => {
    const stats = content.species.find((species) => species.id === id)!.baseStats;
    return stats.hp + stats.attack + stats.defense + stats.speed;
  };
  assert.ok(budget("cindlet") < budget("kilnback"));
  assert.ok(budget("kilnback") < budget("pyroclastor"));
});

test("every monster is connected to reusable gameplay content", () => {
  for (const species of content.species) {
    assert.ok(species.skillPool.length >= 2, `${species.name} needs at least two skills`);
    assert.ok(species.breedingGroups.length >= 1, `${species.name} needs a breeding group`);
    assert.ok(species.habitats.length >= 1, `${species.name} needs a habitat`);
    assert.ok(content.passives.some(({ id }) => id === species.passiveId));
    assert.ok(species.habitats.every((habitat) => content.zones.some(({ id }) => id === habitat)));
  }
});

test("every regional expedition has a populated and type-relevant ecology", () => {
  for (const zone of content.zones) {
    assert.ok(zone.speciesPool.length >= 5, `${zone.name} needs at least five encounter species`);
    const region = content.regions.find(({ id }) => id === zone.regionId)!;
    assert.ok(zone.speciesPool.some(({ speciesId }) => content.species.find(({ id }) => id === speciesId)!.types.some((type) => type && region.types.includes(type))), `${zone.name} needs a regionally relevant species`);
  }
});
