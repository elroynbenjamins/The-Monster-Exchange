import type { ZoneDefinition } from "../content/definitions.ts";
import type { RandomSource } from "../core/random.ts";
import { createId } from "../core/id.ts";

export type ExpeditionNodeType = keyof ZoneDefinition["nodeWeights"] | "boss";
export interface ExpeditionNode { id: string; type: ExpeditionNodeType; resolved: boolean }
export interface ExpeditionState { id: string; zoneId: string; teamIds: readonly string[]; stamina: number; currentNode: number; nodes: readonly ExpeditionNode[]; status: "active" | "completed" | "abandoned" }

function weightedNode(zone: ZoneDefinition, rng: RandomSource): ExpeditionNodeType {
  const entries = Object.entries(zone.nodeWeights) as [keyof ZoneDefinition["nodeWeights"], number][];
  let roll = rng.float() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [type, weight] of entries) { roll -= weight; if (roll <= 0) return type; }
  return entries.at(-1)![0];
}

export function createExpedition(zone: ZoneDefinition, teamIds: readonly string[], rng: RandomSource, nodeCount = 7): ExpeditionState {
  if (teamIds.length < 1 || teamIds.length > 5) throw new Error("Expeditions require 1–5 monsters.");
  const nodes = Array.from({ length: nodeCount }, () => ({ id: createId("node", rng), type: weightedNode(zone, rng), resolved: false }));
  if (zone.boss && nodes.length) nodes[nodes.length - 1] = { ...nodes[nodes.length - 1]!, type: "boss" };
  return { id: createId("expedition", rng), zoneId: zone.id, teamIds, stamina: 100, currentNode: 0, nodes, status: "active" };
}

export function resolveCurrentNode(expedition: ExpeditionState, staminaCost: number): ExpeditionState {
  if (expedition.status !== "active") throw new Error("Expedition is not active.");
  if (expedition.stamina < staminaCost) throw new Error("Not enough expedition stamina.");
  const nodes = expedition.nodes.map((node, index) => index === expedition.currentNode ? { ...node, resolved: true } : node);
  const currentNode = expedition.currentNode + 1;
  return { ...expedition, nodes, currentNode, stamina: expedition.stamina - staminaCost, status: currentNode >= nodes.length ? "completed" : "active" };
}
