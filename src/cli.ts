import { access } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join } from "node:path";
import {
  EXPEDITION_APPROACHES, STARTER_SPECIES_IDS, SeededRandom, activeTeamCaptureBonus, addMonsterToPlayer, appraiseMonster, attemptCapture, byId, changeInventory, content, createMonster,
  abandonContract, acceptContract, advanceWorldDay, applyBattleAction, availableRecipes, browseMarketListings, buyListing, calculateExpeditionPreparation, challengeTrainer, chooseAiAction, claimBreedingJob, claimContract, completedContractNames, conductSpeciesStudy, constructBuilding, contractProgressPercent, craftRecipe, createBattle, createNewGame, depositHomebaseResource, estimateTrainerDifficulty, evolveOwnedMonster, finishExpedition, gainSpeciesResearch, generateBossEncounter, generateWildEncounter, initializeTrainers, listPlayerMonster, listingValueLabel, loadGame, maximumCraftableQuantity, nextActor, provideFieldCare, recordContractProgress, renameOwnedMonster, resolveExpeditionNode, trainerRelationshipTier,
  availablePlayerRoutes, cityServices, enterMajorCity, equipMonsterItems, equipMonsterSkills, leaveCity, majorCityForRegion, researchLabLevel, routeDestination, saveGame, selectStarter, setActiveTeam, setReducedMotion, setThemePreference, settleBattleProgression, startBreeding, startExpeditionRun, travelPlayer, upgradeBuilding, type GameState,
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

function applyContractProgress(state: GameState, event: Parameters<typeof recordContractProgress>[1]): GameState {
  const next = recordContractProgress(state, event, content);
  for (const name of completedContractNames(state, next, content)) console.log(`Contract complete: ${name}. Return to the Contract Board to claim the reward.`);
  return next;
}

function monsterDetails(state: GameState, monsterId: string): void {
  const monster = state.monsters[monsterId]!;
  const species = byId(content.species, monster.speciesId);
  const condition = state.conditions[monsterId] ?? { hpRatio: 1, stamina: 100 };
  console.log(`\n${monster.nickname ?? species.name} · ${species.name} · ${species.types.filter(Boolean).join(" / ")}`);
  console.log(`Level ${monster.level} · XP ${monster.xp} · Potential ${monster.potential} · ${monster.sex}`);
  console.log(`Genes: ${Object.entries(monster.genes).map(([id, value]) => `${id} ${value}`).join(" · ")}`);
  console.log(`Traits: ${monster.traitIds.map((id) => byId(content.traits, id).name).join(", ") || "none"}`);
  console.log(`Skills: ${monster.equippedSkillIds.map((id) => byId(content.skills, id).name).join(", ") || "none equipped"}`);
  console.log(`Record: ${monster.wins}W–${monster.losses}L · Fame ${monster.fame} · HP ${Math.round(condition.hpRatio * 100)}% · Stamina ${condition.stamina}`);
  console.log(`Lineage: generation ${monster.lineage.generation} · ${monster.lineage.parentIds.length ? monster.lineage.parentIds.join(", ") : "wild origin"}`);
}

async function manageRoster(state: GameState): Promise<GameState> {
  roster(state);
  console.log("\n1. Monster details  2. Rename monster  3. Edit active team  4. Edit skill loadout  5. Evolve monster  6. Field care  7. Back");
  const action = await askNumber("> ", 1, 7);
  if (action === 7) return state;
  const chooseMonster = async () => {
    state.player.monsterIds.forEach((id, index) => console.log(`${index + 1}. ${state.monsters[id]!.nickname ?? byId(content.species, state.monsters[id]!.speciesId).name}`));
    return state.player.monsterIds[(await askNumber("> ", 1, state.player.monsterIds.length)) - 1]!;
  };
  try {
    if (action === 1) { monsterDetails(state, await chooseMonster()); return state; }
    if (action === 2) {
      const id = await chooseMonster();
      const nickname = await ui.question("New nickname (blank restores species name): ");
      return renameOwnedMonster(state, id, nickname);
    }
    if (action === 3) {
      const count = await askNumber("Team size: ", 1, Math.min(5, state.player.monsterIds.length));
      console.log("Choose each team member in order:");
      const ids: string[] = [];
      for (let index = 0; index < count; index++) ids.push(await chooseMonster());
      return setActiveTeam(state, ids);
    }
    if (action === 4) {
      const id = await chooseMonster();
      const monster = state.monsters[id]!;
      monster.knownSkillIds.forEach((skillId, index) => console.log(`${index + 1}. ${byId(content.skills, skillId).name}`));
      console.log("1. Unequip all  2. Equip skills");
      if (await askNumber("> ", 1, 2) === 1) return equipMonsterSkills(state, id, []);
      const count = await askNumber("Number of skills: ", 1, Math.min(3, monster.knownSkillIds.length));
      const skillIds: string[] = [];
      for (let index = 0; index < count; index++) skillIds.push(monster.knownSkillIds[(await askNumber(`Skill ${index + 1}: `, 1, monster.knownSkillIds.length)) - 1]!);
      return equipMonsterSkills(state, id, skillIds);
    }
    if (action === 5) {
      const id = await chooseMonster();
      const options = content.evolutions.filter(({ fromSpeciesId }) => fromSpeciesId === state.monsters[id]!.speciesId);
      if (!options.length) { console.log("This monster has no known evolution."); return state; }
      options.forEach((evolution, index) => console.log(`${index + 1}. ${byId(content.species, evolution.toSpeciesId).name} — ${Object.entries(evolution.requirements).map(([key, value]) => `${key} ${value}`).join(", ")}`));
      return evolveOwnedMonster(state, id, options[(await askNumber("> ", 1, options.length)) - 1]!, content);
    }
    if (action === 6) {
      const id = await chooseMonster();
      return provideFieldCare(state, id, await askNumber("Herbs to use: ", 1, Math.max(1, state.player.inventory.herbs ?? 0)));
    }
  } catch (error) { console.log(error instanceof Error ? error.message : error); }
  return state;
}

async function newGame(): Promise<GameState> {
  console.log("\nTHE MONSTER EXCHANGE — Greenreach Field Office\n");
  const name = await ui.question("Manager name: ");
  let state = createNewGame(name, Date.now() & 0xffff_ffff, content.contentVersion);
  const choices = STARTER_SPECIES_IDS.map((id) => byId(content.species, id));
  console.log("\nChoose your first partner:");
  choices.forEach((species, index) => console.log(`${index + 1}. ${species.name} — ${species.types.join(" / ")} · ${species.tags.join(", ")}`));
  const selection = await askNumber("> ", 1, choices.length);
  state = selectStarter(state, choices[selection - 1]!.id, content, new SeededRandom(state.world.seed));
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
      next = gainSpeciesResearch(next, encounter.species.id, 8);
      next = applyContractProgress(next, { type: "capture-species", targetId: encounter.species.id });
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

async function wildBattle(state: GameState, rng: SeededRandom, preparedEncounter?: WildEncounter): Promise<{ state: GameState; encounter: WildEncounter; won: boolean; enemyHpRatio: number }> {
  const zone = byId(content.zones, state.activeExpedition!.route.zoneId);
  const researchLevels = Object.fromEntries(Object.entries(state.player.researchBySpecies).map(([id, research]) => [id, research.level]));
  const encounter = preparedEncounter ?? generateWildEncounter(zone, content.species, rng, state.world.day, researchLevels, {
    season: state.world.season,
    weather: state.world.weatherByRegion[zone.regionId],
    populations: state.world.populations,
  });
  const playerMonsters = state.activeExpedition!.route.teamIds.slice(0, 3).map((id) => state.monsters[id]!).filter(Boolean);
  let battle = createBattle(playerMonsters, [encounter.monster], content, Object.fromEntries(playerMonsters.map((monster) => [monster.id, state.conditions[monster.id]?.hpRatio ?? 1])));
  console.log(`\n${encounter.isBoss ? "ALPHA BATTLE" : "Battle"}: ${encounter.species.name} Lv.${encounter.monster.level}`);
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
  let progressedState = battle.result === "player-victory" ? gainSpeciesResearch(progression.state, encounter.species.id, encounter.isBoss ? 10 : 3) : progression.state;
  if (battle.result === "player-victory" && encounter.isBoss) progressedState = applyContractProgress(progressedState, { type: "defeat-boss", targetId: zone.id });
  console.log(battle.result === "player-victory" ? "Victory!" : "Your expedition team was defeated.");
  if (battle.result === "player-victory") console.log(`Participating monsters gain ${progression.xpAwarded} XP; reserves gain 25%.`);
  return { state: progressedState, encounter, won: battle.result === "player-victory", enemyHpRatio: enemy.hp / enemy.maxHp };
}

async function expedition(state: GameState): Promise<GameState> {
  const rng = new SeededRandom(state.world.seed + state.world.nextRandomOffset + 101);
  let zone = state.activeExpedition ? byId(content.zones, state.activeExpedition.route.zoneId) : undefined;
  if (!zone) {
    const available = state.world.unlockedZoneIds.map((id) => byId(content.zones, id)).filter(({ regionId }) => regionId === state.player.location.regionId);
    if (!available.length) { console.log("No expedition zone is currently unlocked in this region."); return state; }
    console.log("\nChoose an expedition zone:");
    available.forEach((candidate, index) => {
      const boss = candidate.boss ? ` · Alpha Lv.${candidate.boss.level}` : "";
      console.log(`${index + 1}. ${candidate.name} · Levels ${candidate.levelRange[0]}–${candidate.levelRange[1]}${boss}`);
    });
    zone = available[(await askNumber("> ", 1, available.length)) - 1]!;
  }
  let next = state.activeExpedition ? state : startExpeditionRun(state, zone, rng);
  const region = byId(content.regions, zone.regionId);
  const weather = next.world.weatherByRegion[zone.regionId] ?? "unknown";
  const teamLevels = next.activeExpedition!.route.teamIds.map((id) => next.monsters[id]!.level);
  const averageLevel = teamLevels.reduce((sum, level) => sum + level, 0) / teamLevels.length;
  console.log(next.activeExpedition === state.activeExpedition ? `\nResuming expedition in ${zone.name}.` : `\nThe team enters ${zone.name} with ${next.activeExpedition!.route.stamina} route stamina.`);
  console.log(`${zone.description}\nRegion: ${region.name} · Weather: ${weather} · Wild levels ${zone.levelRange[0]}–${zone.levelRange[1]}`);
  if (averageLevel < zone.levelRange[0]) console.log(`Readiness warning: team average Lv.${averageLevel.toFixed(1)} is below the zone's minimum level.`);
  else if (averageLevel < (zone.levelRange[0] + zone.levelRange[1]) / 2) console.log(`Readiness: challenging for a team averaging Lv.${averageLevel.toFixed(1)}.`);
  else console.log(`Readiness: prepared at average Lv.${averageLevel.toFixed(1)}.`);
  for (const hazardId of zone.hazards) {
    const hazard = byId(content.hazards, hazardId);
    console.log(`Hazard — ${hazard.name}: ${hazard.description}`);
  }
  const preparation = calculateExpeditionPreparation(next, zone, content.species, content.hazards);
  if (preparation.protectedHazardIds.length) {
    const names = preparation.protectedHazardIds.map((id) => byId(content.hazards, id).name);
    console.log(`Team preparation protects against ${names.join(", ")} and reduces field risk by ${Math.round(preparation.riskReduction * 100)}%.`);
  }
  while (next.activeExpedition) {
    const route = next.activeExpedition.route;
    if (route.status === "completed") {
      next = applyContractProgress(next, { type: "complete-expedition", targetId: route.zoneId });
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
    if (node.type === "encounter" || node.type === "boss") {
      const researchLevels = Object.fromEntries(Object.entries(next.player.researchBySpecies).map(([id, research]) => [id, research.level]));
      const bossEncounter = node.type === "boss" ? generateBossEncounter(zone, content.species, rng, next.world.day, researchLevels) : undefined;
      const battle = await wildBattle(next, rng, bossEncounter);
      next = battle.state;
      if (!battle.won) {
        next = { ...next, activeExpedition: { ...next.activeExpedition!, route: { ...next.activeExpedition!.route, status: "abandoned" } } };
        continue;
      }
      if (node.type === "encounter") next = await captureAfterEncounter(next, rng, battle.encounter, Math.max(0.05, battle.enemyHpRatio));
      else console.log("Alpha monsters are protected research targets and cannot be captured during the boss encounter.");
    }
    let approach: ExpeditionApproach = "balanced";
    if (["resource", "choice", "discovery"].includes(node.type)) {
      console.log("\nChoose an approach:");
      EXPEDITION_APPROACHES.forEach((option, index) => console.log(`${index + 1}. ${option.name} — ${option.description}`));
      approach = EXPEDITION_APPROACHES[(await askNumber("> ", 1, EXPEDITION_APPROACHES.length)) - 1]!.id;
    }
    const outcome = resolveExpeditionNode(next, rng, content.equipment, approach, preparation.riskReduction, zone);
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
    return listPlayerMonster(state, selectedId, price, 3, new SeededRandom(state.world.seed + state.world.nextRandomOffset + 500), content.species);
  } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

async function manageMarketplace(state: GameState): Promise<GameState> {
  console.log("\nMarketplace\n1. Browse listings  2. Sell a monster  3. Back");
  const action = await askNumber("> ", 1, 3);
  if (action === 2) return sellMonster(state);
  if (action === 3) return state;
  console.log("1. All species  2. Filter by species");
  let speciesId: string | undefined;
  if (await askNumber("> ", 1, 2) === 2) {
    content.species.forEach((species, index) => console.log(`${index + 1}. ${species.name}`));
    speciesId = content.species[(await askNumber("> ", 1, content.species.length)) - 1]!.id;
  }
  console.log("1. Any price  2. Set maximum price");
  const maximumPrice = await askNumber("> ", 1, 2) === 2 ? await askNumber("Maximum Crowns: ", 1, 1_000_000) : undefined;
  console.log("Sort: 1. Lowest price  2. Highest potential  3. Highest level");
  const sortBy = (["price", "potential", "level"] as const)[(await askNumber("> ", 1, 3)) - 1]!;
  console.log("1. Show all matching  2. Affordable only");
  const affordableOnly = await askNumber("> ", 1, 2) === 2;
  console.log("1. Any quality  2. Set minimum Potential and level");
  const qualityFilter = await askNumber("> ", 1, 2);
  const minimumPotential = qualityFilter === 2 ? await askNumber("Minimum Potential: ", 0, 100) : undefined;
  const minimumLevel = qualityFilter === 2 ? await askNumber("Minimum level: ", 1, 50) : undefined;
  const listings = browseMarketListings(state, { speciesId, maximumPrice, affordableOnly, sortBy, minimumPotential, minimumLevel });
  if (!listings.length) { console.log("No matching NPC listings are currently available. End a day to refresh the market."); return state; }
  listings.forEach((listing, index) => {
    const species = byId(content.species, listing.monster.speciesId);
    console.log(`${index + 1}. ${species.name} · Lv.${listing.monster.level} · Potential ${listing.monster.potential} · ${listing.askingPrice} Crowns`);
  });
  console.log(`${listings.length + 1}. Back`);
  const selection = await askNumber("Inspect/purchase: ", 1, listings.length + 1);
  if (selection > listings.length) return state;
  const listing = listings[selection - 1]!;
  const species = byId(content.species, listing.monster.speciesId);
  const appraisal = appraiseMonster(listing.monster, species, content.traits, state.market.indices[species.id]);
  const difference = listing.askingPrice - appraisal;
  console.log(`Traits: ${listing.monster.traitIds.map((id) => byId(content.traits, id).name).join(", ") || "none"} · Record ${listing.monster.wins}W–${listing.monster.losses}L`);
  console.log(`Exchange appraisal: ${appraisal} Crowns · ${listingValueLabel(listing.askingPrice, appraisal).toUpperCase()} · Asking price is ${Math.abs(difference)} Crowns ${difference <= 0 ? "below" : "above"} appraisal.`);
  console.log("1. Purchase  2. Back");
  if (await askNumber("> ", 1, 2) === 2) return state;
  try { return buyListing(state, listing.id, content.species); } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

function showInventory(state: GameState): void {
  console.log("\nInventory");
  const entries = Object.entries(state.player.inventory).filter(([, amount]) => amount > 0).sort(([a], [b]) => a.localeCompare(b));
  for (const [id, amount] of entries) console.log(`- ${id}: ${amount}`);
  if (!entries.length) console.log("Inventory is empty.");
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

async function manageResearch(state: GameState): Promise<GameState> {
  const labLevel = researchLabLevel(state);
  if (!labLevel) { console.log("Build and activate a Research Lab before conducting studies."); return state; }
  const notes = state.player.inventory["research-notes"] ?? 0;
  console.log(`\nResearch Lab Lv.${labLevel} · ${notes} research notes · +${labLevel * 15}% research gains`);
  if (!notes) { console.log("Discoveries during expeditions can yield research notes."); return state; }
  const knownIds = [...new Set([
    ...Object.keys(state.player.researchBySpecies),
    ...state.player.monsterIds.map((id) => state.monsters[id]!.speciesId),
  ])];
  if (!knownIds.length) { console.log("Observe or own a species before studying it."); return state; }
  knownIds.forEach((id, index) => {
    const research = state.player.researchBySpecies[id] ?? { level: 0, points: 0 };
    console.log(`${index + 1}. ${byId(content.species, id).name} — Research Lv.${research.level} (${research.points} points)`);
  });
  const speciesId = knownIds[(await askNumber("Species: ", 1, knownIds.length)) - 1]!;
  const count = await askNumber("Notes to use: ", 1, notes);
  const before = state.player.researchBySpecies[speciesId] ?? { level: 0, points: 0 };
  const next = conductSpeciesStudy(state, speciesId, count, content);
  const after = next.player.researchBySpecies[speciesId]!;
  console.log(`${byId(content.species, speciesId).name} gains ${after.points - before.points} research points${after.level > before.level ? ` and reaches Research Lv.${after.level}` : ""}.`);
  return next;
}

async function manageCrafting(state: GameState): Promise<GameState> {
  const available = availableRecipes(state, content);
  if (!available.length) { console.log("Build or upgrade the Field Workshop to unlock recipes."); return state; }
  console.log("\nField Workshop");
  available.forEach((recipe, index) => console.log(`${index + 1}. ${recipe.name} — ${Object.entries(recipe.inputs).map(([id, amount]) => `${amount} ${id}`).join(", ")} · can craft ${maximumCraftableQuantity(state, recipe.id, content)}`));
  const recipe = available[(await askNumber("> ", 1, available.length)) - 1]!;
  const quantity = await askNumber("Quantity: ", 1, 99);
  try {
    const next = craftRecipe(state, recipe.id, quantity, content);
    console.log(`Crafted ${quantity} × ${recipe.name}.`);
    return next;
  } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

async function manageHomebase(state: GameState): Promise<GameState> {
  console.log("\nHomebase");
  if (!state.homebase.buildings.length) console.log("No facilities built yet.");
  for (const building of state.homebase.buildings) console.log(`- ${byId(content.buildings, building.buildingId).name} Lv.${building.level} · ${building.status}`);
  console.log(`Stores: ${Object.entries(state.homebase.resources).map(([id, amount]) => `${amount} ${id}`).join(", ")}`);
  console.log("1. Construct facility  2. Upgrade facility  3. Deposit resources  4. Breeding Nest  5. Research Lab  6. Field Workshop  7. Back");
  const action = await askNumber("> ", 1, 7);
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
    if (action === 5) return manageResearch(state);
    if (action === 6) return manageCrafting(state);
  } catch (error) { console.log(error instanceof Error ? error.message : error); }
  return state;
}

async function manageAppearance(state: GameState): Promise<GameState> {
  console.log(`\nAppearance · Theme: ${state.uiPreferences.theme} · Reduced motion: ${state.uiPreferences.reducedMotion ? "on" : "off"}`);
  console.log("1. Follow device  2. Light  3. Dark  4. Toggle reduced motion  5. Back");
  const action = await askNumber("> ", 1, 5);
  if (action >= 1 && action <= 3) {
    const theme = (["system", "light", "dark"] as const)[action - 1]!;
    console.log(`Theme set to ${theme}. The future visual client will apply this preference automatically.`);
    return setThemePreference(state, theme);
  }
  if (action === 4) return setReducedMotion(state, !state.uiPreferences.reducedMotion);
  return state;
}

async function manageContracts(state: GameState): Promise<GameState> {
  console.log("\nContract Board");
  for (const contract of state.contracts) {
    const definition = byId(content.contracts, contract.definitionId);
    console.log(`- ${definition.name} · ${contract.status} · ${contract.progress}/${definition.objective.required} (${contractProgressPercent(contract.progress, definition.objective.required)}%)${contract.status === "active" ? ` · expires Day ${contract.expiresOnDay}` : ""}`);
  }
  const claimable = state.contracts.filter(({ status }) => status === "complete");
  const active = state.contracts.filter(({ status }) => status === "active");
  const available = content.contracts.filter((definition) => !state.contracts.some(({ definitionId, status }) => definitionId === definition.id && (status === "active" || status === "complete")));
  console.log("1. Accept contract  2. Claim completed contract  3. Abandon active contract  4. Back");
  const action = await askNumber("> ", 1, 4);
  try {
    if (action === 1) {
      if (!available.length) { console.log("No new contracts are currently available."); return state; }
      available.forEach((definition, index) => {
        const items = Object.entries(definition.reward.items ?? {}).map(([id, amount]) => `${amount} ${id}`).join(", ");
        console.log(`${index + 1}. ${definition.name} — ${definition.description} Reward: ${definition.reward.crowns} Crowns${definition.reward.reputation ? `, ${definition.reward.reputation} reputation` : ""}${items ? `, ${items}` : ""}`);
      });
      return acceptContract(state, available[(await askNumber("> ", 1, available.length)) - 1]!.id, content);
    }
    if (action === 2) {
      if (!claimable.length) { console.log("No completed contracts are ready to claim."); return state; }
      claimable.forEach((contract, index) => console.log(`${index + 1}. ${byId(content.contracts, contract.definitionId).name}`));
      const selected = claimable[(await askNumber("> ", 1, claimable.length)) - 1]!;
      const definition = byId(content.contracts, selected.definitionId);
      console.log(`Claimed ${definition.reward.crowns} Crowns.`);
      return claimContract(state, selected.definitionId, content);
    }
    if (action === 3) {
      if (!active.length) { console.log("No active contract can be abandoned."); return state; }
      active.forEach((contract, index) => console.log(`${index + 1}. ${byId(content.contracts, contract.definitionId).name}`));
      return abandonContract(state, active[(await askNumber("> ", 1, active.length)) - 1]!.definitionId);
    }
  } catch (error) { console.log(error instanceof Error ? error.message : error); }
  return state;
}

async function manageTrainers(state: GameState): Promise<GameState> {
  console.log("\nTrainer Network");
  const definitions = content.trainers.filter(({ id }) => state.trainers[id]);
  definitions.forEach((definition, index) => {
    const trainer = state.trainers[definition.id]!;
    const team = trainer.monsterIds.map((id) => `${byId(content.species, state.monsters[id]!.speciesId).name} Lv.${state.monsters[id]!.level}`).join(", ");
    console.log(`${index + 1}. ${definition.name} · ${definition.role} · ${trainerRelationshipTier(trainer.relationship)} relationship (${trainer.relationship}) · ${estimateTrainerDifficulty(state, definition.id)} challenge · Record ${trainer.wins}W–${trainer.losses}L\n   ${definition.description}\n   Team: ${team}`);
  });
  console.log(`${definitions.length + 1}. Back`);
  const selection = await askNumber("Challenge: ", 1, definitions.length + 1);
  if (selection > definitions.length) return state;
  const definition = definitions[selection - 1]!;
  try {
    const result = challengeTrainer(state, definition.id, content, new SeededRandom(state.world.seed + state.world.day * 101 + state.world.nextRandomOffset));
    console.log(result.playerWon ? `Victory over ${definition.name}! Earned ${result.rewardCrowns} Crowns.` : `${definition.name} wins this challenge. Your relationship still grows from the match.`);
    return result.state;
  } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

async function manageWorld(state: GameState): Promise<GameState> {
  const { regionId, cityId } = state.player.location;
  console.log(`\nWorld travel · ${regionId}${cityId ? ` · ${cityId}` : " · regional map"}`);
  if (cityId) {
    const services = cityServices(cityId);
    console.log(`City services: ${services.join(", ")}.`);
    console.log("1. Marketplace  2. Arena/Trainers  3. Monster Storage/Roster  4. Clinic  5. Workshop/Homebase  6. Expedition Guild  7. Transport  8. Leave city  9. Back");
    const action = await askNumber("> ", 1, 9);
    if (action === 1) return manageMarketplace(state);
    if (action === 2) return manageTrainers(state);
    if (action === 3) return manageRoster(state);
    if (action === 4) return manageRoster(state);
    if (action === 5) return manageHomebase(state);
    if (action === 6) return expedition(state);
    if (action === 8) return leaveCity(state);
    if (action === 9) return state;
  } else {
    const city = majorCityForRegion(regionId);
    console.log(`1. Enter ${city ?? "major city"}  2. Transport  3. Back`);
    const action = await askNumber("> ", 1, 3);
    if (action === 1) return enterMajorCity(state);
    if (action === 3) return state;
  }
  const routes = availablePlayerRoutes(state);
  if (!routes.length) { console.log("No transport routes depart from this region."); return state; }
  console.log("\nAvailable routes");
  routes.forEach((route, index) => console.log(`${index + 1}. ${route.mode} to ${routeDestination(route, regionId)} · ${route.costCrowns} Crowns · ${route.durationDays} day${route.durationDays === 1 ? "" : "s"}${route.requiredUnlockId && !state.world.unlockedMapIds.includes(route.requiredUnlockId) ? " · LOCKED" : ""}`));
  console.log(`${routes.length + 1}. Back`);
  const selection = await askNumber("> ", 1, routes.length + 1);
  if (selection > routes.length) return state;
  try { return travelPlayer(state, routes[selection - 1]!.id, content); }
  catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

async function run(): Promise<void> {
  let state = await exists(savePath) ? await loadGame(savePath, content.contentVersion) : await newGame();
  state = initializeTrainers(state, content, new SeededRandom(state.world.seed + 9000));
  console.log(`\nWelcome, ${state.player.name}.`);
  while (true) {
    console.log(`\nDay ${state.world.day} · ${state.player.crowns} Crowns · ${state.player.inventory["field-capsule"] ?? 0} Capsules`);
    console.log(`Season: ${state.world.season} · Location: ${state.player.location.cityId ?? state.player.location.regionId} · Local weather: ${state.world.weatherByRegion[state.player.location.regionId] ?? "unknown"}`);
    console.log("1. Expedition  2. Roster  3. Marketplace  4. Inventory  5. End day  6. Homebase  7. Equipment  8. Appearance  9. Contracts  10. Trainers  11. World map  12. Save and quit");
    const action = await askNumber("> ", 1, 12);
    if (action === 1) state = await expedition(state);
    if (action === 2) state = await manageRoster(state);
    if (action === 3) state = await manageMarketplace(state);
    if (action === 4) showInventory(state);
    if (action === 5) {
      try {
        const beforeTick = state;
        const result = advanceWorldDay(state, content);
        state = result.state;
        for (const name of completedContractNames(beforeTick, state, content)) console.log(`Contract complete: ${name}. Return to the Contract Board to claim the reward.`);
        for (const event of result.events) if (event.type === "market.player-listing-sold") console.log("One of your marketplace listings sold.");
        console.log("The world advances: teams recover, construction progresses, and the market refreshes.");
      }
      catch (error) { console.log(error instanceof Error ? error.message : error); }
    }
    if (action === 6) state = await manageHomebase(state);
    if (action === 7) state = await manageEquipment(state);
    if (action === 8) state = await manageAppearance(state);
    if (action === 9) state = await manageContracts(state);
    if (action === 10) state = await manageTrainers(state);
    if (action === 11) state = await manageWorld(state);
    await saveGame(savePath, state);
    if (action === 12) break;
  }
}

try { await run(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; } finally { ui.close(); }
