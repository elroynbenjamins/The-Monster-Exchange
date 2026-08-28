import type { MonsterIndividual } from "../core/types.ts";
import type { EvolutionDefinition } from "../content/definitions.ts";

export interface EvolutionContext {
  inventory?: Readonly<Record<string, number>>;
  inventoryItemIds?: readonly string[];
  regionId?: string;
  weather?: string;
  environmentTags?: readonly string[];
  researchLevel?: number;
  licenceIds?: readonly string[];
  storyMilestoneIds?: readonly string[];
}

export function evaluateEvolution(monster: MonsterIndividual, evolution: EvolutionDefinition, context: EvolutionContext = {}): { eligible: boolean; unmet: readonly string[] } {
  const unmet: string[] = [];
  if (monster.speciesId !== evolution.fromSpeciesId) unmet.push("wrong-species");
  if (evolution.requirements.minLevel && monster.level < evolution.requirements.minLevel) unmet.push("level");
  if (evolution.requirements.minPotential && monster.potential < evolution.requirements.minPotential) unmet.push("potential");
  if (evolution.requirements.minWins && monster.wins < evolution.requirements.minWins) unmet.push("wins");
  if (evolution.requirements.itemId) {
    const quantity = evolution.requirements.itemQuantity ?? 1;
    const available = context.inventory?.[evolution.requirements.itemId] ?? (context.inventoryItemIds?.includes(evolution.requirements.itemId) ? 1 : 0);
    if (available < quantity) unmet.push("item");
  }
  if (evolution.requirements.regionId && context.regionId !== evolution.requirements.regionId) unmet.push("region");
  if (evolution.requirements.weather && context.weather !== evolution.requirements.weather) unmet.push("weather");
  if (evolution.requirements.environmentTag && !context.environmentTags?.includes(evolution.requirements.environmentTag)) unmet.push("environment");
  if (evolution.requirements.minResearchLevel && (context.researchLevel ?? 0) < evolution.requirements.minResearchLevel) unmet.push("research");
  if (evolution.requirements.licenceId && !context.licenceIds?.includes(evolution.requirements.licenceId)) unmet.push("licence");
  if (evolution.requirements.storyMilestoneId && !context.storyMilestoneIds?.includes(evolution.requirements.storyMilestoneId)) unmet.push("story");
  return { eligible: unmet.length === 0, unmet };
}

export function evolve(monster: MonsterIndividual, evolution: EvolutionDefinition, context: EvolutionContext = {}): MonsterIndividual {
  const result = evaluateEvolution(monster, evolution, context);
  if (!result.eligible) throw new Error(`Evolution requirements unmet: ${result.unmet.join(", ")}`);
  return { ...monster, speciesId: evolution.toSpeciesId };
}
