export const GAME_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type GameType = (typeof GAME_TYPES)[number];
export type StatId = "hp" | "attack" | "defense" | "speed" | "energy";
export type Stats = Record<StatId, number>;
export type GeneId = Exclude<StatId, "energy">;
export type Genes = Record<GeneId, number>;
export type Sex = "female" | "male" | "neutral";
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface SpeciesObtainability {
  wildCatchable?: boolean;
  wildEncounterWeight?: number;
  breedable?: boolean;
  directHatch?: boolean;
  tradeable?: boolean;
  auctionEligible?: boolean;
  evolutionOnly?: boolean;
}

export interface SpeciesDefinition {
  id: string;
  /** Stable numeric identity from the design database. Save references continue to use `id`. */
  internalId: number;
  /** Display-only progression number. Never use this as a save identity. */
  dexNumber: number;
  /** @deprecated Compatibility alias for dexNumber. */
  catalogNumber: number;
  name: string;
  description: string;
  evolutionStage: number;
  evolutionLineLength: number;
  evolutionLineId: string;
  types: readonly [GameType, GameType?];
  tags: readonly string[];
  rarity: Rarity;
  battleRole: string;
  baseStats: Stats;
  geneCaps: Genes;
  traitPool: readonly string[];
  /** Stable workbook trait references retained for validation and future trait-engine expansion. */
  sourceTraitIds: readonly string[];
  breedingGroups: readonly string[];
  skillPool: readonly string[];
  /** Canonical workbook learnset references; runtime skills remain phase-gated. */
  sourceSkillIds: readonly string[];
  passiveId: string;
  sourcePassiveId: string;
  evolutionIds: readonly string[];
  habitats: readonly string[];
  baseMarketValue: number;
  weeklyMaterialValue: number;
  artId: string;
  obtainability?: SpeciesObtainability;
}

export interface Lineage {
  parentIds: readonly string[];
  generation: number;
}

export interface MonsterIndividual {
  id: string;
  speciesId: string;
  nickname?: string;
  sex: Sex;
  level: number;
  xp: number;
  genes: Genes;
  potential: number;
  traitIds: readonly string[];
  knownSkillIds: readonly string[];
  equippedSkillIds: readonly string[];
  ownerId?: string;
  bornOnDay: number;
  lineage: Lineage;
  variantId: string;
  fame: number;
  wins: number;
  losses: number;
  equipmentIds?: readonly string[];
}

export interface DomainEvent<T = unknown> {
  type: string;
  day: number;
  payload: T;
}
