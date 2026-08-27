import type { GameType, MonsterIndividual, SpeciesDefinition, Stats } from "../core/types.ts";
import type { TraitDefinition } from "../content/definitions.ts";

export interface CombatantState { monsterId: string; stats: Stats; hp: number; energy: number; nextActionAt: number; statuses: readonly string[] }

export function calculateCombatStats(monster: MonsterIndividual, species: SpeciesDefinition, traits: readonly TraitDefinition[]): Stats {
  const growth = 1 + (monster.level - 1) * 0.035;
  const gene = (id: "hp" | "attack" | "defense" | "speed") => 1 + monster.genes[id] / species.geneCaps[id] * 0.2;
  const modifier = (id: keyof Stats) => 1 + monster.traitIds.reduce((sum, traitId) => sum + (traits.find((trait) => trait.id === traitId)?.statModifiers?.[id] ?? 0), 0);
  return {
    hp: Math.round(species.baseStats.hp * growth * gene("hp") * modifier("hp")),
    attack: Math.round(species.baseStats.attack * growth * gene("attack") * modifier("attack")),
    defense: Math.round(species.baseStats.defense * growth * gene("defense") * modifier("defense")),
    speed: Math.round(species.baseStats.speed * growth * gene("speed") * modifier("speed")),
    energy: Math.round(species.baseStats.energy * modifier("energy")),
  };
}

export const TYPE_CHART: Partial<Record<GameType, Partial<Record<GameType, number>>>> = {
  fire: { grass: 1.5, bug: 1.5, ice: 1.5, steel: 1.5, water: 0.67, fire: 0.67, rock: 0.67 },
  water: { fire: 1.5, rock: 1.5, ground: 1.5, water: 0.67, grass: 0.67 },
  grass: { water: 1.5, rock: 1.5, ground: 1.5, fire: 0.67, grass: 0.67, flying: 0.67, poison: 0.67 },
  electric: { water: 1.5, flying: 1.5, electric: 0.67, grass: 0.67, ground: 0 },
  ground: { electric: 1.5, fire: 1.5, poison: 1.5, rock: 1.5, steel: 1.5, flying: 0 },
};

export function typeMultiplier(attackType: GameType, defenderTypes: readonly GameType[]): number {
  const combined = defenderTypes.reduce((value, type) => value * (TYPE_CHART[attackType]?.[type] ?? 1), 1);
  return combined === 0 ? 0 : Math.max(0.5, Math.min(2.25, combined));
}

export function calculateDamage(power: number, attacker: CombatantState, defender: CombatantState, multiplier = 1): number {
  if (power <= 0) return 0;
  const mitigation = 100 / (100 + Math.max(0, defender.stats.defense));
  return Math.max(1, Math.round(power * (attacker.stats.attack / 50) * mitigation * multiplier));
}

export function createCombatant(monster: MonsterIndividual, species: SpeciesDefinition, traits: readonly TraitDefinition[]): CombatantState {
  const stats = calculateCombatStats(monster, species, traits);
  return { monsterId: monster.id, stats, hp: stats.hp, energy: stats.energy, nextActionAt: 1000 / Math.max(1, stats.speed), statuses: [] };
}
