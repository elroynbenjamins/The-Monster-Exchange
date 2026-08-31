import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { SeededRandom } from "../src/core/random.ts";
import { applyBattleAction, createBattle, type BattleState } from "../src/systems/battle-engine.ts";
import { createMonster } from "../src/systems/monsters.ts";

const make = (speciesId: string, seed: number, skillIds?: readonly string[]) => {
  const species = content.species.find(({ id }) => id === speciesId)!;
  const monster = createMonster(species, new SeededRandom(seed), { day: 1, level: 30 });
  return skillIds ? { ...monster, knownSkillIds: skillIds, equippedSkillIds: skillIds } : monster;
};
const forceNext = (state: BattleState, id: string): BattleState => ({ ...state, units: state.units.map((unit) => ({ ...unit, readyAt: unit.id === id ? 0 : 100 })) });

function switchBattle(reserveSpeciesId: string) {
  const outgoing = make("mossveil", 1);
  const reserve = make(reserveSpeciesId, 4, ["type-ghost-advanced", "type-dark-basic", "type-psychic-advanced"]);
  const state = createBattle([outgoing, make("cindlet", 2), make("rifflin", 3), reserve], [make("pebblit", 5)], content);
  return { state: forceNext(state, outgoing.id), outgoing, reserve };
}

test("all 221 approved passives are canonical runtime definitions", () => {
  assert.equal(content.passives.length, 221);
  assert.equal(new Set(content.passives.map(({ sourceId }) => sourceId)).size, 221);
  for (const species of content.species) {
    const passive = content.passives.find(({ id }) => id === species.passiveId);
    assert.ok(passive?.effectText, `${species.name} passive is missing`);
    assert.equal(passive.sourceId, species.sourcePassiveId);
  }
});

test("switch Energy and Alloymiri shield effects trigger only once per battle", () => {
  for (const [speciesId, expectedEnergy, expectsShield] of [["simiri", 8, false], ["alloymiri", 0, true]] as const) {
    let { state, outgoing, reserve } = switchBattle(speciesId);
    state = { ...state, units: state.units.map((unit) => unit.id === reserve.id ? { ...unit, energy: 10 } : unit) };
    state = applyBattleAction(state, { kind: "switch", actorId: outgoing.id, targetId: reserve.id }, content, new SeededRandom(20));
    let entered = state.units.find(({ id }) => id === reserve.id)!;
    assert.equal(entered.energy, 10 + expectedEnergy);
    assert.equal(entered.passiveTriggerCounts["switch-in"], 1);
    assert.equal(entered.shield > 0, expectsShield);

    state = forceNext(state, reserve.id);
    state = applyBattleAction(state, { kind: "switch", actorId: reserve.id, targetId: outgoing.id }, content, new SeededRandom(21));
    state = { ...forceNext(state, outgoing.id), units: state.units.map((unit) => unit.id === reserve.id ? { ...unit, energy: 10, shield: 0 } : unit) };
    state = applyBattleAction(state, { kind: "switch", actorId: outgoing.id, targetId: reserve.id }, content, new SeededRandom(22));
    entered = state.units.find(({ id }) => id === reserve.id)!;
    assert.equal(entered.energy, 10);
    assert.equal(entered.shield, 0);
    assert.equal(entered.passiveTriggerCounts["switch-in"], 1);
  }
});

test("Omeniri's switch discount is consumed once without recursive Energy generation", () => {
  let { state, outgoing, reserve } = switchBattle("omeniri");
  state = applyBattleAction(state, { kind: "switch", actorId: outgoing.id, targetId: reserve.id }, content, new SeededRandom(30));
  const enemy = state.units.find(({ side }) => side === "enemy")!;
  state = { ...forceNext(state, reserve.id), units: state.units.map((unit) => unit.id === reserve.id ? { ...unit, energy: 50 } : unit) };
  state = applyBattleAction(state, { kind: "skill", actorId: reserve.id, skillId: "type-ghost-advanced", targetId: enemy.id }, content, new SeededRandom(31));
  const omeniri = state.units.find(({ id }) => id === reserve.id)!;
  assert.equal(omeniri.energy, 16);
  assert.equal(omeniri.switchEffectArmed, false);
  assert.equal(omeniri.passiveTriggerCounts["switch-in"], 1);
});

test("Oraciri prediction applies to exactly the target's next damaging action", () => {
  let { state, outgoing, reserve } = switchBattle("oraciri");
  state = applyBattleAction(state, { kind: "switch", actorId: outgoing.id, targetId: reserve.id }, content, new SeededRandom(40));
  const enemy = state.units.find(({ side }) => side === "enemy")!;
  state = forceNext(state, reserve.id);
  state = applyBattleAction(state, { kind: "skill", actorId: reserve.id, skillId: "type-psychic-advanced", targetId: enemy.id }, content, new SeededRandom(41));
  assert.equal(state.units.find(({ id }) => id === enemy.id)?.nextDamageDealtMultiplier, 0.92);
  state = forceNext(state, enemy.id);
  state = applyBattleAction(state, { kind: "basic", actorId: enemy.id, targetId: reserve.id }, content, new SeededRandom(42));
  assert.equal(state.units.find(({ id }) => id === enemy.id)?.nextDamageDealtMultiplier, undefined);
});

test("Flowstate timeline gains are bounded to one trigger per incoming action", () => {
  const attacker = make("cindlet", 50);
  const rifflin = make("rifflin", 51);
  let state = createBattle([attacker], [rifflin], content);
  state = forceNext(state, attacker.id);
  const before = state.units.find(({ id }) => id === rifflin.id)!.readyAt;
  state = applyBattleAction(state, { kind: "basic", actorId: attacker.id, targetId: rifflin.id }, content, new SeededRandom(52));
  const after = state.units.find(({ id }) => id === rifflin.id)!;
  assert.ok(after.readyAt < before);
  assert.equal(after.passiveTriggerCounts["damage-timeline-0"], 1);
  assert.equal(state.events.filter(({ type, payload }) => type === "battle.passive-triggered" && payload.monsterId === rifflin.id).length, 1);
});
