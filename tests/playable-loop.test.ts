import assert from "node:assert/strict";
import test from "node:test";
import { SeededRandom, addMonsterToPlayer, attemptCapture, buyListing, byId, captureChance, content, createListing, createMonster, createNewGame, generateWildEncounter } from "../src/index.ts";

test("new game can receive a persistent starter", () => {
  let state = createNewGame("Mira", 100, content.contentVersion);
  const species = byId(content.species, "mossveil");
  const starter = createMonster(species, new SeededRandom(100), { day: 1, ownerId: "player" });
  state = addMonsterToPlayer(state, starter, true);
  assert.deepEqual(state.player.monsterIds, [starter.id]);
  assert.deepEqual(state.player.activeTeamIds, [starter.id]);
  assert.equal(state.monsters[starter.id]?.ownerId, "player");
});

test("weaker wild monsters are easier to capture", () => {
  const zone = byId(content.zones, "greenreach-meadow");
  const encounter = generateWildEncounter(zone, content.species, new SeededRandom(2), 1);
  assert.ok(captureChance(encounter, 0.15) > captureChance(encounter, 0.9));
  const result = attemptCapture(encounter, 0.15, new SeededRandom(1), 1);
  assert.equal(result.captured, true);
});

test("buying a listing transfers the individual and Crowns", () => {
  let state = createNewGame("Mira", 1, content.contentVersion);
  const species = byId(content.species, "voltgrazer");
  const rng = new SeededRandom(5);
  const monster = createMonster(species, rng, { day: 1, ownerId: "npc-trader" });
  const listing = createListing(monster, "npc-trader", 300, 1, 3, rng);
  state = { ...state, market: { ...state.market, listings: [listing] } };
  const purchased = buyListing(state, listing.id);
  assert.equal(purchased.player.crowns, 450);
  assert.equal(purchased.monsters[monster.id]?.ownerId, "player");
  assert.equal(purchased.market.listings.length, 0);
});
