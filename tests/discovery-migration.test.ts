import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { migrateSave } from "../src/game/save.ts";
import { addMonsterToPlayer, createNewGame } from "../src/game/state.ts";
import { createMonster } from "../src/systems/monsters.ts";

test("legacy v8 state deterministically hydrates explicit discovery without changing RNG state", () => {
  const mossveil = content.species.find(({ id }) => id === "mossveil")!;
  let state = createNewGame("Legacy", 808, content.contentVersion);
  state = addMonsterToPlayer(state, createMonster(mossveil, new SeededRandom(10), { day: 1 }));
  state = { ...state, world: { ...state.world, nextRandomOffset: 47 }, player: { ...state.player, researchBySpecies: { canopyre: { level: 2, points: 30 } } } };
  const legacyPlayer = { ...state.player } as typeof state.player & { discoveryBySpecies?: unknown; selectedStarterSpeciesId?: unknown };
  delete legacyPlayer.discoveryBySpecies;
  delete legacyPlayer.selectedStarterSpeciesId;
  const migrated = migrateSave({ ...state, player: legacyPlayer } as typeof state);
  assert.equal(migrated.player.discoveryBySpecies.mossveil, "CAUGHT");
  assert.equal(migrated.player.discoveryBySpecies.canopyre, "SEEN");
  assert.equal(migrated.player.discoveryBySpecies.voltgrazer, undefined);
  assert.equal(migrated.player.selectedStarterSpeciesId, null);
  assert.equal(migrated.world.nextRandomOffset, 47);
  assert.deepEqual(migrateSave(migrated), migrated);
});
