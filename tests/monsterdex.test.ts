import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { createNewGame } from "../src/game/state.ts";
import { addMonsterToPlayer } from "../src/game/state.ts";
import { adjacentMonsterdexEntry, buildMonsterdexEntries, cardAssetId, filterMonsterdex, monsterdexEvolutionFamily, monsterdexProgress, nextMonsterdexMilestone, portraitAssetId, sortMonsterdex } from "../src/systems/monsterdex.ts";
import { createMonster } from "../src/systems/monsters.ts";

test("the first ninety catalog monsters map to refined cards and combat portraits", () => {
  assert.equal(cardAssetId(1, "mossveil"), "monsterdex/cards/001--mossveil--card.png");
  assert.equal(cardAssetId(90, "stormscribe"), "monsterdex/cards/090--stormscribe--card.png");
  assert.equal(portraitAssetId(1, "mossveil"), "monsterdex/portraits/001--mossveil--portrait.png");
  assert.equal(cardAssetId(91, "later-species"), undefined);
});

test("every initial Monsterdex entry has a card and portrait asset", () => {
  const state = createNewGame("Art Keeper", 6, content.contentVersion);
  const entries = buildMonsterdexEntries(content.species.filter(({ catalogNumber }) => catalogNumber <= 90), state);
  for (const entry of entries) {
    assert.ok(entry.cardAssetId && existsSync(resolve("assets/pixel", entry.cardAssetId)), `Missing card for ${entry.species.id}`);
    assert.ok(entry.portraitAssetId && existsSync(resolve("assets/pixel", entry.portraitAssetId)), `Missing portrait for ${entry.species.id}`);
  }
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

test("Monsterdex sorts entries and resolves complete evolution families", () => {
  const state = createNewGame("Curator", 8, content.contentVersion);
  const entries = buildMonsterdexEntries(content.species.slice(0, 90), state);
  assert.equal(sortMonsterdex(entries, "name")[0]?.species.name, [...entries].sort((a, b) => a.species.name.localeCompare(b.species.name))[0]?.species.name);
  assert.deepEqual(monsterdexEvolutionFamily(entries, 2).map(({ catalogNumber }) => catalogNumber), [1, 2]);
  assert.deepEqual(monsterdexEvolutionFamily(entries, 4).map(({ catalogNumber }) => catalogNumber), [3, 4]);
});

test("Monsterdex milestones advance in ten-monster steps and cap at collection size", () => {
  assert.deepEqual(nextMonsterdexMilestone({ total: 90, seen: 15, caught: 3, completionPercent: 3 }), { target: 10, remaining: 7 });
  assert.deepEqual(nextMonsterdexMilestone({ total: 90, seen: 90, caught: 90, completionPercent: 100 }), { target: 90, remaining: 0 });
  assert.deepEqual(nextMonsterdexMilestone({ total: 7, seen: 0, caught: 0, completionPercent: 0 }), { target: 7, remaining: 7 });
});
