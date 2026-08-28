import type { EvolutionDefinition, GameContent } from "../content/definitions.ts";
import type { RandomSource } from "../core/random.ts";
import { createId } from "../core/id.ts";
import type { GameState, ThemePreference } from "./state.ts";
import { addMonsterToPlayer } from "./state.ts";
import { breed, canBreed } from "../systems/breeding.ts";
import { evaluateEvolution, evolve } from "../systems/evolution.ts";
import type { BuildingDefinition } from "../content/definitions.ts";
import { startBuildingUpgrade, startConstruction } from "../systems/homebase.ts";
import type { BattleState } from "../systems/battle-engine.ts";

export function setThemePreference(state: GameState, theme: ThemePreference): GameState {
  if (!["system", "light", "dark"].includes(theme)) throw new Error("Unknown theme preference.");
  return { ...state, uiPreferences: { ...state.uiPreferences, theme } };
}

export function setReducedMotion(state: GameState, reducedMotion: boolean): GameState {
  return { ...state, uiPreferences: { ...state.uiPreferences, reducedMotion } };
}

export function renameOwnedMonster(state: GameState, monsterId: string, nickname?: string): GameState {
  const monster = state.monsters[monsterId];
  if (!monster || monster.ownerId !== state.player.id) throw new Error("You do not own this monster.");
  const trimmed = nickname?.trim().replace(/\s+/g, " ");
  if (trimmed && trimmed.length > 24) throw new Error("Nicknames can contain at most 24 characters.");
  if (trimmed && /[\u0000-\u001f\u007f]/.test(trimmed)) throw new Error("Nicknames cannot contain control characters.");
  if (trimmed && state.player.monsterIds.some((id) => id !== monsterId && state.monsters[id]?.nickname?.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) throw new Error("Another roster monster already uses this nickname.");
  return { ...state, monsters: { ...state.monsters, [monsterId]: { ...monster, nickname: trimmed || undefined } } };
}

export function provideFieldCare(state: GameState, monsterId: string, herbCount: number): GameState {
  if (state.activeExpedition) throw new Error("Field care is only available at homebase.");
  const monster = state.monsters[monsterId];
  if (!monster || monster.ownerId !== state.player.id) throw new Error("You do not own this monster.");
  if (!Number.isInteger(herbCount) || herbCount < 1) throw new Error("Use at least one whole herb.");
  if ((state.player.inventory.herbs ?? 0) < herbCount) throw new Error("Not enough herbs.");
  const current = state.conditions[monsterId] ?? { hpRatio: 1, stamina: 100 };
  if (current.hpRatio >= 1 && current.stamina >= 100) throw new Error("This monster does not need field care.");
  const clinicLevel = state.homebase.buildings.find(({ buildingId, status }) => buildingId === "field-clinic" && status === "active")?.level ?? 0;
  const healingPerHerb = 0.2 + clinicLevel * 0.05;
  const staminaPerHerb = 10 + clinicLevel * 2;
  const usefulHerbs = Math.min(herbCount, Math.max(Math.ceil((1 - current.hpRatio) / healingPerHerb), Math.ceil((100 - current.stamina) / staminaPerHerb)));
  return {
    ...state,
    player: { ...state.player, inventory: { ...state.player.inventory, herbs: state.player.inventory.herbs! - usefulHerbs } },
    conditions: { ...state.conditions, [monsterId]: { hpRatio: Math.min(1, current.hpRatio + healingPerHerb * usefulHerbs), stamina: Math.min(100, current.stamina + staminaPerHerb * usefulHerbs) } },
  };
}

export function availableRecipes(state: GameState, content: GameContent) {
  return content.recipes.filter((recipe) => {
    const building = state.homebase.buildings.find(({ buildingId, status }) => buildingId === recipe.requiredBuildingId && status === "active");
    return Boolean(building && building.level >= recipe.requiredBuildingLevel);
  });
}

export function maximumCraftableQuantity(state: GameState, recipeId: string, content: GameContent): number {
  const recipe = content.recipes.find(({ id }) => id === recipeId);
  if (!recipe || !availableRecipes(state, content).some(({ id }) => id === recipeId)) return 0;
  return Math.min(...Object.entries(recipe.inputs).map(([id, amount]) => Math.floor((state.player.inventory[id] ?? 0) / amount)));
}

export function craftRecipe(state: GameState, recipeId: string, quantity: number, content: GameContent): GameState {
  if (state.activeExpedition) throw new Error("Crafting is only available at homebase.");
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Craft a positive whole quantity.");
  const recipe = content.recipes.find(({ id }) => id === recipeId);
  if (!recipe) throw new Error("Unknown recipe.");
  const workshop = state.homebase.buildings.find(({ buildingId, status }) => buildingId === recipe.requiredBuildingId && status === "active");
  if (!workshop || workshop.level < recipe.requiredBuildingLevel) throw new Error(`${recipe.name} requires ${recipe.requiredBuildingId} level ${recipe.requiredBuildingLevel}.`);
  const maximum = maximumCraftableQuantity(state, recipeId, content);
  if (quantity > maximum) throw new Error(`Only ${maximum} can currently be crafted.`);
  for (const [id, amount] of Object.entries(recipe.inputs)) if ((state.player.inventory[id] ?? 0) < amount * quantity) throw new Error(`Not enough ${id}.`);
  const inventory = { ...state.player.inventory };
  for (const [id, amount] of Object.entries(recipe.inputs)) inventory[id] = (inventory[id] ?? 0) - amount * quantity;
  for (const [id, amount] of Object.entries(recipe.outputs)) inventory[id] = (inventory[id] ?? 0) + amount * quantity;
  return { ...state, player: { ...state.player, inventory } };
}

export function setActiveTeam(state: GameState, monsterIds: readonly string[]): GameState {
  if (monsterIds.length < 1 || monsterIds.length > 5) throw new Error("A team requires 1–5 monsters.");
  if (new Set(monsterIds).size !== monsterIds.length) throw new Error("A monster cannot occupy two team slots.");
  if (monsterIds.some((id) => !state.player.monsterIds.includes(id))) throw new Error("Every team member must be in your roster.");
  if (state.activeExpedition) throw new Error("The team cannot change during an expedition.");
  return { ...state, player: { ...state.player, activeTeamIds: [...monsterIds] } };
}

export function equipMonsterSkills(state: GameState, monsterId: string, skillIds: readonly string[]): GameState {
  const monster = state.monsters[monsterId];
  if (!monster || monster.ownerId !== state.player.id) throw new Error("You do not own this monster.");
  if (skillIds.length > 3 || new Set(skillIds).size !== skillIds.length) throw new Error("Equip up to three unique skills.");
  if (skillIds.some((id) => !monster.knownSkillIds.includes(id))) throw new Error("A monster can only equip known skills.");
  return { ...state, monsters: { ...state.monsters, [monsterId]: { ...monster, equippedSkillIds: [...skillIds] } } };
}

export function equipMonsterItems(state: GameState, monsterId: string, equipmentIds: readonly string[], content: GameContent): GameState {
  const monster = state.monsters[monsterId];
  if (!monster || monster.ownerId !== state.player.id) throw new Error("You do not own this monster.");
  if (state.activeExpedition?.route.teamIds.includes(monsterId)) throw new Error("Equipment cannot change during an expedition.");
  if (equipmentIds.length > 2 || new Set(equipmentIds).size !== equipmentIds.length) throw new Error("Equip up to two different items.");
  if (equipmentIds.some((id) => !content.equipment.some((item) => item.id === id))) throw new Error("Unknown equipment item.");
  const current = monster.equipmentIds ?? [];
  const available = { ...state.player.inventory };
  for (const id of current) available[id] = (available[id] ?? 0) + 1;
  for (const id of equipmentIds) {
    if ((available[id] ?? 0) < 1) throw new Error(`Equipment not available: ${id}.`);
    available[id] = (available[id] ?? 0) - 1;
  }
  return {
    ...state,
    player: { ...state.player, inventory: available },
    monsters: { ...state.monsters, [monsterId]: { ...monster, equipmentIds: [...equipmentIds] } },
  };
}

export function activeTeamCaptureBonus(state: GameState, content: GameContent): number {
  return Math.min(0.2, state.player.activeTeamIds.reduce((sum, monsterId) => {
    const monster = state.monsters[monsterId];
    return sum + (monster?.equipmentIds ?? []).reduce((itemSum, id) => itemSum + (content.equipment.find((item) => item.id === id)?.captureBonus ?? 0), 0);
  }, 0));
}

const RESEARCH_THRESHOLDS = [0, 10, 30, 65, 110, 170] as const;

export function recordSpeciesResearch(state: GameState, speciesId: string, points: number): GameState {
  if (points < 0) throw new Error("Research points cannot be negative.");
  const current = state.player.researchBySpecies[speciesId] ?? { level: 0, points: 0 };
  const total = current.points + points;
  let level = 0;
  for (let index = 0; index < RESEARCH_THRESHOLDS.length; index++) if (total >= RESEARCH_THRESHOLDS[index]!) level = index;
  return { ...state, player: { ...state.player, researchBySpecies: { ...state.player.researchBySpecies, [speciesId]: { level, points: total } } } };
}

export function researchLabLevel(state: GameState): number {
  return state.homebase.buildings.find(({ buildingId, status }) => buildingId === "research-lab" && status === "active")?.level ?? 0;
}

export function gainSpeciesResearch(state: GameState, speciesId: string, basePoints: number): GameState {
  if (basePoints < 0) throw new Error("Research points cannot be negative.");
  const awarded = Math.ceil(basePoints * (1 + researchLabLevel(state) * 0.15));
  return recordSpeciesResearch(state, speciesId, awarded);
}

export function conductSpeciesStudy(state: GameState, speciesId: string, noteCount: number, content: GameContent): GameState {
  if (state.activeExpedition) throw new Error("Research studies cannot be conducted during an expedition.");
  if (researchLabLevel(state) < 1) throw new Error("An active Research Lab is required.");
  if (!Number.isInteger(noteCount) || noteCount < 1) throw new Error("Use at least one whole research note.");
  if ((state.player.inventory["research-notes"] ?? 0) < noteCount) throw new Error("Not enough research notes.");
  if (!content.species.some(({ id }) => id === speciesId)) throw new Error("Unknown species.");
  const known = state.player.researchBySpecies[speciesId] || state.player.monsterIds.some((id) => state.monsters[id]?.speciesId === speciesId);
  if (!known) throw new Error("Observe or own this species before studying it.");
  const spent = { ...state, player: { ...state.player, inventory: { ...state.player.inventory, "research-notes": state.player.inventory["research-notes"]! - noteCount } } };
  return gainSpeciesResearch(spent, speciesId, noteCount * 10);
}

export function xpForNextLevel(level: number): number { return 60 + level * level * 12; }

export function grantMonsterXp(state: GameState, monsterId: string, amount: number, content: GameContent): { state: GameState; levelsGained: number; learnedSkillIds: readonly string[] } {
  if (amount < 0) throw new Error("XP cannot be negative.");
  const original = state.monsters[monsterId];
  if (!original) throw new Error("Unknown monster.");
  const species = content.species.find(({ id }) => id === original.speciesId)!;
  let level = original.level;
  let xp = original.xp + amount;
  while (level < 50 && xp >= xpForNextLevel(level)) { xp -= xpForNextLevel(level); level++; }
  if (level >= 50) xp = 0;
  const unlockedCount = Math.min(species.skillPool.length, 2 + Math.floor(level / 10));
  const knownSkillIds = [...new Set([...original.knownSkillIds, ...species.skillPool.slice(0, unlockedCount)])];
  const learnedSkillIds = knownSkillIds.filter((id) => !original.knownSkillIds.includes(id));
  const monster = { ...original, level, xp, knownSkillIds, equippedSkillIds: original.equippedSkillIds.length ? original.equippedSkillIds : knownSkillIds.slice(0, 3) };
  return { state: { ...state, monsters: { ...state.monsters, [monsterId]: monster } }, levelsGained: level - original.level, learnedSkillIds };
}

export function startBreeding(state: GameState, parentIds: readonly [string, string], content: GameContent, rng: RandomSource): GameState {
  const nest = state.homebase.buildings.find(({ buildingId, status }) => buildingId === "breeding-nest" && status === "active");
  if (!nest) throw new Error("An active Breeding Nest is required.");
  if (state.breedingJobs.length >= nest.level) throw new Error("All Breeding Nest capacity is in use.");
  const [a, b] = parentIds.map((id) => state.monsters[id]);
  if (!a || !b || a.ownerId !== state.player.id || b.ownerId !== state.player.id) throw new Error("Both parents must be owned by the player.");
  if (state.activeExpedition?.route.teamIds.some((id) => parentIds.includes(id))) throw new Error("Parents cannot breed while on expedition.");
  const speciesA = content.species.find(({ id }) => id === a.speciesId)!;
  const speciesB = content.species.find(({ id }) => id === b.speciesId)!;
  const compatibility = canBreed(a, b, speciesA, speciesB);
  if (!compatibility.ok) throw new Error(compatibility.reason);
  const fee = Math.max(40, 100 - nest.level * 10);
  if (state.player.crowns < fee) throw new Error("Not enough Crowns for the breeding fee.");
  const duration = Math.max(1, 3 - Math.floor(nest.level / 2));
  return {
    ...state,
    player: { ...state.player, crowns: state.player.crowns - fee },
    breedingJobs: [...state.breedingJobs, { id: createId("breed", rng), parentIds, startedOnDay: state.world.day, completesOnDay: state.world.day + duration, status: "active" }],
  };
}

export function claimBreedingJob(state: GameState, jobId: string, content: GameContent, rng: RandomSource): GameState {
  const job = state.breedingJobs.find(({ id }) => id === jobId);
  if (!job || job.status !== "ready") throw new Error("This breeding job is not ready.");
  const [a, b] = job.parentIds.map((id) => state.monsters[id]!);
  const speciesA = content.species.find(({ id }) => id === a.speciesId)!;
  const speciesB = content.species.find(({ id }) => id === b.speciesId)!;
  const result = breed(a, b, speciesA, speciesB, rng, state.world.day, state.player.id);
  const withoutJob = { ...state, breedingJobs: state.breedingJobs.filter(({ id }) => id !== jobId) };
  return addMonsterToPlayer(withoutJob, result.offspring);
}

export function evolveOwnedMonster(state: GameState, monsterId: string, evolution: EvolutionDefinition, content: GameContent, context: { regionId?: string; environmentTags?: readonly string[]; licenceIds?: readonly string[]; storyMilestoneIds?: readonly string[] } = {}): GameState {
  const monster = state.monsters[monsterId];
  if (!monster || monster.ownerId !== state.player.id) throw new Error("You do not own this monster.");
  const regionId = context.regionId ?? state.player.location.regionId;
  const evolutionContext = {
    inventory: state.player.inventory,
    regionId,
    weather: state.world.weatherByRegion[regionId],
    environmentTags: context.environmentTags,
    researchLevel: state.player.researchBySpecies[monster.speciesId]?.level ?? 0,
    licenceIds: context.licenceIds,
    storyMilestoneIds: context.storyMilestoneIds ?? state.world.unlockedMapIds,
  };
  const eligibility = evaluateEvolution(monster, evolution, evolutionContext);
  if (!eligibility.eligible) throw new Error(`Evolution requirements unmet: ${eligibility.unmet.join(", ")}`);
  let inventory = state.player.inventory;
  if (evolution.requirements.itemId) {
    const quantity = evolution.requirements.itemQuantity ?? 1;
    inventory = { ...inventory, [evolution.requirements.itemId]: (inventory[evolution.requirements.itemId] ?? 0) - quantity };
  }
  const evolved = evolve(monster, evolution, evolutionContext);
  const nextSpecies = content.species.find(({ id }) => id === evolution.toSpeciesId)!;
  const unlockedCount = Math.min(nextSpecies.skillPool.length, 2 + Math.floor(monster.level / 10));
  const knownSkillIds = [...new Set([...evolved.knownSkillIds, ...nextSpecies.skillPool.slice(0, unlockedCount)])];
  return { ...state, player: { ...state.player, inventory }, monsters: { ...state.monsters, [monsterId]: { ...evolved, knownSkillIds } } };
}

export function depositHomebaseResource(state: GameState, resourceId: string, amount: number): GameState {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Deposit a positive whole amount.");
  if ((state.player.inventory[resourceId] ?? 0) < amount) throw new Error(`Not enough ${resourceId}.`);
  return {
    ...state,
    player: { ...state.player, inventory: { ...state.player.inventory, [resourceId]: state.player.inventory[resourceId]! - amount } },
    homebase: { ...state.homebase, resources: { ...state.homebase.resources, [resourceId]: (state.homebase.resources[resourceId] ?? 0) + amount } },
  };
}

export function constructBuilding(state: GameState, definition: BuildingDefinition): GameState {
  if (state.activeExpedition) throw new Error("Construction cannot be managed during an expedition.");
  return { ...state, homebase: startConstruction(state.homebase, definition, state.world.day) };
}

export function upgradeBuilding(state: GameState, definition: BuildingDefinition): GameState {
  if (state.activeExpedition) throw new Error("Construction cannot be managed during an expedition.");
  return { ...state, homebase: startBuildingUpgrade(state.homebase, definition, state.world.day) };
}

export function settleBattleProgression(state: GameState, battle: BattleState, content: GameContent): { state: GameState; xpAwarded: number } {
  if (battle.result === "ongoing") throw new Error("An unfinished battle cannot award progression.");
  const playerWon = battle.result === "player-victory";
  const enemyLevelTotal = battle.units.filter(({ side }) => side === "enemy").reduce((sum, { monster }) => sum + monster.level, 0);
  const xpAwarded = Math.max(15, 20 + enemyLevelTotal * 12);
  let next = state;
  for (const unit of battle.units.filter(({ side }) => side === "player")) {
    const current = next.monsters[unit.id];
    if (!current || current.ownerId !== next.player.id) continue;
    next = grantMonsterXp(next, unit.id, unit.active ? xpAwarded : Math.floor(xpAwarded * 0.25), content).state;
    const progressed = next.monsters[unit.id]!;
    next = {
      ...next,
      monsters: {
        ...next.monsters,
        [unit.id]: {
          ...progressed,
          wins: progressed.wins + (playerWon ? 1 : 0),
          losses: progressed.losses + (playerWon ? 0 : 1),
          fame: progressed.fame + (playerWon && unit.hp > 0 ? 1 : 0),
        },
      },
    };
  }
  return { state: { ...next, player: { ...next.player, reputation: Math.max(0, next.player.reputation + (playerWon ? 1 : 0)) } }, xpAwarded };
}
