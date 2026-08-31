import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, addMonsterToPlayer, advanceWorldDay, byId, claimBreedingJob, constructBuilding, content,
  createMonster, createNewGame, depositHomebaseResource, equipMonsterSkills, evolveOwnedMonster,
  grantMonsterXp, setActiveTeam, startBreeding, upgradeBuilding,
  applyBattleAction, chooseAiAction, createBattle, nextActor, settleBattleProgression,
} from "../src/index.ts";

function ownedPair() {
  let state = createNewGame("Nia", 123, content.contentVersion);
  const species = byId(content.species, "mossveil");
  const rng = new SeededRandom(123);
  const a = { ...createMonster(species, rng, { day: 1 }), sex: "female" as const };
  const b = { ...createMonster(species, rng, { day: 1 }), sex: "male" as const };
  state = addMonsterToPlayer(addMonsterToPlayer(state, a, true), b, true);
  return { state, a, b };
}

test("team and skill commands enforce ownership and loadout limits", () => {
  const { state, a } = ownedPair();
  assert.throws(() => setActiveTeam(state, [a.id, a.id]), /two team slots/);
  const equipped = equipMonsterSkills(state, a.id, ["root-lash"]);
  assert.deepEqual(equipped.monsters[a.id]?.equippedSkillIds, ["root-lash"]);
  assert.throws(() => equipMonsterSkills(state, a.id, ["static-prance"]), /known skills/);
});

test("XP levels monsters through centralized thresholds", () => {
  const { state, a } = ownedPair();
  const result = grantMonsterXp(state, a.id, 10000, content);
  assert.ok(result.levelsGained > 1);
  assert.ok(result.state.monsters[a.id]!.level <= 50);
  assert.ok(result.state.monsters[a.id]!.xp >= 0);
});

test("construction completes on world days and upgrades use scaled costs", () => {
  let { state } = ownedPair();
  const nest = byId(content.buildings, "breeding-nest");
  state = constructBuilding(state, nest);
  assert.equal(state.homebase.buildings[0]?.status, "constructing");
  state = advanceWorldDay(state, content).state;
  state = advanceWorldDay(state, content).state;
  assert.equal(state.homebase.buildings[0]?.status, "active");
  state = depositHomebaseResource(state, "timber", 50);
  state = depositHomebaseResource(state, "stone", 25);
  state = upgradeBuilding(state, nest);
  assert.equal(state.homebase.buildings[0]?.targetLevel, 2);
});

test("breeding uses nest capacity, time, fees, and creates a claimable offspring", () => {
  let { state, a, b } = ownedPair();
  state = { ...state, homebase: { ...state.homebase, buildings: [{ buildingId: "breeding-nest", level: 1, status: "active" }] } };
  const crowns = state.player.crowns;
  state = startBreeding(state, [a.id, b.id], content, new SeededRandom(4));
  assert.equal(state.player.crowns, crowns - 90);
  assert.throws(() => startBreeding(state, [a.id, b.id], content, new SeededRandom(5)), /capacity/);
  while (state.breedingJobs[0]?.status !== "ready") state = advanceWorldDay(state, content).state;
  const rosterSize = state.player.monsterIds.length;
  state = claimBreedingJob(state, state.breedingJobs[0]!.id, content, new SeededRandom(6));
  assert.equal(state.player.monsterIds.length, rosterSize + 1);
  assert.equal(state.breedingJobs.length, 0);
});

test("evolution preserves identity and unlocks evolved species skills", () => {
  let { state, a } = ownedPair();
  state = { ...state, monsters: { ...state.monsters, [a.id]: { ...state.monsters[a.id]!, level: 20, potential: 70, wins: 8 } } };
  state = evolveOwnedMonster(state, a.id, byId(content.evolutions, "mossveil-to-canopyre"), content, { environmentTags: ["bloom-protected-grove"] });
  assert.equal(state.monsters[a.id]?.speciesId, "canopyre");
  assert.ok(state.monsters[a.id]?.knownSkillIds.includes("canopy-surge"));
});

test("world ticks update season systems, recovery, market indices, NPC supply, and events", () => {
  let { state, a } = ownedPair();
  state = { ...state, conditions: { ...state.conditions, [a.id]: { hpRatio: 0.2, stamina: 10 } } };
  const result = advanceWorldDay(state, content);
  assert.equal(result.state.world.day, 2);
  assert.ok(result.state.conditions[a.id]!.hpRatio > 0.2);
  assert.ok(Object.keys(result.state.market.indices).length === content.species.length);
  assert.ok(result.state.market.listings.some(({ sellerId }) => sellerId !== "player"));
  assert.equal(result.events.at(-1)?.type, "world.day-advanced");
});

test("settled battles update XP, records, fame, and manager reputation", () => {
  let { state, a } = ownedPair();
  const enemySpecies = byId(content.species, "voltgrazer");
  const enemy = createMonster(enemySpecies, new SeededRandom(91), { day: 1, level: 3, ownerId: "wild" });
  let battle = createBattle([state.monsters[a.id]!], [enemy], content);
  const rng = new SeededRandom(92);
  for (let turn = 0; battle.result === "ongoing" && turn < 100; turn++) {
    const actor = nextActor(battle)!;
    battle = applyBattleAction(battle, chooseAiAction(battle, actor.id, content), content, rng, 1);
  }
  const beforeXp = state.monsters[a.id]!.xp;
  const settled = settleBattleProgression(state, battle, content).state;
  assert.ok(settled.monsters[a.id]!.xp >= beforeXp);
  assert.equal(settled.monsters[a.id]!.wins + settled.monsters[a.id]!.losses, 1);
  assert.equal(settled.player.reputation, battle.result === "player-victory" ? 1 : 0);
});
