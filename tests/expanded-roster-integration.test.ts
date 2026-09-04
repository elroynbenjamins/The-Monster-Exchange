import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { createMonster } from "../src/systems/monsters.ts";

const expandedIds = Array.from({ length: 32 }, (_, index) => index + 213);

test("expanded roster IDs have authored integration records without runtime fallbacks", () => {
  for (const internalId of expandedIds) {
    const species = content.species.find((candidate) => candidate.internalId === internalId)!;
    assert.ok(species);
    assert.ok(species.habitats.length > 0, `${species.name}: habitats`);
    assert.ok(species.traitPool.length > 0, `${species.name}: traits`);
    assert.ok(species.sourceTraitIds.length > 0, `${species.name}: source traits`);
    assert.ok(species.sourceSkillIds.length > 0, `${species.name}: source learnset`);
    assert.match(species.sourcePassiveId, /^PAS_\d+$/, `${species.name}: source passive`);
    assert.ok(Number.isFinite(species.weeklyMaterialValue) && species.weeklyMaterialValue >= 0, `${species.name}: material economy`);
    assert.ok(species.baseMarketValue > 0, `${species.name}: market`);
    assert.ok(species.obtainability, `${species.name}: obtainability`);
    const monster = createMonster(species, new SeededRandom(internalId), { day: 1 });
    assert.equal(monster.speciesId, species.id);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(monster)));
  }
});

test("v47 obtainability rules distinguish rare wild middle stages from evolution-only Emberrook", () => {
  for (const id of ["hailhorn", "gloamfawn"]) {
    const species = content.species.find((candidate) => candidate.id === id)!;
    assert.equal(species.evolutionStage, 2);
    assert.equal(species.obtainability?.evolutionOnly, false);
    assert.equal(species.obtainability?.wildCatchable, true);
    assert.ok(content.evolutions.some(({ toSpeciesId }) => toSpeciesId === id));
    assert.ok(content.evolutions.some(({ fromSpeciesId }) => fromSpeciesId === id));
  }
  const emberrook = content.species.find(({ id }) => id === "emberrook")!;
  assert.equal(emberrook.evolutionStage, 2);
  assert.equal(emberrook.obtainability?.evolutionOnly, true);
  assert.equal(emberrook.obtainability?.wildCatchable, false);
  assert.ok(content.evolutions.some(({ toSpeciesId }) => toSpeciesId === "emberrook"));
  assert.ok(content.evolutions.some(({ fromSpeciesId }) => fromSpeciesId === "emberrook"));
});
