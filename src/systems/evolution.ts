import type { MonsterIndividual } from "../core/types.ts";
import type { EvolutionDefinition } from "../content/definitions.ts";

export interface EvolutionContext { inventoryItemIds?: readonly string[]; regionId?: string }

export function evaluateEvolution(monster: MonsterIndividual, evolution: EvolutionDefinition, context: EvolutionContext = {}): { eligible: boolean; unmet: readonly string[] } {
  const unmet: string[] = [];
  if (monster.speciesId !== evolution.fromSpeciesId) unmet.push("wrong-species");
  if (evolution.requirements.minLevel && monster.level < evolution.requirements.minLevel) unmet.push("level");
  if (evolution.requirements.minPotential && monster.potential < evolution.requirements.minPotential) unmet.push("potential");
  if (evolution.requirements.itemId && !context.inventoryItemIds?.includes(evolution.requirements.itemId)) unmet.push("item");
  if (evolution.requirements.regionId && context.regionId !== evolution.requirements.regionId) unmet.push("region");
  return { eligible: unmet.length === 0, unmet };
}

export function evolve(monster: MonsterIndividual, evolution: EvolutionDefinition, context: EvolutionContext = {}): MonsterIndividual {
  const result = evaluateEvolution(monster, evolution, context);
  if (!result.eligible) throw new Error(`Evolution requirements unmet: ${result.unmet.join(", ")}`);
  return { ...monster, speciesId: evolution.toSpeciesId };
}
