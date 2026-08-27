import { access } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join } from "node:path";
import {
  EXPEDITION_APPROACHES, SeededRandom, activeTeamCaptureBonus, addMonsterToPlayer, appraiseMonster, attemptCapture, byId, changeInventory, content, createMonster,
  advanceWorldDay, applyBattleAction, calculateExpeditionPreparation, chooseAiAction, claimBreedingJob, constructBuilding, createBattle, createNewGame, depositHomebaseResource, finishExpedition, generateWildEncounter, listPlayerMonster, loadGame, nextActor, resolveExpeditionNode,
  equipMonsterItems, recordSpeciesResearch, saveGame, settleBattleProgression, startBreeding, startExpeditionRun, upgradeBuilding, type GameState,
  validActions, type BattleAction, type ExpeditionApproach, type WildEncounter,
} from "./index.ts";

const savePath = join(process.cwd(), ".local", "save.json");
const ui = createInterface({ input, output });

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function askNumber(prompt: string, min: number, max: number): Promise<number> {
  while (true) {
    const value = Number.parseInt(await ui.question(prompt), 10);
    if (Number.isInteger(value) && value >= min && value <= max) return value;
    console.log(`Choose a number from ${min} to ${max}.`);
  }
}

function roster(state: GameState): void {
  console.log("\nYour monsters");
  for (const id of state.player.monsterIds) {
    const monster = state.monsters[id]!;
    const species = byId(content.species, monster.speciesId);
    const condition = state.conditions[id] ?? { hpRatio: 1, stamina: 100 };
    const equipment = (monster.equipmentIds ?? []).map((itemId) => byId(content.equipment, itemId).name).join(", ") || "none";
    const research = state.player.researchBySpecies[species.id] ?? { level: 0, points: 0 };
    console.log(`- ${monster.nickname ?? species.name} · Lv.${monster.level} · Potential ${monster.potential} · HP ${Math.round(condition.hpRatio * 100)}% · Stamina ${condition.stamina} · Gear ${equipment} · Research Lv.${research.level}`);
  }
}

async function newGame(): Promise<GameState> {
  console.log("\nTHE MONSTER EXCHANGE — Greenreach Field Office\n");
  const name = await ui.question("Manager name: ");
  let state = createNewGame(name, Date.now() & 0xffff_ffff, content.contentVersion);
  const choices = [byId(content.species, "mossveil"), byId(content.species, "voltgrazer")];
  console.log("\nChoose your first partner:");
  choices.forEach((species, index) => console.log(`${index + 1}. ${species.name} — ${species.types.join(" / ")} · ${species.tags.join(", ")}`));
  const selection = await askNumber("> ", 1, choices.length);
  const starter = createMonster(choices[selection - 1]!, new SeededRandom(state.world.seed), { day: 1, level: 5, ownerId: state.player.id, qualityBias: 0.12 });
  state = addMonsterToPlayer(state, starter, true);
  await saveGame(savePath, state);
  return state;
}

async function captureAfterEncounter(state: GameState, rng: SeededRandom, encounter: WildEncounter, remainingHp: number): Promise<GameState> {
  console.log(`\nThe encounter included a Lv.${encounter.monster.level} ${encounter.species.name}, now at ${Math.round(remainingHp * 100)}% HP.`);
  console.log(encounter.exactPotential === undefined ? `Estimated Potential: ${encounter.estimatedPotential[0]}–${encounter.estimatedPotential[1]}` : `Known Potential: ${encounter.exactPotential}`);
  if (encounter.revealedTraitIds.length) console.log(`Observed traits: ${encounter.revealedTraitIds.map((id) => byId(content.traits, id).name).join(", ") || "none"}`);
  let next = { ...state, world: { ...state.world, nextRandomOffset: state.world.nextRandomOffset + 1 } };
  if ((next.player.inventory["field-capsule"] ?? 0) < 1) { console.log("You have no Field Capsules."); return next; }
  console.log("1. Use a Field Capsule  2. Leave it behind");
  if (await askNumber("> ", 1, 2) === 1) {
    next = changeInventory(next, "field-capsule", -1);
    const result = attemptCapture(encounter, remainingHp, rng, activeTeamCaptureBonus(next, content));
    if (result.captured) {
      next = addMonsterToPlayer(next, encounter.monster, next.player.activeTeamIds.length < 5);
      next = recordSpeciesResearch(next, encounter.species.id, 8);
      console.log(`Captured ${encounter.species.name}! Its true Potential is ${encounter.monster.potential}.`);
    } else console.log(`${encounter.species.name} escaped the capsule.`);
  }
  return next;
}

