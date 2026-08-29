import type { SpeciesDefinition } from "../core/types.ts";
import type { GameState } from "../game/state.ts";

export type MonsterdexStatus = "unknown" | "seen" | "caught";

export interface MonsterdexEntry {
  catalogNumber: number;
  species: SpeciesDefinition;
  status: MonsterdexStatus;
  researchLevel: number;
  ownedCount: number;
  cardAssetId?: string;
  portraitAssetId?: string;
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

export function cardAssetId(catalogNumber: number, speciesId: string): string | undefined {
  if (!Number.isInteger(catalogNumber) || catalogNumber < 1 || catalogNumber > 90) return undefined;
  return `monsterdex/cards/${String(catalogNumber).padStart(3, "0")}--${speciesId}--card.png`;
}

export function portraitAssetId(catalogNumber: number, speciesId: string): string | undefined {
  if (!Number.isInteger(catalogNumber) || catalogNumber < 1 || catalogNumber > 90) return undefined;
  return `monsterdex/portraits/${String(catalogNumber).padStart(3, "0")}--${speciesId}--portrait.png`;
}

export function buildMonsterdexEntries(species: readonly SpeciesDefinition[], state: GameState): readonly MonsterdexEntry[] {
  const ownedCounts = new Map<string, number>();
  for (const monsterId of state.player.monsterIds) {
    const speciesId = state.monsters[monsterId]?.speciesId;
    if (speciesId) ownedCounts.set(speciesId, (ownedCounts.get(speciesId) ?? 0) + 1);
  }
  return [...species].sort((a, b) => a.catalogNumber - b.catalogNumber).map((definition) => {
    const ownedCount = ownedCounts.get(definition.id) ?? 0;
    const researchLevel = state.player.researchBySpecies[definition.id]?.level ?? 0;
    return {
      catalogNumber: definition.catalogNumber,
      species: definition,
      status: ownedCount > 0 ? "caught" : researchLevel > 0 ? "seen" : "unknown",
      researchLevel,
      ownedCount,
      cardAssetId: cardAssetId(definition.catalogNumber, definition.id),
      portraitAssetId: portraitAssetId(definition.catalogNumber, definition.id),
    };
  });
}

export function filterMonsterdex(entries: readonly MonsterdexEntry[], filter: MonsterdexFilter = {}): readonly MonsterdexEntry[] {
  const query = filter.query?.trim().toLocaleLowerCase();
  return entries.filter((entry) => !query || entry.species.name.toLocaleLowerCase().includes(query) || String(entry.catalogNumber).includes(query))
    .filter((entry) => !filter.type || entry.species.types.includes(filter.type as SpeciesDefinition["types"][number]))
    .filter((entry) => !filter.rarity || entry.species.rarity === filter.rarity)
    .filter((entry) => !filter.status || entry.status === filter.status);
}

export function monsterdexProgress(entries: readonly MonsterdexEntry[]): MonsterdexProgress {
  const seen = entries.filter(({ status }) => status !== "unknown").length;
  const caught = entries.filter(({ status }) => status === "caught").length;
  return { total: entries.length, seen, caught, completionPercent: entries.length ? Math.round((caught / entries.length) * 100) : 0 };
}

export function adjacentMonsterdexEntry(entries: readonly MonsterdexEntry[], catalogNumber: number, direction: -1 | 1): MonsterdexEntry | undefined {
  const index = entries.findIndex((entry) => entry.catalogNumber === catalogNumber);
  if (index < 0 || !entries.length) return undefined;
  return entries[(index + direction + entries.length) % entries.length];
}
