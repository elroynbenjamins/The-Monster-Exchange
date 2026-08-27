import type { BuildingDefinition } from "../content/definitions.ts";

export interface BuildingState { buildingId: string; level: number; status: "constructing" | "active"; completesOnDay?: number }
export interface HomebaseState { slotCount: number; buildings: readonly BuildingState[]; resources: Readonly<Record<string, number>> }

export function startConstruction(state: HomebaseState, definition: BuildingDefinition, day: number): HomebaseState {
  if (state.buildings.length >= state.slotCount) throw new Error("No free building slot.");
  if (state.buildings.some((building) => building.buildingId === definition.id)) throw new Error("Building already exists.");
  for (const [resource, amount] of Object.entries(definition.baseCost)) {
    if ((state.resources[resource] ?? 0) < amount) throw new Error(`Not enough ${resource}.`);
  }
  const resources = { ...state.resources };
  for (const [resource, amount] of Object.entries(definition.baseCost)) resources[resource] = (resources[resource] ?? 0) - amount;
  return { ...state, resources, buildings: [...state.buildings, { buildingId: definition.id, level: 1, status: "constructing", completesOnDay: day + definition.baseBuildDays }] };
}

export function tickHomebase(state: HomebaseState, day: number): HomebaseState {
  return { ...state, buildings: state.buildings.map((building) => building.status === "constructing" && (building.completesOnDay ?? Infinity) <= day ? { ...building, status: "active" as const, completesOnDay: undefined } : building) };
}
