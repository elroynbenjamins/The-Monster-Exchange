import type { GameType, SpeciesDefinition, StatId } from "../core/types.ts";

export interface TraitDefinition {
  id: string;
  name: string;
  statModifiers?: Partial<Record<StatId, number>>;
  marketModifier?: number;
  inheritable: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  type: GameType;
  power: number;
  energyCost: number;
  cooldown: number;
  target: "enemy" | "all-enemies" | "self" | "ally" | "all-allies";
  statusId?: string;
  statusChance?: number;
  healingPower?: number;
  shieldPower?: number;
  cleanseCount?: number;
}

export interface StatusDefinition {
  id: string;
  name: string;
  duration: number;
  maxStacks: number;
  tick: "after-action" | "none";
  damagePercentMaxHp?: number;
  speedModifier?: number;
  attackModifier?: number;
  preventsAction?: boolean;
  breaksOnDamage?: boolean;
}

export interface EvolutionDefinition {
  id: string;
  fromSpeciesId: string;
  toSpeciesId: string;
  requirements: { minLevel?: number; minPotential?: number; itemId?: string; regionId?: string };
}

export interface RegionDefinition {
  id: string;
  name: string;
  types: readonly GameType[];
  zoneIds: readonly string[];
}

export interface ZoneDefinition {
  id: string;
  regionId: string;
  levelRange: readonly [number, number];
  speciesPool: readonly { speciesId: string; weight: number }[];
  hazards: readonly string[];
  nodeWeights: Readonly<Record<"encounter" | "resource" | "choice" | "rest" | "discovery", number>>;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  maxLevel: number;
  baseBuildDays: number;
  baseCost: Readonly<Record<string, number>>;
  capability: "breeding" | "healing" | "storage" | "research" | "production" | "expedition";
}

export interface GameContent {
  contentVersion: number;
  species: readonly SpeciesDefinition[];
  traits: readonly TraitDefinition[];
  skills: readonly SkillDefinition[];
  statuses: readonly StatusDefinition[];
  evolutions: readonly EvolutionDefinition[];
  regions: readonly RegionDefinition[];
  zones: readonly ZoneDefinition[];
  buildings: readonly BuildingDefinition[];
}
