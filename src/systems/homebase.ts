import type { BuildingDefinition } from "../content/definitions.ts";

export interface BuildingState { buildingId: string; level: number; status: "constructing" | "upgrading" | "active"; completesOnDay?: number; targetLevel?: number }
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
  return { ...state, buildings: state.buildings.map((building) => building.status !== "active" && (building.completesOnDay ?? Infinity) <= day ? { ...building, level: building.targetLevel ?? building.level, status: "active" as const, completesOnDay: undefined, targetLevel: undefined } : building) };
}

export function startBuildingUpgrade(state: HomebaseState, definition: BuildingDefinition, day: number): HomebaseState {
  const current = state.buildings.find(({ buildingId }) => buildingId === definition.id);
  if (!current) throw new Error("Build this facility before upgrading it.");
  if (current.status !== "active") throw new Error("The facility is already under construction.");
  if (current.level >= definition.maxLevel) throw new Error("The facility is already at maximum level.");
  const nextLevel = current.level + 1;
  const costMultiplier = nextLevel;
  for (const [resource, baseAmount] of Object.entries(definition.baseCost)) {
    if ((state.resources[resource] ?? 0) < baseAmount * costMultiplier) throw new Error(`Not enough ${resource}.`);
  }
  const resources = { ...state.resources };
  for (const [resource, baseAmount] of Object.entries(definition.baseCost)) resources[resource] = (resources[resource] ?? 0) - baseAmount * costMultiplier;
  return {
    ...state, resources,
    buildings: state.buildings.map((building) => building.buildingId === definition.id ? { ...building, status: "upgrading" as const, targetLevel: nextLevel, completesOnDay: day + definition.baseBuildDays * nextLevel } : building),
  };
}
