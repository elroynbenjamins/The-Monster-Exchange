import assert from "node:assert/strict";
import test from "node:test";
import {
  SeededRandom, activeTeamCaptureBonus, addMonsterToPlayer, byId, calculateCombatStats, content,
  conductSpeciesStudy, createMonster, createNewGame, equipMonsterItems, gainSpeciesResearch, generateWildEncounter, recordSpeciesResearch,
  resolveExpeditionNode, startExpeditionRun,
} from "../src/index.ts";

function gameWithMonster() {
  let state = createNewGame("Ari", 41, content.contentVersion);
  const monster = createMonster(byId(content.species, "mossveil"), new SeededRandom(41), { day: 1, ownerId: state.player.id });
  state = addMonsterToPlayer(state, monster, true);
  return { state, monsterId: monster.id };
}

test("equipment moves safely between inventory and a two-slot monster loadout", () => {
  const setup = gameWithMonster();
  const base = calculateCombatStats(setup.state.monsters[setup.monsterId]!, byId(content.species, "mossveil"), content.traits, content.equipment);
  let state = equipMonsterItems(setup.state, setup.monsterId, ["training-band"], content);
  assert.equal(state.player.inventory["training-band"], 0);
  assert.deepEqual(state.monsters[setup.monsterId]!.equipmentIds, ["training-band"]);
  const equipped = calculateCombatStats(state.monsters[setup.monsterId]!, byId(content.species, "mossveil"), content.traits, content.equipment);
  assert.ok(equipped.attack > base.attack);
  state = equipMonsterItems(state, setup.monsterId, [], content);
  assert.equal(state.player.inventory["training-band"], 1);
});

test("equipment availability and slot limits are enforced", () => {
  const { state, monsterId } = gameWithMonster();
  assert.throws(() => equipMonsterItems(state, monsterId, ["capture-lens"], content), /not available/);
  assert.throws(() => equipMonsterItems(state, monsterId, ["training-band", "trail-harness", "vital-charm"], content), /two different/);
});

test("trail equipment reduces its wearer's expedition stamina cost", () => {
  const setup = gameWithMonster();
  const zone = byId(content.zones, "greenreach-meadow");
  const plain = startExpeditionRun(setup.state, zone, new SeededRandom(9), 1);
  const gearedBase = equipMonsterItems(setup.state, setup.monsterId, ["trail-harness"], content);
  const geared = startExpeditionRun(gearedBase, zone, new SeededRandom(9), 1);
  const plainResult = resolveExpeditionNode(plain, new SeededRandom(5), content.equipment).state;
  const gearedResult = resolveExpeditionNode(geared, new SeededRandom(5), content.equipment).state;
  assert.ok(gearedResult.conditions[setup.monsterId]!.stamina > plainResult.conditions[setup.monsterId]!.stamina);
});

test("species research levels unlock increasingly exact encounter knowledge", () => {
  const setup = gameWithMonster();
  const researched = recordSpeciesResearch(setup.state, "mossveil", 170);
  assert.deepEqual(researched.player.researchBySpecies.mossveil, { level: 5, points: 170 });
  const zone = byId(content.zones, "greenreach-meadow");
  const encounter = generateWildEncounter(zone, content.species, new SeededRandom(4), 1, Object.fromEntries(content.species.map(({ id }) => [id, 5])));
  assert.equal(encounter.exactPotential, encounter.monster.potential);
  assert.deepEqual(encounter.revealedTraitIds, encounter.monster.traitIds);
});

test("capture equipment bonuses stack but remain capped", () => {
  const setup = gameWithMonster();
  const state = {
    ...setup.state,
    monsters: { ...setup.state.monsters, [setup.monsterId]: { ...setup.state.monsters[setup.monsterId]!, equipmentIds: ["capture-lens", "capture-lens", "capture-lens"] } },
  };
  assert.equal(activeTeamCaptureBonus(state, content), 0.2);
});

test("an active Research Lab boosts field gains and converts notes into species knowledge", () => {
  const setup = gameWithMonster();
  let state = {
    ...setup.state,
    homebase: { ...setup.state.homebase, buildings: [{ buildingId: "research-lab", level: 2, status: "active" as const }] },
    player: { ...setup.state.player, inventory: { ...setup.state.player.inventory, "research-notes": 2 } },
  };
  state = gainSpeciesResearch(state, "mossveil", 8);
  assert.equal(state.player.researchBySpecies.mossveil?.points, 11);
  state = conductSpeciesStudy(state, "mossveil", 2, content);
  assert.equal(state.player.inventory["research-notes"], 0);
  assert.equal(state.player.researchBySpecies.mossveil?.points, 37);
  assert.equal(state.player.researchBySpecies.mossveil?.level, 2);
});

test("studies require an active lab, notes, and prior species knowledge", () => {
  const setup = gameWithMonster();
  const withNotes = { ...setup.state, player: { ...setup.state.player, inventory: { ...setup.state.player.inventory, "research-notes": 1 } } };
  assert.throws(() => conductSpeciesStudy(withNotes, "mossveil", 1, content), /Research Lab/);
  const withLab = { ...withNotes, homebase: { ...withNotes.homebase, buildings: [{ buildingId: "research-lab", level: 1, status: "active" as const }] } };
  assert.throws(() => conductSpeciesStudy(withLab, "voltgrazer", 1, content), /Observe or own/);
});
