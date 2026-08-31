import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { migrateSave } from "../src/game/save.ts";
import { SAVE_VERSION, createNewGame } from "../src/game/state.ts";

const aliases: Readonly<Record<string, string>> = {
  hearthbrook: "willowmere", stonehollow: "cairnstead", saltwharf: "tidemark", bogmoor: "fenwatch",
  glacierhold: "rimegate", thunderwatch: "thunderrest", aurelia: "crownspire", steelgate: "ferrum-gate",
  drakoria: "ashenhold", luminspire: "lumenfall", "abyssal-point": "blacktide", nullspire: "seamwatch",
};

test("save v9 deterministically migrates every legacy city and Veydris unlock alias", () => {
  for (const [legacyCity, canonicalCity] of Object.entries(aliases)) {
    const current = createNewGame("Legacy", 900, content.contentVersion);
    const legacy = {
      ...current, saveVersion: 8,
      player: { ...current.player, location: { regionId: current.player.location.regionId, cityId: legacyCity }, specialEvolutionProgress: undefined },
      world: { ...current.world, nextRandomOffset: 77, unlockedMapIds: ["continent-heartland", "continent-frontier", `city-${legacyCity}`, "late-game-continent"], storyFlags: undefined, travelEventState: undefined, dynamicState: undefined },
      rivalStateExtensions: undefined, homebaseQueues: undefined, monetizationEntitlements: undefined,
    } as unknown as typeof current;
    const migrated = migrateSave(legacy);
    assert.equal(migrated.saveVersion, SAVE_VERSION);
    assert.equal(migrated.player.location.cityId, canonicalCity);
    assert.ok(migrated.world.unlockedMapIds.includes("continent-ardenfall"));
    assert.ok(migrated.world.unlockedMapIds.includes("continent-veydris"));
    assert.ok(migrated.world.unlockedMapIds.includes(`city-${canonicalCity}`));
    assert.ok(migrated.world.storyFlags.includes("STORY_VEYDRIS_ACCESS"));
    assert.equal(migrated.world.nextRandomOffset, 77);
    assert.deepEqual(migrateSave(migrated), migrated);
  }
});

test("new v9 saves initialize future persistence structures without inventing legacy state", () => {
  const state = createNewGame("Future", 901, content.contentVersion);
  assert.equal(state.saveVersion, 9);
  assert.equal(state.player.selectedStarterSpeciesId, null);
  assert.deepEqual(state.player.specialEvolutionProgress, {});
  assert.deepEqual(state.world.storyFlags, []);
  assert.deepEqual(state.world.travelEventState, { resolvedEventIds: [] });
  assert.deepEqual(state.world.dynamicState, {});
  assert.deepEqual(state.rivalStateExtensions, {});
  assert.deepEqual(state.homebaseQueues, { constructionIds: [], breedingJobIds: [] });
  assert.deepEqual(state.monetizationEntitlements, []);
});
