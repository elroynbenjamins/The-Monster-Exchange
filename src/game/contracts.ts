import type { ContractEventType, GameContent } from "../content/definitions.ts";
import type { GameState } from "./state.ts";

export interface ContractProgressEvent { type: ContractEventType; targetId?: string; amount?: number }

export function acceptContract(state: GameState, definitionId: string, content: GameContent): GameState {
  const definition = content.contracts.find(({ id }) => id === definitionId);
  if (!definition) throw new Error("Unknown contract.");
  if (state.contracts.some((contract) => contract.definitionId === definitionId)) throw new Error("This contract has already been accepted.");
  if (state.contracts.filter(({ status }) => status === "active" || status === "complete").length >= 3) throw new Error("Only three contracts can be active at once.");
  if (definition.objective.event === "complete-expedition" && definition.objective.targetId && !state.world.unlockedZoneIds.includes(definition.objective.targetId)) throw new Error("The contract's zone is still locked.");
  return { ...state, contracts: [...state.contracts, { definitionId, acceptedOnDay: state.world.day, expiresOnDay: state.world.day + definition.durationDays, progress: 0, status: "active" }] };
}

export function recordContractProgress(state: GameState, event: ContractProgressEvent, content: GameContent): GameState {
  return { ...state, contracts: state.contracts.map((contract) => {
    if (contract.status !== "active") return contract;
    const definition = content.contracts.find(({ id }) => id === contract.definitionId);
    if (!definition || definition.objective.event !== event.type || (definition.objective.targetId && definition.objective.targetId !== event.targetId)) return contract;
    const progress = Math.min(definition.objective.required, contract.progress + (event.amount ?? 1));
    return { ...contract, progress, status: progress >= definition.objective.required ? "complete" as const : "active" as const };
  }) };
}

export function claimContract(state: GameState, definitionId: string, content: GameContent): GameState {
  const contract = state.contracts.find((entry) => entry.definitionId === definitionId);
  if (!contract || contract.status !== "complete") throw new Error("This contract is not ready to claim.");
  const definition = content.contracts.find(({ id }) => id === definitionId)!;
  const inventory = { ...state.player.inventory };
  for (const [id, amount] of Object.entries(definition.reward.items ?? {})) inventory[id] = (inventory[id] ?? 0) + amount;
  return {
    ...state,
    player: { ...state.player, crowns: state.player.crowns + definition.reward.crowns, reputation: state.player.reputation + (definition.reward.reputation ?? 0), inventory },
    contracts: state.contracts.map((entry) => entry === contract ? { ...entry, status: "claimed" as const } : entry),
  };
}

export function expireContracts(state: GameState): GameState {
  return { ...state, contracts: state.contracts.map((contract) => contract.status === "active" && contract.expiresOnDay <= state.world.day ? { ...contract, status: "expired" as const } : contract) };
}
