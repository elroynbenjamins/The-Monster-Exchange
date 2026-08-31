import type { SpeciesDefinition } from "../core/types.ts";
import type { GameState, SpeciesDiscoveryStatus } from "../game/state.ts";

export type MonsterdexStatus = SpeciesDiscoveryStatus;

export interface MonsterdexEntry {
  catalogNumber: number;
  species: SpeciesDefinition;
  status: MonsterdexStatus;
  researchLevel: number;
  ownedCount: number;
  cardAssetId?: string;
  portraitAssetId?: string;
  display: {
    name: string;
    types?: SpeciesDefinition["types"];
    description?: string;
    habitatIds?: readonly string[];
    fullEntry?: SpeciesDefinition;
  };
}

export interface MonsterdexFilter {
  query?: string;
  type?: string;
  rarity?: SpeciesDefinition["rarity"];
  status?: MonsterdexStatus;
}

export interface MonsterdexProgress {
  total: number;
  seen: number;
  caught: number;
  completionPercent: number;
}

export type MonsterdexSort = "number" | "name" | "rarity" | "research";

const RARITY_ORDER: Readonly<Record<SpeciesDefinition["rarity"], number>> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

export function cardAssetId(catalogNumber: number, speciesId: string): string | undefined {
  void catalogNumber;
  void speciesId;
  return undefined;
}

export function portraitAssetId(catalogNumber: number, speciesId: string): string | undefined {
  void catalogNumber;
  void speciesId;
  return undefined;
}

export function buildMonsterdexEntries(species: readonly SpeciesDefinition[], state: GameState): readonly MonsterdexEntry[] {
  const ownedCounts = new Map<string, number>();
  for (const monsterId of state.player.monsterIds) {
    const speciesId = state.monsters[monsterId]?.speciesId;
    if (speciesId) ownedCounts.set(speciesId, (ownedCounts.get(speciesId) ?? 0) + 1);
  }
  return [...species].sort((a, b) => a.dexNumber - b.dexNumber).map((definition) => {
    const ownedCount = ownedCounts.get(definition.id) ?? 0;
    const researchLevel = state.player.researchBySpecies[definition.id]?.level ?? 0;
    return {
      catalogNumber: definition.dexNumber,
      species: definition,
      status: state.player.discoveryBySpecies[definition.id] ?? "UNKNOWN",
      researchLevel,
      ownedCount,
      cardAssetId: cardAssetId(definition.internalId, definition.id),
      portraitAssetId: portraitAssetId(definition.internalId, definition.id),
      display: statusDisplay(definition, state.player.discoveryBySpecies[definition.id] ?? "UNKNOWN"),
    };
  });
}

function statusDisplay(definition: SpeciesDefinition, status: MonsterdexStatus): MonsterdexEntry["display"] {
  if (status === "UNKNOWN") return { name: "???" };
  const basic = { name: definition.name, types: definition.types, habitatIds: definition.habitats };
  return status === "CAUGHT" ? { ...basic, description: definition.description, fullEntry: definition } : basic;
}

export function filterMonsterdex(entries: readonly MonsterdexEntry[], filter: MonsterdexFilter = {}): readonly MonsterdexEntry[] {
  const query = filter.query?.trim().toLocaleLowerCase();
  return entries.filter((entry) => !query || entry.species.name.toLocaleLowerCase().includes(query) || String(entry.catalogNumber).includes(query))
    .filter((entry) => !filter.type || entry.species.types.includes(filter.type as SpeciesDefinition["types"][number]))
    .filter((entry) => !filter.rarity || entry.species.rarity === filter.rarity)
    .filter((entry) => !filter.status || entry.status === filter.status);
}

export function monsterdexProgress(entries: readonly MonsterdexEntry[]): MonsterdexProgress {
  const seen = entries.filter(({ status }) => status !== "UNKNOWN").length;
  const caught = entries.filter(({ status }) => status === "CAUGHT").length;
  return { total: entries.length, seen, caught, completionPercent: entries.length ? Math.round((caught / entries.length) * 100) : 0 };
}

export function sortMonsterdex(entries: readonly MonsterdexEntry[], sort: MonsterdexSort = "number"): readonly MonsterdexEntry[] {
  return [...entries].sort((a, b) => {
    if (sort === "name") return a.species.name.localeCompare(b.species.name) || a.catalogNumber - b.catalogNumber;
    if (sort === "rarity") return RARITY_ORDER[b.species.rarity] - RARITY_ORDER[a.species.rarity] || a.catalogNumber - b.catalogNumber;
    if (sort === "research") return b.researchLevel - a.researchLevel || b.ownedCount - a.ownedCount || a.catalogNumber - b.catalogNumber;
    return a.catalogNumber - b.catalogNumber;
  });
}

export function monsterdexEvolutionFamily(entries: readonly MonsterdexEntry[], catalogNumber: number): readonly MonsterdexEntry[] {
  const selected = entries.find((entry) => entry.catalogNumber === catalogNumber);
  if (!selected) return [];
  return entries.filter((entry) => entry.species.evolutionLineId === selected.species.evolutionLineId)
    .sort((a, b) => a.species.evolutionStage - b.species.evolutionStage || a.catalogNumber - b.catalogNumber);
}

export function nextMonsterdexMilestone(progress: MonsterdexProgress, interval = 10): { target: number; remaining: number } {
  if (progress.total <= 0) return { target: 0, remaining: 0 };
  const safeInterval = Math.max(1, Math.floor(interval));
  const target = Math.min(progress.total, Math.max(safeInterval, Math.ceil((progress.caught + 1) / safeInterval) * safeInterval));
  return { target, remaining: Math.max(0, target - progress.caught) };
}

export function adjacentMonsterdexEntry(entries: readonly MonsterdexEntry[], catalogNumber: number, direction: -1 | 1): MonsterdexEntry | undefined {
  const index = entries.findIndex((entry) => entry.catalogNumber === catalogNumber);
  if (index < 0 || !entries.length) return undefined;
  return entries[(index + direction + entries.length) % entries.length];
}
