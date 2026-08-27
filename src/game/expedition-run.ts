import type { DomainEvent } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import type { GameState } from "./state.ts";
import type { ExpeditionNodeType } from "../systems/exploration.ts";
import { createExpedition, resolveCurrentNode } from "../systems/exploration.ts";
import type { ZoneDefinition } from "../content/definitions.ts";

export interface NodeOutcome {
  state: GameState;
  event: DomainEvent<{ nodeType: ExpeditionNodeType; message: string }>;
  defeated: boolean;
}

export function startExpeditionRun(state: GameState, zone: ZoneDefinition, rng: RandomSource, nodeCount = 6): GameState {
  if (state.activeExpedition) throw new Error("An expedition is already active.");
  if (state.player.activeTeamIds.length === 0) throw new Error("Choose at least one active monster.");
  const unavailable = state.player.activeTeamIds.filter((id) => (state.conditions[id]?.stamina ?? 0) < 20 || (state.conditions[id]?.hpRatio ?? 0) <= 0);
  if (unavailable.length) throw new Error("Every team member needs health and at least 20 stamina.");
  return { ...state, activeExpedition: { route: createExpedition(zone, state.player.activeTeamIds, rng, nodeCount), startedOnDay: state.world.day, rewards: {} } };
}

function spendTeamCondition(state: GameState, hpLoss: number, staminaLoss: number): GameState {
  const conditions = { ...state.conditions };
  for (const id of state.activeExpedition!.route.teamIds) {
    const current = conditions[id] ?? { hpRatio: 1, stamina: 100 };
    conditions[id] = { hpRatio: Math.max(0, current.hpRatio - hpLoss), stamina: Math.max(0, current.stamina - staminaLoss) };
  }
  return { ...state, conditions };
}

function addReward(state: GameState, itemId: string, amount: number): GameState {
  const expedition = state.activeExpedition!;
  return { ...state, activeExpedition: { ...expedition, rewards: { ...expedition.rewards, [itemId]: (expedition.rewards[itemId] ?? 0) + amount } } };
}

export function resolveExpeditionNode(state: GameState, rng: RandomSource): NodeOutcome {
  if (!state.activeExpedition) throw new Error("No active expedition.");
  const node = state.activeExpedition.route.nodes[state.activeExpedition.route.currentNode];
  if (!node) throw new Error("The expedition route is complete.");
  let next = state;
  let message = "";
  switch (node.type) {
    case "encounter": {
      next = spendTeamCondition(next, 0, rng.int(8, 14));
      next = addReward(next, "crowns", rng.int(25, 60));
      message = "The team clears the encounter and secures its field-contract reward.";
      break;
    }
    case "resource": {
      const item = rng.pick(["herbs", "timber", "stone"] as const);
      const amount = rng.int(2, 5);
      next = spendTeamCondition(next, 0, 5);
      next = addReward(next, item, amount);
      message = `The team gathers ${amount} ${item}.`;
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
      const safe = rng.float() < 0.65;
      next = safe ? addReward(spendTeamCondition(next, 0, 4), "crowns", 45) : spendTeamCondition(next, 0.08, 9);
      message = safe ? "A risky shortcut reveals an abandoned 45-Crown cache." : "The shortcut collapses and injures the team.";
      break;
    }
    case "discovery":
      next = addReward(spendTeamCondition(next, 0, 3), "research-notes", 1);
      message = "The team records a valuable ecological discovery.";
      break;
  }
  const defeated = next.activeExpedition!.route.teamIds.every((id) => (next.conditions[id]?.hpRatio ?? 0) <= 0);
  const route = resolveCurrentNode(next.activeExpedition!.route, Math.min(10, next.activeExpedition!.route.stamina));
  next = { ...next, activeExpedition: { ...next.activeExpedition!, route: defeated ? { ...route, status: "abandoned" } : route } };
  return { state: next, event: { type: `expedition.${node.type}`, day: state.world.day, payload: { nodeType: node.type, message } }, defeated };
}

export function finishExpedition(state: GameState, retreat = false): GameState {
  if (!state.activeExpedition) throw new Error("No active expedition.");
  const { route, rewards } = state.activeExpedition;
  if (!retreat && route.status !== "completed") throw new Error("The route is not complete.");
  const retainedFactor = retreat ? 0.6 : 1;
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
