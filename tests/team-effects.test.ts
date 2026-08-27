import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, applyBattleAction, byId, content, createBattle, createMonster, evaluateTeamSynergies, validActions,
} from "../src/index.ts";

function monster(speciesId: string, seed: number, idSuffix = "") {
  const created = createMonster(byId(content.species, speciesId), new SeededRandom(seed), { day: 1, level: 10 });
  return idSuffix ? { ...created, id: `${created.id}_${idSuffix}` } : created;
}

test("synergies use only active members and expose readable IDs", () => {
  const mossA = monster("mossveil", 1, "a");
  const mossB = monster("mossveil", 2, "b");
  const active = evaluateTeamSynergies([mossA, mossB], content.species, content.synergies);
  assert.ok(active.synergyIds.includes("toxic-canopy"));
  const reserveOnly = evaluateTeamSynergies([mossA], content.species, content.synergies);
  assert.equal(reserveOnly.synergyIds.includes("toxic-canopy"), false);
});

test("stacked passive and synergy stat bonuses are reflected in battle units", () => {
  const mossA = monster("mossveil", 3, "a");
  const mossB = monster("mossveil", 4, "b");
  const enemy = monster("voltgrazer", 5, "enemy");
  const battle = createBattle([mossA, mossB], [enemy], content);
  const unit = battle.units.find(({ id }) => id === mossA.id)!;
  assert.ok(unit.defense > unit.baseDefense);
  assert.ok(battle.activeSynergies.player.includes("toxic-canopy"));
  assert.ok(unit.shield > 0);
  assert.ok(battle.events.some(({ type }) => type === "battle.passive-activated"));
});

test("team synergy stat stacking is capped at fifteen percent", () => {
  const mossA = monster("mossveil", 6, "a");
  const mossB = monster("mossveil", 7, "b");
  const effects = evaluateTeamSynergies([mossA, mossB], content.species, [
    { id: "one", name: "One", minimumMembers: 2, requiredTypes: { grass: 1 }, statModifiers: { attack: 0.1 }, displayText: "" },
    { id: "two", name: "Two", minimumMembers: 2, requiredTypes: { poison: 1 }, statModifiers: { attack: 0.1 }, displayText: "" },
  ]);
  assert.equal(effects.statModifiers.attack, 0.15);
});

test("Wet and Electric trigger a data-visible combat combination", () => {
  const volt = monster("voltgrazer", 8, "player");
  const moss = monster("mossveil", 9, "enemy");
  let battle = createBattle([volt], [moss], content);
  battle = { ...battle, units: battle.units.map((unit) => unit.id === moss.id ? { ...unit, statuses: [{ id: "wet", remainingActions: 2, stacks: 1 }] } : unit) };
  const action = validActions(battle, volt.id, content).find((candidate) => candidate.kind === "skill" && candidate.skillId === "static-prance")!;
  battle = applyBattleAction(battle, action, content, new SeededRandom(1), 1);
  assert.ok(battle.events.some((event) => event.type === "battle.combo-triggered" && (event.payload as { comboId: string }).comboId === "wet-electric"));
});
