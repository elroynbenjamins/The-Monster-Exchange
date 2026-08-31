import type { DomainEvent } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import { recordSpeciesSeen, type GameState } from "./state.ts";
import type { ExpeditionNodeType } from "../systems/exploration.ts";
import { createExpedition, resolveCurrentNode } from "../systems/exploration.ts";
import type { EquipmentDefinition, HazardDefinition, ZoneDefinition } from "../content/definitions.ts";
import type { SpeciesDefinition } from "../core/types.ts";

export interface NodeOutcome {
  state: GameState;
  event: DomainEvent<{ nodeType: ExpeditionNodeType; approach: ExpeditionApproach; message: string }>;
  defeated: boolean;
}

export type ExpeditionApproach = "cautious" | "balanced" | "bold";

export const EXPEDITION_APPROACHES = [
  { id: "cautious", name: "Cautious", description: "Spend less stamina and reduce risk, but secure fewer rewards." },
  { id: "balanced", name: "Balanced", description: "Accept the normal route risk and reward." },
  { id: "bold", name: "Bold", description: "Spend more stamina for larger rewards and greater mishap risk." },
] as const;

const APPROACH_RULES: Readonly<Record<ExpeditionApproach, { routeStamina: number; rewardMultiplier: number; mishapChance: number }>> = {
  cautious: { routeStamina: 7, rewardMultiplier: 0.75, mishapChance: 0.05 },
  balanced: { routeStamina: 10, rewardMultiplier: 1, mishapChance: 0.18 },
  bold: { routeStamina: 14, rewardMultiplier: 1.5, mishapChance: 0.35 },
};

export interface ExpeditionPreparation {
  riskReduction: number;
  protectedHazardIds: readonly string[];
}

export function calculateExpeditionPreparation(state: GameState, zone: ZoneDefinition, species: readonly SpeciesDefinition[], hazards: readonly HazardDefinition[]): ExpeditionPreparation {
  const teamSpecies = state.player.activeTeamIds.map((id) => species.find(({ id: speciesId }) => speciesId === state.monsters[id]?.speciesId)).filter((entry): entry is SpeciesDefinition => Boolean(entry));
  const protectedHazards = zone.hazards.filter((hazardId) => {
    const hazard = hazards.find(({ id }) => id === hazardId);
    if (!hazard) return false;
    return teamSpecies.some((monsterSpecies) => monsterSpecies.types.some((type) => type !== undefined && hazard.protectedTypes?.includes(type)) || monsterSpecies.tags.some((tag) => hazard.protectedTags?.includes(tag)));
  });
  const riskReduction = protectedHazards.reduce((sum, id) => sum + (hazards.find((hazard) => hazard.id === id)?.riskReduction ?? 0), 0);
  return { riskReduction: Math.min(0.25, riskReduction), protectedHazardIds: protectedHazards };
}

export function expeditionLodgeLevel(state: GameState): number {
  return state.homebase.buildings.find(({ buildingId, status }) => buildingId === "expedition-lodge" && status === "active")?.level ?? 0;
}

export function startExpeditionRun(state: GameState, zone: ZoneDefinition, rng: RandomSource, nodeCount = 6): GameState {
  if (state.activeExpedition) throw new Error("An expedition is already active.");
  if (state.player.activeTeamIds.length === 0) throw new Error("Choose at least one active monster.");
  const unavailable = state.player.activeTeamIds.filter((id) => (state.conditions[id]?.stamina ?? 0) < 20 || (state.conditions[id]?.hpRatio ?? 0) <= 0);
  if (unavailable.length) throw new Error("Every team member needs health and at least 20 stamina.");
  const route = createExpedition(zone, state.player.activeTeamIds, rng, nodeCount);
  const preparedRoute = { ...route, stamina: route.stamina + expeditionLodgeLevel(state) * 5 };
  return { ...state, activeExpedition: { route: preparedRoute, startedOnDay: state.world.day, rewards: {} } };
}

function spendTeamCondition(state: GameState, hpLoss: number, staminaLoss: number, equipment: readonly EquipmentDefinition[]): GameState {
  const conditions = { ...state.conditions };
  for (const id of state.activeExpedition!.route.teamIds) {
    const current = conditions[id] ?? { hpRatio: 1, stamina: 100 };
    const monster = state.monsters[id];
    const staminaModifier = (monster?.equipmentIds ?? []).reduce((sum, equipmentId) => sum + (equipment.find(({ id }) => id === equipmentId)?.expeditionStaminaModifier ?? 0), 0);
    const adjustedStaminaLoss = Math.ceil(staminaLoss * Math.max(0.5, 1 + staminaModifier));
    conditions[id] = { hpRatio: Math.max(0, current.hpRatio - hpLoss), stamina: Math.max(0, current.stamina - adjustedStaminaLoss) };
  }
  return { ...state, conditions };
}

function addReward(state: GameState, itemId: string, amount: number): GameState {
  const expedition = state.activeExpedition!;
  return { ...state, activeExpedition: { ...expedition, rewards: { ...expedition.rewards, [itemId]: (expedition.rewards[itemId] ?? 0) + amount } } };
}

