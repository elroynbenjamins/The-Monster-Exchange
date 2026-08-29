import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { createNewGame } from "../src/game/state.ts";
import { addMonsterToPlayer } from "../src/game/state.ts";
import { adjacentMonsterdexEntry, buildMonsterdexEntries, cardAssetId, filterMonsterdex, monsterdexProgress } from "../src/systems/monsterdex.ts";
import { createMonster } from "../src/systems/monsters.ts";

test("the first ninety catalog monsters map to six card atlases", () => {
  assert.equal(cardAssetId(1), "monsterdex/cards/monster-cards--001-015.png");
  assert.equal(cardAssetId(16), "monsterdex/cards/monster-cards--016-030.png");
  assert.equal(cardAssetId(90), "monsterdex/cards/monster-cards--076-090.png");
  assert.equal(cardAssetId(91), undefined);
});

test("Monsterdex tracks unknown, seen, and caught species from persistent state", () => {
  let state = createNewGame("Archivist", 21, content.contentVersion);
  state = { ...state, player: { ...state.player, researchBySpecies: { canopyre: { level: 1, points: 10 } } } };
  const mossveil = content.species.find(({ id }) => id === "mossveil")!;
  state = addMonsterToPlayer(state, createMonster(mossveil, new SeededRandom(3), { day: 1, ownerId: state.player.id }));
  const entries = buildMonsterdexEntries(content.species.slice(0, 90), state);
  assert.equal(entries.find(({ species }) => species.id === "mossveil")?.status, "caught");
  assert.equal(entries.find(({ species }) => species.id === "canopyre")?.status, "seen");
  assert.equal(entries.find(({ species }) => species.id === "voltgrazer")?.status, "unknown");
  assert.deepEqual(monsterdexProgress(entries), { total: 90, seen: 2, caught: 1, completionPercent: 1 });
});

test("Monsterdex filters and wraps previous/next navigation", () => {
  const state = createNewGame("Reader", 5, content.contentVersion);
  const entries = buildMonsterdexEntries(content.species.slice(0, 90), state);
  assert.equal(filterMonsterdex(entries, { query: "Moss", type: "grass" })[0]?.species.id, "mossveil");
  assert.equal(adjacentMonsterdexEntry(entries, 1, -1)?.catalogNumber, 90);
  assert.equal(adjacentMonsterdexEntry(entries, 90, 1)?.catalogNumber, 1);
});
