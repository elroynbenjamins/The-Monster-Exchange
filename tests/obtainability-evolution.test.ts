import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { createNewGame } from "../src/game/state.ts";
import { breed, canBreed } from "../src/systems/breeding.ts";
import { captureChance } from "../src/systems/encounters.ts";
import { evaluateEvolution } from "../src/systems/evolution.ts";
import { createMonster } from "../src/systems/monsters.ts";
import { listPlayerMonster } from "../src/systems/transactions.ts";

const species = (id: string) => content.species.find((entry) => entry.id === id)!;

test("evolution-only species stay out of ordinary encounters and direct eggs", () => {
  for (const id of ["rimehorn", "mournglade", "solvulture"]) {
    const definition = species(id);
    assert.equal(definition.obtainability?.evolutionOnly, true);
    assert.equal(definition.obtainability?.wildCatchable, false);
    assert.equal(definition.obtainability?.directHatch, false);
    assert.equal(content.zones.some((zone) => zone.speciesPool.some((entry) => entry.speciesId === id)), false);
  }
});

test("uncatchable species have zero capture chance", () => {
  const definition = species("rimehorn");
  const monster = createMonster(definition, new SeededRandom(1), { day: 1 });
  assert.equal(captureChance({ monster, species: definition, captureDifficulty: 0, isBoss: false }, 0.01), 0);
});

test("breeding an evolved form with a hatchable form produces the hatchable species", () => {
  const evolved = species("rimehorn");
  const hatchable = species("frostuft");
  const rng = new SeededRandom(4);
  const mother = { ...createMonster(evolved, rng, { day: 1 }), sex: "female" as const };
  const father = { ...createMonster(hatchable, rng, { day: 1 }), sex: "male" as const };
  assert.equal(canBreed(mother, father, evolved, hatchable).ok, true);
  assert.equal(breed(mother, father, evolved, hatchable, rng, 2).offspring.speciesId, "frostuft");
});

test("evolution evaluates wins, item count, location, weather, research and progression gates", () => {
  const monster = { ...createMonster(species("mossveil"), new SeededRandom(8), { day: 1, level: 20 }), wins: 5, potential: 70 };
  const evolution = {
    id: "test-evolution", fromSpeciesId: "mossveil", toSpeciesId: "canopyre",
    requirements: { minLevel: 20, minPotential: 60, minWins: 5, itemId: "moon-stone", itemQuantity: 2, regionId: "greenreach", weather: "rain", environmentTag: "ancient-grove", minResearchLevel: 3, licenceId: "master-breeder", storyMilestoneId: "old-roots-awakened" },
  };
  const context = { inventory: { "moon-stone": 2 }, regionId: "greenreach", weather: "rain", environmentTags: ["ancient-grove"], researchLevel: 3, licenceIds: ["master-breeder"], storyMilestoneIds: ["old-roots-awakened"] };
  assert.deepEqual(evaluateEvolution(monster, evolution, context), { eligible: true, unmet: [] });
  assert.deepEqual(evaluateEvolution(monster, evolution, { ...context, weather: "clear", inventory: { "moon-stone": 1 } }).unmet, ["item", "weather"]);
});

test("generic obtainability rules block non-tradeable species", () => {
  let state = createNewGame("Trader", 12, content.contentVersion);
  const guardian = createMonster(species("aurevine"), new SeededRandom(3), { day: 1, ownerId: state.player.id });
  const spare = createMonster(species("mossveil"), new SeededRandom(4), { day: 1, ownerId: state.player.id });
  state = { ...state, monsters: { [guardian.id]: guardian, [spare.id]: spare }, player: { ...state.player, monsterIds: [guardian.id, spare.id], activeTeamIds: [spare.id] } };
  assert.throws(() => listPlayerMonster(state, guardian.id, 1000, 3, new SeededRandom(5), content.species), /cannot be sold/i);
});