export function resolveExpeditionNode(state: GameState, rng: RandomSource, equipment: readonly EquipmentDefinition[] = [], approach: ExpeditionApproach = "balanced", preparationRiskReduction = 0, zone?: ZoneDefinition): NodeOutcome {
  if (!state.activeExpedition) throw new Error("No active expedition.");
  const node = state.activeExpedition.route.nodes[state.activeExpedition.route.currentNode];
  if (!node) throw new Error("The expedition route is complete.");
  let next = state;
  let message = "";
  const rules = APPROACH_RULES[approach];
  if (!rules) throw new Error("Unknown expedition approach.");
  const reward = (amount: number) => Math.max(1, Math.round(amount * rules.rewardMultiplier));
  switch (node.type) {
    case "encounter": {
      next = spendTeamCondition(next, 0, reward(rng.int(8, 14)), equipment);
      next = addReward(next, "crowns", reward(rng.int(25, 60)));
      message = "The team clears the encounter and secures its field-contract reward.";
      break;
    }
    case "boss": {
      const boss = zone?.id === state.activeExpedition.route.zoneId ? zone.boss : undefined;
      if (boss) next = recordSpeciesSeen(next, boss.speciesId);
      const rewardCrowns = boss?.rewardCrowns ?? 100;
      const researchNotes = boss?.researchNotes ?? 1;
      next = spendTeamCondition(next, 0, 15, equipment);
      next = addReward(next, "crowns", rewardCrowns);
      next = addReward(next, "research-notes", researchNotes);
      const unlockZoneId = boss?.unlocksZoneId;
      const unlocks = Boolean(unlockZoneId && !next.world.unlockedZoneIds.includes(unlockZoneId));
      if (unlocks && unlockZoneId) next = { ...next, world: { ...next.world, unlockedZoneIds: [...next.world.unlockedZoneIds, unlockZoneId] } };
      message = `The alpha is defeated. The Exchange secures a ${rewardCrowns}-Crown boss bounty and ${researchNotes} research ${researchNotes === 1 ? "note" : "notes"}.${unlocks ? ` A route to ${unlockZoneId} is now open.` : ""}`;
      break;
    }
    case "resource": {
      const item = rng.pick(["herbs", "timber", "stone"] as const);
      const amount = reward(rng.int(2, 5));
      const mishap = rng.float() < Math.max(0, rules.mishapChance - preparationRiskReduction);
      next = spendTeamCondition(next, mishap ? 0.04 : 0, reward(5), equipment);
      next = addReward(next, item, amount);
      message = mishap ? `The team gathers ${amount} ${item}, but rough terrain causes minor injuries.` : `The team gathers ${amount} ${item}.`;
      break;
    }
    case "rest": {
      const conditions = { ...next.conditions };
      for (const id of next.activeExpedition!.route.teamIds) {
        const current = conditions[id]!;
        conditions[id] = { hpRatio: Math.min(1, current.hpRatio + 0.18), stamina: Math.min(100, current.stamina + 15) };
      }
      next = { ...next, conditions };
      message = "A sheltered camp restores health and stamina.";
      break;
    }
    case "choice": {
      const successChance = Math.min(0.95, (approach === "cautious" ? 0.85 : approach === "balanced" ? 0.65 : 0.5) + preparationRiskReduction);
      const success = rng.float() < successChance;
      const crowns = reward(45);
      next = success ? addReward(spendTeamCondition(next, 0, reward(4), equipment), "crowns", crowns) : spendTeamCondition(next, approach === "bold" ? 0.12 : 0.08, reward(9), equipment);
      message = success ? `The chosen route reveals an abandoned ${crowns}-Crown cache.` : "The route collapses and injures the team.";
      break;
    }
    case "discovery": {
      const notes = approach === "bold" ? 2 : 1;
      const mishap = rng.float() < Math.max(0, rules.mishapChance - preparationRiskReduction);
      next = addReward(spendTeamCondition(next, mishap ? 0.03 : 0, reward(3), equipment), "research-notes", notes);
      message = mishap ? `The team records ${notes} research notes despite a hazardous survey.` : `The team records ${notes} valuable ecological research ${notes === 1 ? "note" : "notes"}.`;
      break;
    }
  }
  const defeated = next.activeExpedition!.route.teamIds.every((id) => (next.conditions[id]?.hpRatio ?? 0) <= 0);
  const routeCost = Math.min(rules.routeStamina, next.activeExpedition!.route.stamina);
  const route = resolveCurrentNode(next.activeExpedition!.route, routeCost);
  next = { ...next, activeExpedition: { ...next.activeExpedition!, route: defeated ? { ...route, status: "abandoned" } : route } };
  return { state: next, event: { type: `expedition.${node.type}`, day: state.world.day, payload: { nodeType: node.type, approach, message } }, defeated };
}

export function finishExpedition(state: GameState, retreat = false): GameState {
  if (!state.activeExpedition) throw new Error("No active expedition.");
  const { route, rewards } = state.activeExpedition;
  if (!retreat && route.status !== "completed") throw new Error("The route is not complete.");
  const retainedFactor = retreat ? Math.min(0.85, 0.6 + expeditionLodgeLevel(state) * 0.05) : 1;
  const inventory = { ...state.player.inventory };
  let crowns = state.player.crowns;
  for (const [id, value] of Object.entries(rewards)) {
    const retained = Math.floor(value * retainedFactor);
    if (id === "crowns") crowns += retained;
    else inventory[id] = (inventory[id] ?? 0) + retained;
  }
  return { ...state, activeExpedition: undefined, player: { ...state.player, crowns, inventory } };
}

export function restTeam(state: GameState): GameState {
  if (state.activeExpedition) throw new Error("Cannot rest while an expedition is active.");
  const conditions = { ...state.conditions };
  for (const id of state.player.monsterIds) {
    const current = conditions[id] ?? { hpRatio: 1, stamina: 100 };
    conditions[id] = { hpRatio: Math.min(1, current.hpRatio + 0.5), stamina: Math.min(100, current.stamina + 45) };
  }
  return { ...state, conditions, world: { ...state.world, day: state.world.day + 1 }, market: { ...state.market, day: state.market.day + 1 } };
}