function actionLabel(action: BattleAction, state: ReturnType<typeof createBattle>): string {
  const target = action.targetId ? state.units.find(({ id }) => id === action.targetId) : undefined;
  if (action.kind === "basic") return `Basic attack → ${target?.species.name}`;
  if (action.kind === "switch") return `Switch → ${target?.species.name}`;
  if (action.kind === "wait") return "Unable to act (status effect)";
  const skill = byId(content.skills, action.skillId);
  return `${skill.name} (${skill.energyCost} Energy)${target ? ` → ${target.species.name}` : ""}`;
}

async function wildBattle(state: GameState, rng: SeededRandom): Promise<{ state: GameState; encounter: WildEncounter; won: boolean; enemyHpRatio: number }> {
  const zone = byId(content.zones, state.activeExpedition!.route.zoneId);
  const researchLevels = Object.fromEntries(Object.entries(state.player.researchBySpecies).map(([id, research]) => [id, research.level]));
  const encounter = generateWildEncounter(zone, content.species, rng, state.world.day, researchLevels);
  const playerMonsters = state.activeExpedition!.route.teamIds.slice(0, 3).map((id) => state.monsters[id]!).filter(Boolean);
  let battle = createBattle(playerMonsters, [encounter.monster], content, Object.fromEntries(playerMonsters.map((monster) => [monster.id, state.conditions[monster.id]?.hpRatio ?? 1])));
  console.log(`\nBattle: ${encounter.species.name} Lv.${encounter.monster.level}`);
  const synergies = battle.activeSynergies.player.map((id) => byId(content.synergies, id).name);
  if (synergies.length) console.log(`Active synergies: ${synergies.join(", ")}`);
  while (battle.result === "ongoing") {
    const actor = nextActor(battle)!;
    let action: BattleAction;
    if (actor.side === "enemy") action = chooseAiAction(battle, actor.id, content);
    else {
      const actions = validActions(battle, actor.id, content);
      console.log(`\n${actor.species.name}: ${actor.hp}/${actor.maxHp} HP · ${actor.energy} Energy`);
      actions.forEach((candidate, index) => console.log(`${index + 1}. ${actionLabel(candidate, battle)}`));
      action = actions[(await askNumber("> ", 1, actions.length)) - 1]!;
    }
    const previousEvents = battle.events.length;
    battle = applyBattleAction(battle, action, content, rng, state.world.day);
    for (const event of battle.events.slice(previousEvents)) {
      if (event.type === "battle.damage") {
        const payload = event.payload as { targetId: string; damage: number; multiplier: number; remainingHp: number };
        const target = battle.units.find(({ id }) => id === payload.targetId)!;
        const effectiveness = payload.multiplier > 1 ? " Super effective!" : payload.multiplier < 1 ? " Resisted." : "";
        console.log(`${target.species.name} takes ${payload.damage} damage.${effectiveness}`);
      }
    }
  }
  const conditions = { ...state.conditions };
  for (const unit of battle.units.filter(({ side }) => side === "player")) {
    const current = conditions[unit.id] ?? { hpRatio: 1, stamina: 100 };
    conditions[unit.id] = { ...current, hpRatio: unit.hp / unit.maxHp };
  }
  const enemy = battle.units.find(({ side }) => side === "enemy")!;
  const progression = settleBattleProgression({ ...state, conditions }, battle, content);
  const progressedState = battle.result === "player-victory" ? recordSpeciesResearch(progression.state, encounter.species.id, 3) : progression.state;
  console.log(battle.result === "player-victory" ? "Victory!" : "Your expedition team was defeated.");
  if (battle.result === "player-victory") console.log(`Participating monsters gain ${progression.xpAwarded} XP; reserves gain 25%.`);
  return { state: progressedState, encounter, won: battle.result === "player-victory", enemyHpRatio: enemy.hp / enemy.maxHp };
}

