import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { createMonster } from "../src/systems/monsters.ts";

const expandedIds = [213, 214, 215, 216, 217, 218, 219, 220, 221];

test("expanded roster IDs have authored integration records without runtime fallbacks", () => {
  for (const internalId of expandedIds) {
    const species = content.species.find((candidate) => candidate.internalId === internalId)!;
    assert.ok(species);
    assert.ok(species.habitats.length > 0, `${species.name}: habitats`);
    assert.ok(species.traitPool.length > 0, `${species.name}: traits`);
    assert.ok(species.sourceTraitIds.length > 0, `${species.name}: source traits`);
    assert.ok(species.sourceSkillIds.length > 0, `${species.name}: source learnset`);
    assert.match(species.sourcePassiveId, /^PAS_\d+$/, `${species.name}: source passive`);
    assert.ok(species.weeklyMaterialValue > 0, `${species.name}: material economy`);
    assert.ok(species.baseMarketValue > 0, `${species.name}: market`);
    assert.ok(species.obtainability, `${species.name}: obtainability`);
    const monster = createMonster(species, new SeededRandom(internalId), { day: 1 });
    assert.equal(monster.speciesId, species.id);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(monster)));
  }
});

test("restored middle evolutions are obtainable through evolution but excluded from ordinary encounters", () => {
  for (const id of ["hailhorn", "gloamfawn"]) {
    const species = content.species.find((candidate) => candidate.id === id)!;
    assert.equal(species.evolutionStage, 2);
    assert.equal(species.obtainability?.evolutionOnly, true);
    assert.equal(species.obtainability?.wildCatchable, false);
    assert.ok(content.evolutions.some(({ toSpeciesId }) => toSpeciesId === id));
    assert.ok(content.evolutions.some(({ fromSpeciesId }) => fromSpeciesId === id));
    assert.ok(content.zones.every((zone) => zone.speciesPool.every(({ speciesId }) => speciesId !== id)));
  }
});
