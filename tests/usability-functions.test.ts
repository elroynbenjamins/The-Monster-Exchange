import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, addMonsterToPlayer, browseMarketListings, byId, content, craftRecipe, createListing,
  createMonster, createNewGame, provideFieldCare, renameOwnedMonster,
} from "../src/index.ts";

function ownedMonster() {
  let state = createNewGame("Ira", 501, content.contentVersion);
  const monster = createMonster(byId(content.species, "mossveil"), new SeededRandom(501), { day: 1 });
  state = addMonsterToPlayer(state, monster, true);
  return { state, monster };
}

test("owned monsters can be nicknamed and reset to their species name", () => {
  const setup = ownedMonster();
  let state = renameOwnedMonster(setup.state, setup.monster.id, "  Fern  ");
  assert.equal(state.monsters[setup.monster.id]?.nickname, "Fern");
  state = renameOwnedMonster(state, setup.monster.id, "");
  assert.equal(state.monsters[setup.monster.id]?.nickname, undefined);
  assert.throws(() => renameOwnedMonster(state, setup.monster.id, "x".repeat(25)), /24 characters/);
});

test("field care consumes herbs and the Clinic improves recovery", () => {
  const setup = ownedMonster();
  let state = {
    ...setup.state,
    conditions: { ...setup.state.conditions, [setup.monster.id]: { hpRatio: 0.4, stamina: 40 } },
    homebase: { ...setup.state.homebase, buildings: [{ buildingId: "field-clinic", level: 2, status: "active" as const }] },
  };
  state = provideFieldCare(state, setup.monster.id, 1);
  assert.equal(state.player.inventory.herbs, 4);
  assert.ok(Math.abs(state.conditions[setup.monster.id]!.hpRatio - 0.7) < 0.000001);
  assert.equal(state.conditions[setup.monster.id]?.stamina, 54);
});

test("Workshop recipes consume inputs and produce exact quantities", () => {
  const setup = ownedMonster();
  const state = { ...setup.state, homebase: { ...setup.state.homebase, buildings: [{ buildingId: "field-workshop", level: 1, status: "active" as const }] } };
  const crafted = craftRecipe(state, "craft-field-capsule", 2, content);
  assert.equal(crafted.player.inventory.herbs, 1);
  assert.equal(crafted.player.inventory.stone, 23);
  assert.equal(crafted.player.inventory["field-capsule"], 7);
  assert.throws(() => craftRecipe(state, "craft-capture-lens", 1, content), /level 3/);
});

test("market browsing filters the player's listings and sorts affordable NPC stock", () => {
  const setup = ownedMonster();
  const rng = new SeededRandom(502);
  const species = byId(content.species, "voltgrazer");
  const cheap = createListing(createMonster(species, rng, { day: 1, ownerId: "npc-a" }), "npc-a", 200, 1, 3, rng);
  const costly = createListing(createMonster(species, rng, { day: 1, ownerId: "npc-b" }), "npc-b", 900, 1, 3, rng);
  const mine = createListing(setup.state.monsters[setup.monster.id]!, setup.state.player.id, 100, 1, 3, rng);
  const state = { ...setup.state, market: { ...setup.state.market, listings: [costly, mine, cheap] } };
  assert.deepEqual(browseMarketListings(state).map(({ id }) => id), [cheap.id, costly.id]);
  assert.deepEqual(browseMarketListings(state, { affordableOnly: true }).map(({ id }) => id), [cheap.id]);
  assert.deepEqual(browseMarketListings(state, { speciesId: "voltgrazer", maximumPrice: 250 }).map(({ id }) => id), [cheap.id]);
  assert.deepEqual(browseMarketListings(state, { sortBy: "potential" }).map(({ monster }) => monster.potential), [costly.monster.potential, cheap.monster.potential].sort((a, b) => b - a));
  assert.deepEqual(browseMarketListings(state, { sortBy: "level" }).map(({ monster }) => monster.level), [costly.monster.level, cheap.monster.level].sort((a, b) => b - a));
});
