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
  const skill = validActions(battle, actor.id, content.skills).find((action) => action.kind === "skill" && action.skillId === "spore-veil")!;
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
