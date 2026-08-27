import assert from "node:assert/strict";
import test from "node:test";
import { SeededRandom, addMonsterToPlayer, advanceWorldDay, byId, challengeTrainer, content, createMonster, createNewGame, estimateTrainerDifficulty, initializeTrainers, trainerRelationshipTier } from "../src/index.ts";

function gameWithTrainers() {
  let state = createNewGame("Pia", 601, content.contentVersion);
  const starter = createMonster(byId(content.species, "mossveil"), new SeededRandom(601), { day: 1, level: 7 });
  state = addMonsterToPlayer(state, starter, true);
  return initializeTrainers(state, content, new SeededRandom(602));
}

test("trainer initialization creates persistent definition-owned rosters", () => {
  const state = gameWithTrainers();
  assert.deepEqual(Object.keys(state.trainers).sort(), ["friend-tessa", "rival-rowan"]);
  for (const trainer of Object.values(state.trainers)) {
    assert.ok(trainer.monsterIds.length > 0);
    for (const id of trainer.monsterIds) assert.equal(state.monsters[id]?.ownerId, trainer.definitionId);
  }
  const repeated = initializeTrainers(state, content, new SeededRandom(999));
  assert.deepEqual(repeated.trainers, state.trainers);
});

test("trainers gain persistent XP as world days advance", () => {
  const state = gameWithTrainers();
  const monsterId = state.trainers["rival-rowan"]!.monsterIds[0]!;
  const before = state.monsters[monsterId]!;
  const advanced = advanceWorldDay(state, content).state;
  const after = advanced.monsters[monsterId]!;
  assert.ok(after.xp > before.xp || after.level > before.level);
});

test("trainer challenges update relationships, records, conditions, and daily limits", () => {
  const state = gameWithTrainers();
  const result = challengeTrainer(state, "friend-tessa", content, new SeededRandom(603));
  const trainer = result.state.trainers["friend-tessa"]!;
  assert.ok(trainer.relationship >= 1);
  assert.equal(trainer.wins + trainer.losses, 1);
  assert.equal(trainer.lastChallengeDay, state.world.day);
  assert.ok(result.turns > 0);
  assert.throws(() => challengeTrainer(result.state, "friend-tessa", content, new SeededRandom(604)), /already battled/);
});

test("trainer relationship and difficulty summaries use centralized thresholds", () => {
  const state = gameWithTrainers();
  assert.equal(trainerRelationshipTier(0), "new");
  assert.equal(trainerRelationshipTier(10), "trusted");
  assert.ok(["easy", "even", "hard", "severe"].includes(estimateTrainerDifficulty(state, "rival-rowan")));
});