async function expedition(state: GameState): Promise<GameState> {
  const rng = new SeededRandom(state.world.seed + state.world.nextRandomOffset + 101);
  const zone = byId(content.zones, state.activeExpedition?.route.zoneId ?? state.world.unlockedZoneIds[0]!);
  let next = state.activeExpedition ? state : startExpeditionRun(state, zone, rng);
  console.log(next.activeExpedition === state.activeExpedition ? "\nResuming expedition." : "\nThe team enters Greenreach Meadow.");
  const preparation = calculateExpeditionPreparation(next, zone, content.species, content.hazards);
  if (preparation.protectedHazardIds.length) {
    const names = preparation.protectedHazardIds.map((id) => byId(content.hazards, id).name);
    console.log(`Team preparation protects against ${names.join(", ")} and reduces field risk by ${Math.round(preparation.riskReduction * 100)}%.`);
  }
  while (next.activeExpedition) {
    const route = next.activeExpedition.route;
    if (route.status === "completed") {
      next = finishExpedition(next);
      console.log("Expedition complete. All secured rewards were added to your inventory.");
      break;
    }
    if (route.status === "abandoned") {
      next = finishExpedition(next, true);
      console.log("The team was defeated and evacuated with 60% of its secured rewards.");
      break;
    }
    const node = route.nodes[route.currentNode]!;
    console.log(`\nRoute ${route.currentNode + 1}/${route.nodes.length}: ${node.type}`);
    console.log("1. Resolve node  2. Retreat with 60% rewards  3. Save and return to office");
    const choice = await askNumber("> ", 1, 3);
    if (choice === 2) { next = finishExpedition(next, true); console.log("The team retreats safely."); break; }
    if (choice === 3) break;
    if (node.type === "encounter") {
      const battle = await wildBattle(next, rng);
      next = battle.state;
      if (!battle.won) {
        next = { ...next, activeExpedition: { ...next.activeExpedition!, route: { ...next.activeExpedition!.route, status: "abandoned" } } };
        continue;
      }
      next = await captureAfterEncounter(next, rng, battle.encounter, Math.max(0.05, battle.enemyHpRatio));
    }
    let approach: ExpeditionApproach = "balanced";
    if (["resource", "choice", "discovery"].includes(node.type)) {
      console.log("\nChoose an approach:");
      EXPEDITION_APPROACHES.forEach((option, index) => console.log(`${index + 1}. ${option.name} — ${option.description}`));
      approach = EXPEDITION_APPROACHES[(await askNumber("> ", 1, EXPEDITION_APPROACHES.length)) - 1]!.id;
    }
    const outcome = resolveExpeditionNode(next, rng, content.equipment, approach, preparation.riskReduction);
    next = outcome.state;
    console.log(outcome.event.payload.message);
    await saveGame(savePath, next);
  }
  return next;
}

