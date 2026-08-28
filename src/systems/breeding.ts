import type { MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import { createId } from "../core/id.ts";
import { calculatePotential, inheritGenes } from "./genetics.ts";

export interface BreedResult { offspring: MonsterIndividual; inheritedFrom: Readonly<Record<string, string>> }

export function canBreed(a: MonsterIndividual, b: MonsterIndividual, speciesA: SpeciesDefinition, speciesB: SpeciesDefinition): { ok: boolean; reason?: string } {
  if (a.id === b.id) return { ok: false, reason: "A monster cannot breed with itself." };
  if (speciesA.obtainability?.breedable === false || speciesB.obtainability?.breedable === false) return { ok: false, reason: "One of these species cannot be bred." };
  if (speciesA.obtainability?.directHatch === false && speciesB.obtainability?.directHatch === false) return { ok: false, reason: "Neither species can hatch directly; use an earlier evolution stage." };
  if (a.sex !== "neutral" && b.sex !== "neutral" && a.sex === b.sex) return { ok: false, reason: "This pair is not compatible." };
  if (!speciesA.breedingGroups.some((group) => speciesB.breedingGroups.includes(group))) return { ok: false, reason: "No shared breeding group." };
  if (a.lineage.parentIds.includes(b.id) || b.lineage.parentIds.includes(a.id)) return { ok: false, reason: "Parent/offspring breeding is blocked." };
  if (a.lineage.parentIds.some((id) => b.lineage.parentIds.includes(id))) return { ok: false, reason: "Sibling breeding is blocked." };
  return { ok: true };
}

export function breed(a: MonsterIndividual, b: MonsterIndividual, speciesA: SpeciesDefinition, speciesB: SpeciesDefinition, rng: RandomSource, day: number, ownerId?: string): BreedResult {
  const compatibility = canBreed(a, b, speciesA, speciesB);
  if (!compatibility.ok) throw new Error(compatibility.reason);
  const hatchableSpecies = [speciesA, speciesB].filter((species) => species.obtainability?.directHatch !== false);
  const childSpecies = rng.pick(hatchableSpecies);
  const genes = inheritGenes(a.genes, b.genes, childSpecies.geneCaps, rng);
  const inheritableTraits = [...new Set([...a.traitIds, ...b.traitIds])];
  const traitIds = inheritableTraits.length && rng.float() < 0.6 ? [rng.pick(inheritableTraits)] : [];
  const sharedOrSpeciesSkills = [...new Set([...a.knownSkillIds, ...b.knownSkillIds])].filter((skill) => childSpecies.skillPool.includes(skill));
  const knownSkillIds = sharedOrSpeciesSkills.slice(0, 2);
  return {
    offspring: {
      id: createId("mon", rng), speciesId: childSpecies.id, sex: rng.pick(["female", "male"] as const), level: 1, xp: 0,
      genes, potential: calculatePotential(genes, childSpecies.geneCaps), traitIds, knownSkillIds,
      equippedSkillIds: knownSkillIds.slice(0, 3), ownerId, bornOnDay: day,
      lineage: { parentIds: [a.id, b.id], generation: Math.max(a.lineage.generation, b.lineage.generation) + 1 },
      variantId: "base", fame: 0, wins: 0, losses: 0, equipmentIds: [],
    },
    inheritedFrom: Object.fromEntries(knownSkillIds.map((skill) => [skill, a.knownSkillIds.includes(skill) ? a.id : b.id])),
  };
}
