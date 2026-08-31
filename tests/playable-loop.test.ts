import assert from "node:assert/strict";
import test from "node:test";
import { STARTER_SPECIES_IDS, SeededRandom, attemptCapture, buyListing, byId, captureChance, content, createListing, createMonster, createNewGame, generateWildEncounter, recordSpeciesSeen, selectStarter } from "../src/index.ts";

test("new game offers five starters, records all as seen, and catches only the selection", () => {
  let state = createNewGame("Mira", 100, content.contentVersion);
  state = selectStarter(state, "joltmeer", content, new SeededRandom(100));
  assert.deepEqual(STARTER_SPECIES_IDS, ["sprigbara", "cindlet", "rifflin", "joltmeer", "rimeket"]);
  assert.equal(state.player.selectedStarterSpeciesId, "joltmeer");
  assert.equal(state.player.monsterIds.length, 1);
  assert.deepEqual(state.player.activeTeamIds, state.player.monsterIds);
  assert.equal(state.monsters[state.player.monsterIds[0]!]?.speciesId, "joltmeer");
  assert.deepEqual(STARTER_SPECIES_IDS.map((id) => state.player.discoveryBySpecies[id]), ["SEEN", "SEEN", "SEEN", "CAUGHT", "SEEN"]);
  assert.throws(() => selectStarter(state, "cindlet", content, new SeededRandom(101)), /already been selected/i);
  assert.throws(() => selectStarter(createNewGame("Invalid", 23, content.contentVersion), "mossveil", content, new SeededRandom(7)), /not a starter choice/i);
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
  state = recordSpeciesSeen(state, "voltgrazer");
  const purchased = buyListing(state, listing.id);
  assert.equal(purchased.player.crowns, 450);
  assert.equal(purchased.monsters[monster.id]?.ownerId, "player");
  assert.equal(purchased.market.listings.length, 0);
});
