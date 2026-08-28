import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { availablePlayerRoutes, cityServices, enterMajorCity, leaveCity, travelPlayer } from "../src/game/location.ts";
import { createNewGame } from "../src/game/state.ts";

test("new keepers begin in Hearthbrook and can move between city and region", () => {
  const initial = createNewGame("Keeper", 90, content.contentVersion);
  assert.deepEqual(initial.player.location, { regionId: "greenreach", cityId: "hearthbrook" });
  const outside = leaveCity(initial);
  assert.deepEqual(outside.player.location, { regionId: "greenreach" });
  assert.equal(enterMajorCity(outside).player.location.cityId, "hearthbrook");
  assert.ok(cityServices("hearthbrook").includes("market"));
});

test("regional travel charges Crowns, advances the living world, and clears city location", () => {
  const initial = createNewGame("Keeper", 91, content.contentVersion);
  const travelled = travelPlayer(initial, "greenreach-frostmarch-road", content);
  assert.deepEqual(travelled.player.location, { regionId: "frostmarch" });
  assert.equal(travelled.player.crowns, 715);
  assert.equal(travelled.world.day, 2);
  assert.ok(travelled.market.listings.length > 0, "travel days should run the full world tick");
  assert.ok(availablePlayerRoutes(travelled).some(({ id }) => id === "greenreach-frostmarch-road"));
  assert.ok(travelled.world.unlockedZoneIds.includes("frostmarch-glacial-shelf"));
});

test("late-game travel remains locked in persistent play", () => {
  const state = { ...createNewGame("Keeper", 92, content.contentVersion), player: { ...createNewGame("Keeper", 92, content.contentVersion).player, crowns: 999, location: { regionId: "stormpeak" } } };
  assert.throws(() => travelPlayer(state, "stormpeak-dragonspine-airship", content), /locked/i);
});
