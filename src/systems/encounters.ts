import type { MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import type { ZoneDefinition } from "../content/definitions.ts";
import { createMonster } from "./monsters.ts";

export interface WildEncounter {
  monster: MonsterIndividual;
  species: SpeciesDefinition;
  estimatedPotential: readonly [number, number];
  captureDifficulty: number;
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

export function generateWildEncounter(zone: ZoneDefinition, species: readonly SpeciesDefinition[], rng: RandomSource, day: number): WildEncounter {
  const definition = weightedSpecies(zone, species, rng);
  const monster = createMonster(definition, rng, { day, level: rng.int(zone.levelRange[0], zone.levelRange[1]) });
  const uncertainty = rng.int(8, 18);
  return {
    monster, species: definition,
    estimatedPotential: [Math.max(0, monster.potential - uncertainty), Math.min(100, monster.potential + uncertainty)],
    captureDifficulty: 0.28 + monster.level * 0.012 + ({ common: 0, uncommon: 0.08, rare: 0.18, epic: 0.3, legendary: 0.45 }[definition.rarity]),
  };
}

export function captureChance(encounter: WildEncounter, remainingHpRatio: number, capsuleBonus = 0): number {
  const weakenedBonus = (1 - Math.max(0, Math.min(1, remainingHpRatio))) * 0.58;
  return Math.max(0.05, Math.min(0.95, 0.42 + weakenedBonus + capsuleBonus - encounter.captureDifficulty));
}

export function attemptCapture(encounter: WildEncounter, remainingHpRatio: number, rng: RandomSource, capsuleBonus = 0): { captured: boolean; chance: number } {
  const chance = captureChance(encounter, remainingHpRatio, capsuleBonus);
  return { captured: rng.float() < chance, chance };
}
