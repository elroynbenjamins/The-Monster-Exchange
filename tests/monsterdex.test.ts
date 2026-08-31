import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { createNewGame, recordSpeciesCaught, recordSpeciesSeen } from "../src/game/state.ts";
import { addMonsterToPlayer } from "../src/game/state.ts";
import { adjacentMonsterdexEntry, buildMonsterdexEntries, cardAssetId, filterMonsterdex, monsterdexEvolutionFamily, monsterdexProgress, nextMonsterdexMilestone, portraitAssetId, sortMonsterdex } from "../src/systems/monsterdex.ts";
import { createMonster } from "../src/systems/monsters.ts";

test("Monsterdex art remains unset until replacement assets arrive", () => {
  assert.equal(cardAssetId(1, "mossveil"), undefined);
  assert.equal(cardAssetId(90, "stormscribe"), undefined);
  assert.equal(portraitAssetId(1, "mossveil"), undefined);
  assert.equal(cardAssetId(91, "later-species"), undefined);
});

test("Monsterdex entries tolerate the temporary absence of art", () => {
  const state = createNewGame("Art Keeper", 6, content.contentVersion);
  const entries = buildMonsterdexEntries(content.species.filter(({ internalId }) => internalId <= 90), state);
  for (const entry of entries) {
    assert.equal(entry.cardAssetId, undefined);
    assert.equal(entry.portraitAssetId, undefined);
  }
});

test("Monsterdex tracks unknown, seen, and caught species from persistent state", () => {
  let state = createNewGame("Archivist", 21, content.contentVersion);
  state = { ...state, player: { ...state.player, researchBySpecies: { canopyre: { level: 1, points: 10 } } } };
  state = recordSpeciesSeen(state, "canopyre");
  const mossveil = content.species.find(({ id }) => id === "mossveil")!;
  state = addMonsterToPlayer(state, createMonster(mossveil, new SeededRandom(3), { day: 1, ownerId: state.player.id }));
  const entries = buildMonsterdexEntries(content.species.slice(0, 90), state);
  assert.equal(entries.find(({ species }) => species.id === "mossveil")?.status, "CAUGHT");
  assert.equal(entries.find(({ species }) => species.id === "canopyre")?.status, "SEEN");
  assert.equal(entries.find(({ species }) => species.id === "voltgrazer")?.status, "UNKNOWN");
  assert.deepEqual(entries.find(({ species }) => species.id === "voltgrazer")?.display, { name: "???" });
  assert.equal(entries.find(({ species }) => species.id === "canopyre")?.display.name, "Canopyre");
  assert.equal(entries.find(({ species }) => species.id === "canopyre")?.display.fullEntry, undefined);
  assert.equal(entries.find(({ species }) => species.id === "mossveil")?.display.fullEntry?.id, "mossveil");
  assert.deepEqual(monsterdexProgress(entries), { total: 90, seen: 2, caught: 1, completionPercent: 1 });
});

test("Monsterdex filters and wraps previous/next navigation", () => {
  const state = createNewGame("Reader", 5, content.contentVersion);
  const entries = buildMonsterdexEntries(content.species, state).slice(0, 90);
  assert.equal(filterMonsterdex(entries, { query: "Moss", type: "grass" })[0]?.species.id, "mossveil");
  assert.equal(adjacentMonsterdexEntry(entries, 1, -1)?.catalogNumber, 90);
  assert.equal(adjacentMonsterdexEntry(entries, 90, 1)?.catalogNumber, 1);
});

test("Monsterdex sorts entries and resolves complete evolution families", () => {
  const state = createNewGame("Curator", 8, content.contentVersion);
  const entries = buildMonsterdexEntries(content.species, state).slice(0, 90);
  assert.equal(sortMonsterdex(entries, "name")[0]?.species.name, [...entries].sort((a, b) => a.species.name.localeCompare(b.species.name))[0]?.species.name);
  assert.deepEqual(monsterdexEvolutionFamily(buildMonsterdexEntries(content.species, state), 2).map(({ catalogNumber }) => catalogNumber), [1, 2, 3]);
  assert.deepEqual(monsterdexEvolutionFamily(buildMonsterdexEntries(content.species, state), 4).map(({ catalogNumber }) => catalogNumber), [4, 5, 6]);
});

test("discovery transitions are explicit, monotonic, and independent from research", () => {
  let state = createNewGame("Observer", 13, content.contentVersion);
  state = { ...state, player: { ...state.player, researchBySpecies: { joltmeer: { level: 5, points: 200 } } } };
  assert.equal(buildMonsterdexEntries(content.species, state).find(({ species }) => species.id === "joltmeer")?.status, "UNKNOWN");
  state = recordSpeciesSeen(state, "joltmeer");
  assert.equal(state.player.discoveryBySpecies.joltmeer, "SEEN");
  state = recordSpeciesCaught(state, "joltmeer");
  assert.equal(state.player.discoveryBySpecies.joltmeer, "CAUGHT");
  state = recordSpeciesSeen(state, "joltmeer");
  assert.equal(state.player.discoveryBySpecies.joltmeer, "CAUGHT");
});

test("Monsterdex milestones advance in ten-monster steps and cap at collection size", () => {
  assert.deepEqual(nextMonsterdexMilestone({ total: 90, seen: 15, caught: 3, completionPercent: 3 }), { target: 10, remaining: 7 });
  assert.deepEqual(nextMonsterdexMilestone({ total: 90, seen: 90, caught: 90, completionPercent: 100 }), { target: 90, remaining: 0 });
  assert.deepEqual(nextMonsterdexMilestone({ total: 7, seen: 0, caught: 0, completionPercent: 0 }), { target: 7, remaining: 7 });
});
