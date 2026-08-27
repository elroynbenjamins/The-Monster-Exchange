import type { MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import { createId } from "../core/id.ts";
import { calculatePotential, generateGenes } from "./genetics.ts";

export interface CreateMonsterOptions {
  day: number;
  level?: number;
  ownerId?: string;
  qualityBias?: number;
}

export function createMonster(species: SpeciesDefinition, rng: RandomSource, options: CreateMonsterOptions): MonsterIndividual {
  const genes = generateGenes(species, rng, options.qualityBias);
  const traitIds = rng.float() < 0.55 ? [rng.pick(species.traitPool)] : [];
  const knownSkillIds = species.skillPool.slice(0, Math.min(3, species.skillPool.length));
  return {
    id: createId("mon", rng), speciesId: species.id, sex: rng.pick(["female", "male"] as const),
    level: options.level ?? 1, xp: 0, genes, potential: calculatePotential(genes, species.geneCaps),
    traitIds, knownSkillIds, equippedSkillIds: knownSkillIds.slice(0, 3), ownerId: options.ownerId,
    bornOnDay: options.day, lineage: { parentIds: [], generation: 0 }, variantId: "base", fame: 0, wins: 0, losses: 0,
  };
}
