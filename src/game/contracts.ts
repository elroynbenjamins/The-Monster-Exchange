import type { ContractEventType, GameContent } from "../content/definitions.ts";
import type { GameState } from "./state.ts";

export interface ContractProgressEvent { type: ContractEventType; targetId?: string; amount?: number }

export function acceptContract(state: GameState, definitionId: string, content: GameContent): GameState {
  const definition = content.contracts.find(({ id }) => id === definitionId);
  if (!definition) throw new Error("Unknown contract.");
  const previous = state.contracts.find((contract) => contract.definitionId === definitionId);
  if (previous && (previous.status === "active" || previous.status === "complete")) throw new Error("This contract is already active.");
  if (state.contracts.filter(({ status }) => status === "active" || status === "complete").length >= 3) throw new Error("Only three contracts can be active at once.");
  if (definition.objective.event === "complete-expedition" && definition.objective.targetId && !state.world.unlockedZoneIds.includes(definition.objective.targetId)) throw new Error("The contract's zone is still locked.");
  const accepted = { definitionId, acceptedOnDay: state.world.day, expiresOnDay: state.world.day + definition.durationDays, progress: 0, status: "active" as const };
  return { ...state, contracts: previous ? state.contracts.map((contract) => contract === previous ? accepted : contract) : [...state.contracts, accepted] };
}

export function abandonContract(state: GameState, definitionId: string): GameState {
  const contract = state.contracts.find((entry) => entry.definitionId === definitionId);
  if (!contract || contract.status !== "active") throw new Error("Only an active contract can be abandoned.");
  return { ...state, contracts: state.contracts.map((entry) => entry === contract ? { ...entry, status: "expired" as const } : entry) };
}

export function completedContractNames(before: GameState, after: GameState, content: GameContent): readonly string[] {
  return after.contracts.filter((contract) => contract.status === "complete" && before.contracts.find(({ definitionId }) => definitionId === contract.definitionId)?.status !== "complete")
    .map((contract) => content.contracts.find(({ id }) => id === contract.definitionId)?.name ?? contract.definitionId);
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
