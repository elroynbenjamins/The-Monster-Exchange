import type { MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import type { ZoneDefinition } from "../content/definitions.ts";
import { createMonster } from "./monsters.ts";

export interface WildEncounter {
  monster: MonsterIndividual;
  species: SpeciesDefinition;
  estimatedPotential: readonly [number, number];
  captureDifficulty: number;
  researchLevel: number;
  revealedTraitIds: readonly string[];
  exactPotential?: number;
  isBoss: boolean;
}

function weightedSpecies(zone: ZoneDefinition, species: readonly SpeciesDefinition[], rng: RandomSource): SpeciesDefinition {
  const total = zone.speciesPool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng.float() * total;
  for (const entry of zone.speciesPool) {
    roll -= entry.weight;
    if (roll <= 0) {
      const definition = species.find(({ id }) => id === entry.speciesId);
      if (!definition) throw new Error(`Zone ${zone.id} references unknown species ${entry.speciesId}.`);
      return definition;
    }
  }
  throw new Error(`Zone ${zone.id} has an invalid species pool.`);
}

export function generateWildEncounter(zone: ZoneDefinition, species: readonly SpeciesDefinition[], rng: RandomSource, day: number, research: number | Readonly<Record<string, number>> = 0): WildEncounter {
  const definition = weightedSpecies(zone, species, rng);
  const monster = createMonster(definition, rng, { day, level: rng.int(zone.levelRange[0], zone.levelRange[1]) });
  const researchLevel = typeof research === "number" ? research : (research[definition.id] ?? 0);
  const baseUncertainty = [18, 14, 10, 6, 3, 0][Math.max(0, Math.min(5, researchLevel))]!;
  const uncertainty = researchLevel >= 5 ? 0 : baseUncertainty + rng.int(0, 4);
  return {
    monster, species: definition,
    estimatedPotential: [Math.max(0, monster.potential - uncertainty), Math.min(100, monster.potential + uncertainty)],
    captureDifficulty: 0.28 + monster.level * 0.012 + ({ common: 0, uncommon: 0.08, rare: 0.18, epic: 0.3, legendary: 0.45 }[definition.rarity]),
    researchLevel,
    revealedTraitIds: researchLevel >= 4 ? monster.traitIds : [],
    exactPotential: researchLevel >= 5 ? monster.potential : undefined,
    isBoss: false,
  };
}

export function generateBossEncounter(zone: ZoneDefinition, species: readonly SpeciesDefinition[], rng: RandomSource, day: number, research: number | Readonly<Record<string, number>> = 0): WildEncounter {
  if (!zone.boss) throw new Error(`Zone ${zone.id} has no boss encounter.`);
  const definition = species.find(({ id }) => id === zone.boss!.speciesId);
  if (!definition) throw new Error(`Zone ${zone.id} references unknown boss species ${zone.boss.speciesId}.`);
  const monster = createMonster(definition, rng, { day, level: zone.boss.level, qualityBias: 0.3, ownerId: "wild" });
  const researchLevel = typeof research === "number" ? research : (research[definition.id] ?? 0);
  const baseUncertainty = [18, 14, 10, 6, 3, 0][Math.max(0, Math.min(5, researchLevel))]!;
  const uncertainty = researchLevel >= 5 ? 0 : baseUncertainty + rng.int(0, 4);
  return {
    monster,
    species: definition,
    estimatedPotential: [Math.max(0, monster.potential - uncertainty), Math.min(100, monster.potential + uncertainty)],
    captureDifficulty: 1,
    researchLevel,
    revealedTraitIds: researchLevel >= 4 ? monster.traitIds : [],
    exactPotential: researchLevel >= 5 ? monster.potential : undefined,
    isBoss: true,
  };
}

export function captureChance(encounter: WildEncounter, remainingHpRatio: number, capsuleBonus = 0): number {
  if (encounter.isBoss) return 0;
  const weakenedBonus = (1 - Math.max(0, Math.min(1, remainingHpRatio))) * 0.58;
  return Math.max(0.05, Math.min(0.95, 0.42 + weakenedBonus + capsuleBonus - encounter.captureDifficulty));
}

export function attemptCapture(encounter: WildEncounter, remainingHpRatio: number, rng: RandomSource, capsuleBonus = 0): { captured: boolean; chance: number } {
  const chance = captureChance(encounter, remainingHpRatio, capsuleBonus);
  return { captured: rng.float() < chance, chance };
}
