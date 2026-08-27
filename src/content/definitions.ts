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

export interface PassiveDefinition {
  id: string;
  name: string;
  statModifiers?: Partial<Record<StatId, number>>;
  teamShieldPercent?: number;
}

export interface SynergyDefinition {
  id: string;
  name: string;
  minimumMembers: number;
  requiredTypes?: Partial<Record<GameType, number>>;
  requiredTags?: Readonly<Record<string, number>>;
  statModifiers?: Partial<Record<StatId, number>>;
  teamShieldPercent?: number;
  displayText: string;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  statModifiers?: Partial<Record<StatId, number>>;
  expeditionStaminaModifier?: number;
  captureBonus?: number;
  description: string;
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
  boss?: { speciesId: string; level: number; rewardCrowns: number; researchNotes: number; unlocksZoneId?: string };
}

export interface HazardDefinition {
  id: string;
  name: string;
  protectedTypes?: readonly GameType[];
  protectedTags?: readonly string[];
  riskReduction: number;
  description: string;
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
  passives: readonly PassiveDefinition[];
  synergies: readonly SynergyDefinition[];
  equipment: readonly EquipmentDefinition[];
  evolutions: readonly EvolutionDefinition[];
  regions: readonly RegionDefinition[];
  zones: readonly ZoneDefinition[];
  hazards: readonly HazardDefinition[];
  buildings: readonly BuildingDefinition[];
}