async function sellMonster(state: GameState): Promise<GameState> {
  if (state.player.monsterIds.length <= 1) { console.log("You need at least two monsters before listing one."); return state; }
  roster(state);
  console.log("\nChoose a monster to list:");
  state.player.monsterIds.forEach((id, index) => console.log(`${index + 1}. ${byId(content.species, state.monsters[id]!.speciesId).name}`));
  const selectedId = state.player.monsterIds[(await askNumber("> ", 1, state.player.monsterIds.length)) - 1]!;
  const monster = state.monsters[selectedId]!;
  const species = byId(content.species, monster.speciesId);
  const suggested = appraiseMonster(monster, species, content.traits, state.market.indices[species.id]);
  console.log(`Suggested appraisal: ${suggested} Crowns.`);
  const price = await askNumber("Asking price: ", 1, 1000000);
  try {
    return listPlayerMonster(state, selectedId, price, 3, new SeededRandom(state.world.seed + state.world.nextRandomOffset + 500));
  } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

async function manageEquipment(state: GameState): Promise<GameState> {
  if (state.activeExpedition) { console.log("Equipment cannot change during an expedition."); return state; }
  roster(state);
  console.log("\nChoose a monster:");
  state.player.monsterIds.forEach((id, index) => console.log(`${index + 1}. ${byId(content.species, state.monsters[id]!.speciesId).name}`));
  const monsterId = state.player.monsterIds[(await askNumber("> ", 1, state.player.monsterIds.length)) - 1]!;
  console.log("1. Unequip all  2. Equip one item  3. Equip two items  4. Back");
  const action = await askNumber("> ", 1, 4);
  if (action === 4) return state;
  if (action === 1) return equipMonsterItems(state, monsterId, [], content);
  const monster = state.monsters[monsterId]!;
  const available = content.equipment.filter(({ id }) => (state.player.inventory[id] ?? 0) > 0 || (monster.equipmentIds ?? []).includes(id));
  if (available.length < action - 1) { console.log("You do not have enough different equipment items."); return state; }
  available.forEach((item, index) => console.log(`${index + 1}. ${item.name} — ${item.description}`));
  const first = available[(await askNumber("First item: ", 1, available.length)) - 1]!.id;
  if (action === 2) return equipMonsterItems(state, monsterId, [first], content);
  const secondOptions = available.filter(({ id }) => id !== first);
  secondOptions.forEach((item, index) => console.log(`${index + 1}. ${item.name}`));
  const second = secondOptions[(await askNumber("Second item: ", 1, secondOptions.length)) - 1]!.id;
  return equipMonsterItems(state, monsterId, [first, second], content);
}

async function manageBreeding(state: GameState): Promise<GameState> {
  const ready = state.breedingJobs.filter(({ status }) => status === "ready");
  if (ready.length) {
    console.log(`${ready.length} offspring ${ready.length === 1 ? "is" : "are"} ready.`);
    console.log("1. Claim first offspring  2. Start another pairing  3. Back");
    const action = await askNumber("> ", 1, 3);
    if (action === 1) return claimBreedingJob(state, ready[0]!.id, content, new SeededRandom(state.world.seed + state.world.nextRandomOffset + 700));
    if (action === 3) return state;
  }
  if (state.player.monsterIds.length < 2) { console.log("Two compatible monsters are required."); return state; }
  roster(state);
  console.log("Choose the first parent, then the second.");
  const first = state.player.monsterIds[(await askNumber("First: ", 1, state.player.monsterIds.length)) - 1]!;
  const second = state.player.monsterIds[(await askNumber("Second: ", 1, state.player.monsterIds.length)) - 1]!;
  try {
    const next = startBreeding(state, [first, second], content, new SeededRandom(state.world.seed + state.world.nextRandomOffset + 701));
    console.log("Breeding started. The Nest will report when the offspring is ready.");
    return next;
  } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

async function manageHomebase(state: GameState): Promise<GameState> {
  console.log("\nHomebase");
  if (!state.homebase.buildings.length) console.log("No facilities built yet.");
  for (const building of state.homebase.buildings) console.log(`- ${byId(content.buildings, building.buildingId).name} Lv.${building.level} · ${building.status}`);
  console.log(`Stores: ${Object.entries(state.homebase.resources).map(([id, amount]) => `${amount} ${id}`).join(", ")}`);
  console.log("1. Construct facility  2. Upgrade facility  3. Deposit resources  4. Breeding Nest  5. Back");
  const action = await askNumber("> ", 1, 5);
  try {
    if (action === 1) {
      const available = content.buildings.filter((definition) => !state.homebase.buildings.some(({ buildingId }) => buildingId === definition.id));
      if (!available.length) { console.log("Every available facility has been built."); return state; }
      available.forEach((building, index) => console.log(`${index + 1}. ${building.name} — ${Object.entries(building.baseCost).map(([id, amount]) => `${amount} ${id}`).join(", ")}`));
      return constructBuilding(state, available[(await askNumber("> ", 1, available.length)) - 1]!);
    }
    if (action === 2) {
      const available = state.homebase.buildings.filter(({ status, level, buildingId }) => status === "active" && level < byId(content.buildings, buildingId).maxLevel);
      if (!available.length) { console.log("No facility can currently be upgraded."); return state; }
      available.forEach((building, index) => console.log(`${index + 1}. ${byId(content.buildings, building.buildingId).name} Lv.${building.level}`));
      const selected = available[(await askNumber("> ", 1, available.length)) - 1]!;
      return upgradeBuilding(state, byId(content.buildings, selected.buildingId));
    }
    if (action === 3) {
      const resources = ["timber", "stone", "herbs"];
      resources.forEach((id, index) => console.log(`${index + 1}. ${id} (${state.player.inventory[id] ?? 0} carried)`));
      const id = resources[(await askNumber("> ", 1, resources.length)) - 1]!;
      return depositHomebaseResource(state, id, await askNumber("Amount: ", 1, state.player.inventory[id] ?? 1));
    }
    if (action === 4) return manageBreeding(state);
  } catch (error) { console.log(error instanceof Error ? error.message : error); }
  return state;
}

async function run(): Promise<void> {
  let state = await exists(savePath) ? await loadGame(savePath, content.contentVersion) : await newGame();
  console.log(`\nWelcome, ${state.player.name}.`);
  while (true) {
    console.log(`\nDay ${state.world.day} · ${state.player.crowns} Crowns · ${state.player.inventory["field-capsule"] ?? 0} Capsules`);
    console.log(`Season: ${state.world.season} · Greenreach weather: ${state.world.weatherByRegion.greenreach ?? "unknown"}`);
    console.log("1. Expedition  2. View roster  3. End day  4. Sell a monster  5. Homebase  6. Equipment  7. Save and quit");
    const action = await askNumber("> ", 1, 7);
    if (action === 1) state = await expedition(state);
    if (action === 2) roster(state);
    if (action === 3) {
      try {
        const result = advanceWorldDay(state, content);
        state = result.state;
        for (const event of result.events) if (event.type === "market.player-listing-sold") console.log("One of your marketplace listings sold.");
        console.log("The world advances: teams recover, construction progresses, and the market refreshes.");
      }
      catch (error) { console.log(error instanceof Error ? error.message : error); }
    }
    if (action === 4) state = await sellMonster(state);
    if (action === 5) state = await manageHomebase(state);
    if (action === 6) state = await manageEquipment(state);
    await saveGame(savePath, state);
    if (action === 7) break;
  }
}

try { await run(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; } finally { ui.close(); }
