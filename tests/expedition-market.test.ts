import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, addMonsterToPlayer, byId, content, createMonster, createNewGame, finishExpedition,
  listPlayerMonster, resolveExpeditionNode, resolvePlayerListingSales, restTeam, startExpeditionRun,
} from "../src/index.ts";

function gameWithTeam(count = 1) {
  let state = createNewGame("Sana", 77, content.contentVersion);
  const species = byId(content.species, "mossveil");
  const rng = new SeededRandom(77);
  for (let index = 0; index < count; index++) state = addMonsterToPlayer(state, createMonster(species, rng, { day: 1 }), true);
  return state;
}

test("expedition routes persist condition damage and award secured rewards on completion", () => {
  let state = gameWithTeam();
  const rng = new SeededRandom(10);
  state = startExpeditionRun(state, byId(content.zones, "greenreach-meadow"), rng, 2);
  const monsterId = state.player.activeTeamIds[0]!;
  while (state.activeExpedition?.route.status === "active") state = resolveExpeditionNode(state, rng).state;
  assert.ok((state.conditions[monsterId]?.stamina ?? 100) < 100);
  const crownsBefore = state.player.crowns;
  state = finishExpedition(state);
  assert.equal(state.activeExpedition, undefined);
  assert.ok(state.player.crowns >= crownsBefore);
});

test("retreat keeps only sixty percent of expedition rewards", () => {
  let state = gameWithTeam();
  state = startExpeditionRun(state, byId(content.zones, "greenreach-meadow"), new SeededRandom(1), 2);
  state = { ...state, activeExpedition: { ...state.activeExpedition!, rewards: { crowns: 101, herbs: 5 } } };
  state = finishExpedition(state, true);
  assert.equal(state.player.crowns, 810);
  assert.equal(state.player.inventory.herbs, 8);
});

test("rest recovers condition and advances the day", () => {
  let state = gameWithTeam();
  const id = state.player.monsterIds[0]!;
  state = { ...state, conditions: { [id]: { hpRatio: 0.2, stamina: 10 } } };
  const rested = restTeam(state);
  assert.equal(rested.world.day, 2);
  assert.equal(rested.conditions[id]?.hpRatio, 0.7);
  assert.equal(rested.conditions[id]?.stamina, 55);
});

test("listing removes a monster from the usable roster and a sale pays the seller", () => {
  let state = gameWithTeam(2);
  const id = state.player.monsterIds[1]!;
  state = listPlayerMonster(state, id, 250, 3, new SeededRandom(5));
  assert.equal(state.player.monsterIds.includes(id), false);
  const sale = resolvePlayerListingSales(state, new SeededRandom(1));
  assert.deepEqual(sale.soldListingIds, [state.market.listings[0]!.id]);
  assert.equal(sale.state.player.crowns, 1000);
});
