import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, addMonsterToPlayer, byId, calculateExpeditionPreparation, captureChance, content, createExpedition, createMonster, createNewGame, finishExpedition, generateBossEncounter,
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

test("expedition approaches trade route stamina and risk for reward", () => {
  const zone = byId(content.zones, "greenreach-meadow");
  const base = startExpeditionRun(gameWithTeam(), zone, new SeededRandom(2), 1);
  const resourceRoute = { ...base.activeExpedition!.route, nodes: [{ type: "resource" as const, resolved: false }] };
  const prepared = { ...base, activeExpedition: { ...base.activeExpedition!, route: resourceRoute } };
  const cautious = resolveExpeditionNode(prepared, new SeededRandom(12), content.equipment, "cautious").state;
  const bold = resolveExpeditionNode(prepared, new SeededRandom(12), content.equipment, "bold").state;
  const cautiousRewards = Object.values(cautious.activeExpedition!.rewards).reduce((sum, amount) => sum + amount, 0);
  const boldRewards = Object.values(bold.activeExpedition!.rewards).reduce((sum, amount) => sum + amount, 0);
  assert.ok(boldRewards > cautiousRewards);
  assert.equal(cautious.activeExpedition!.route.stamina, 93);
  assert.equal(bold.activeExpedition!.route.stamina, 86);
});

test("node outcome events remember the player's approach", () => {
  const base = startExpeditionRun(gameWithTeam(), byId(content.zones, "greenreach-meadow"), new SeededRandom(3), 1);
  const outcome = resolveExpeditionNode(base, new SeededRandom(8), content.equipment, "bold");
  assert.equal(outcome.event.payload.approach, "bold");
});

test("team types and tags provide data-driven protection from zone hazards", () => {
  const state = gameWithTeam();
  const preparation = calculateExpeditionPreparation(state, byId(content.zones, "greenreach-meadow"), content.species, content.hazards);
  assert.deepEqual(preparation.protectedHazardIds, ["heavy-rain"]);
  assert.equal(preparation.riskReduction, 0.12);
});

test("authored bosses occupy the route finale and cannot be captured", () => {
  const zone = byId(content.zones, "greenreach-meadow");
  const route = createExpedition(zone, ["mon_a"], new SeededRandom(33), 4);
  assert.equal(route.nodes.at(-1)?.type, "boss");
  const boss = generateBossEncounter(zone, content.species, new SeededRandom(34), 1);
  assert.equal(boss.isBoss, true);
  assert.equal(boss.monster.level, zone.boss?.level);
  assert.equal(captureChance(boss, 0.01, 1), 0);
});

test("boss resolution awards the zone's authored bounty", () => {
  const zone = byId(content.zones, "greenreach-meadow");
  const base = startExpeditionRun(gameWithTeam(), zone, new SeededRandom(35), 1);
  const outcome = resolveExpeditionNode(base, new SeededRandom(36), content.equipment, "balanced", 0, zone);
  assert.equal(outcome.event.payload.nodeType, "boss");
  assert.equal(outcome.state.activeExpedition?.rewards.crowns, zone.boss?.rewardCrowns);
  assert.equal(outcome.state.activeExpedition?.rewards["research-notes"], zone.boss?.researchNotes);
  assert.ok(outcome.state.world.unlockedZoneIds.includes("greenreach-deepwood"));
});

test("the Expedition Lodge increases route stamina and retreat recovery", () => {
  const zone = byId(content.zones, "greenreach-meadow");
  const base = gameWithTeam();
  const prepared = { ...base, homebase: { ...base.homebase, buildings: [{ buildingId: "expedition-lodge", level: 2, status: "active" as const }] } };
  let state = startExpeditionRun(prepared, zone, new SeededRandom(37), 2);
  assert.equal(state.activeExpedition?.route.stamina, 110);
  state = { ...state, activeExpedition: { ...state.activeExpedition!, rewards: { crowns: 100 } } };
  const crownsBefore = state.player.crowns;
  state = finishExpedition(state, true);
  assert.equal(state.player.crowns, crownsBefore + 70);
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
