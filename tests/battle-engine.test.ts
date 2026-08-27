import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, applyBattleAction, byId, chooseAiAction, content, createBattle, createMonster, nextActor, validActions,
} from "../src/index.ts";

function monsters() {
  const rng = new SeededRandom(40);
  const mossveil = createMonster(byId(content.species, "mossveil"), rng, { day: 1, level: 8 });
  const voltgrazer = createMonster(byId(content.species, "voltgrazer"), rng, { day: 1, level: 8 });
  return { mossveil, voltgrazer };
}

test("the faster living combatant acts first", () => {
  const { mossveil, voltgrazer } = monsters();
  const battle = createBattle([mossveil], [voltgrazer], content);
  assert.equal(nextActor(battle)?.id, voltgrazer.id);
});

test("skills spend energy, enter cooldown, and emit damage events", () => {
  const { mossveil } = monsters();
  const opponent = { ...mossveil, id: `${mossveil.id}_enemy` };
  let battle = createBattle([mossveil], [opponent], content);
  const actor = nextActor(battle)!;
  const skill = validActions(battle, actor.id, content).find((action) => action.kind === "skill" && action.skillId === "spore-veil")!;
  battle = applyBattleAction(battle, skill, content, new SeededRandom(2), 1);
  const updated = battle.units.find(({ id }) => id === actor.id)!;
  assert.equal(updated.energy, updated.maxEnergy - 30);
  assert.equal(updated.cooldowns["spore-veil"], 2);
  assert.equal(battle.events.some(({ type }) => type === "battle.damage"), true);
});

test("AI selects valid actions and battle reaches a deterministic result", () => {
  const { mossveil, voltgrazer } = monsters();
  let battle = createBattle([mossveil], [voltgrazer], content);
  const rng = new SeededRandom(5);
  for (let turns = 0; battle.result === "ongoing" && turns < 100; turns++) {
    const actor = nextActor(battle)!;
    battle = applyBattleAction(battle, chooseAiAction(battle, actor.id, content), content, rng, 1);
  }
  assert.notEqual(battle.result, "ongoing");
  assert.equal(battle.events.at(-1)?.type, "battle.finished");
});

test("a team battle continues until every monster on one side is knocked out", () => {
  const { mossveil, voltgrazer } = monsters();
  const second = { ...mossveil, id: `${mossveil.id}_second` };
  let battle = createBattle([mossveil, second], [voltgrazer], content);
  const rng = new SeededRandom(8);
  for (let turns = 0; battle.result === "ongoing" && turns < 150; turns++) {
    const actor = nextActor(battle)!;
    battle = applyBattleAction(battle, chooseAiAction(battle, actor.id, content), content, rng, 1);
  }
  assert.equal(battle.result, "player-victory");
});

test("support skills create shields that absorb later damage", () => {
  const { mossveil, voltgrazer } = monsters();
  let battle = createBattle([voltgrazer], [mossveil], content);
  const shieldAction = validActions(battle, voltgrazer.id, content).find((action) => action.kind === "skill" && action.skillId === "grounding-hum")!;
  battle = applyBattleAction(battle, shieldAction, content, new SeededRandom(1), 1);
  const shieldBefore = battle.units.find(({ id }) => id === voltgrazer.id)!.shield;
  assert.ok(shieldBefore > 0);
  while (nextActor(battle)!.side === "player") {
    const player = nextActor(battle)!;
    battle = applyBattleAction(battle, validActions(battle, player.id, content).find(({ kind }) => kind === "basic")!, content, new SeededRandom(2), 1);
  }
  const enemy = nextActor(battle)!;
  battle = applyBattleAction(battle, { kind: "basic", actorId: enemy.id, targetId: voltgrazer.id }, content, new SeededRandom(2), 1);
  const player = battle.units.find(({ id }) => id === voltgrazer.id)!;
  assert.ok(player.shield < shieldBefore);
});

test("stackable statuses tick after the affected monster acts and expire", () => {
  const { mossveil } = monsters();
  const enemy = { ...mossveil, id: `${mossveil.id}_poisoned` };
  let battle = createBattle([mossveil], [enemy], content);
  const poison = validActions(battle, mossveil.id, content).find((action) => action.kind === "skill" && action.skillId === "spore-veil")!;
  battle = applyBattleAction(battle, poison, content, new SeededRandom(1), 1);
  assert.equal(battle.units.find(({ id }) => id === enemy.id)!.statuses[0]?.id, "poison");
  const enemyAction = chooseAiAction(battle, enemy.id, content);
  battle = applyBattleAction(battle, enemyAction, content, new SeededRandom(2), 1);
  assert.equal(battle.events.some(({ type }) => type === "battle.status-damage"), true);
  assert.equal(battle.units.find(({ id }) => id === enemy.id)!.statuses[0]?.remainingActions, 2);
});

test("switching consumes an action and exchanges an active monster with a reserve", () => {
  const { mossveil, voltgrazer } = monsters();
  const reserve = { ...mossveil, id: `${mossveil.id}_reserve` };
  let battle = createBattle([voltgrazer, mossveil, { ...mossveil, id: `${mossveil.id}_third` }, reserve], [{ ...mossveil, id: `${mossveil.id}_enemy` }], content);
  const action = validActions(battle, voltgrazer.id, content).find((candidate) => candidate.kind === "switch" && candidate.targetId === reserve.id)!;
  battle = applyBattleAction(battle, action, content, new SeededRandom(3), 1);
  assert.equal(battle.units.find(({ id }) => id === voltgrazer.id)?.active, false);
  assert.equal(battle.units.find(({ id }) => id === reserve.id)?.active, true);
  assert.equal(battle.events.at(-1)?.type, "battle.switched");
});
