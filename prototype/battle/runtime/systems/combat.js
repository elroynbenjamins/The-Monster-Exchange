                                                                                              
                                                                                      

                                                                                                                                                  

export function calculateCombatStats(monster                   , species                   , traits                            , equipment                                 = [])        {
  const growth = 1 + (monster.level - 1) * 0.035;
  const gene = (id                                       ) => 1 + monster.genes[id] / species.geneCaps[id] * 0.2;
  const modifier = (id             ) => 1 + monster.traitIds.reduce((sum, traitId) => sum + (traits.find((trait) => trait.id === traitId)?.statModifiers?.[id] ?? 0), 0);
  const equipmentModifier = (id             ) => 1 + (monster.equipmentIds ?? []).reduce((sum, equipmentId) => sum + (equipment.find((item) => item.id === equipmentId)?.statModifiers?.[id] ?? 0), 0);
  return {
    hp: Math.round(species.baseStats.hp * growth * gene("hp") * modifier("hp") * equipmentModifier("hp")),
    attack: Math.round(species.baseStats.attack * growth * gene("attack") * modifier("attack") * equipmentModifier("attack")),
    defense: Math.round(species.baseStats.defense * growth * gene("defense") * modifier("defense") * equipmentModifier("defense")),
    speed: Math.round(species.baseStats.speed * growth * gene("speed") * modifier("speed") * equipmentModifier("speed")),
    energy: Math.round(species.baseStats.energy * modifier("energy") * equipmentModifier("energy")),
  };
}

export const TYPE_CHART                                                               = {
  normal: { rock: 0.67, ghost: 0, steel: 0.67 },
  fire: { grass: 1.5, bug: 1.5, ice: 1.5, steel: 1.5, water: 0.67, fire: 0.67, rock: 0.67 },
  water: { fire: 1.5, rock: 1.5, ground: 1.5, water: 0.67, grass: 0.67 },
  grass: { water: 1.5, rock: 1.5, ground: 1.5, fire: 0.67, grass: 0.67, flying: 0.67, poison: 0.67 },
  electric: { water: 1.5, flying: 1.5, electric: 0.67, grass: 0.67, ground: 0 },
  ice: { grass: 1.5, ground: 1.5, flying: 1.5, dragon: 1.5, fire: 0.67, water: 0.67, ice: 0.67, steel: 0.67 },
  fighting: { normal: 1.5, ice: 1.5, rock: 1.5, dark: 1.5, steel: 1.5, poison: 0.67, flying: 0.67, psychic: 0.67, bug: 0.67, fairy: 0.67, ghost: 0 },
  poison: { grass: 1.5, fairy: 1.5, poison: 0.67, ground: 0.67, rock: 0.67, ghost: 0.67, steel: 0 },
  ground: { electric: 1.5, fire: 1.5, poison: 1.5, rock: 1.5, steel: 1.5, flying: 0 },
  flying: { grass: 1.5, fighting: 1.5, bug: 1.5, electric: 0.67, rock: 0.67, steel: 0.67 },
  psychic: { fighting: 1.5, poison: 1.5, psychic: 0.67, steel: 0.67, dark: 0 },
  bug: { grass: 1.5, psychic: 1.5, dark: 1.5, fire: 0.67, fighting: 0.67, poison: 0.67, flying: 0.67, ghost: 0.67, steel: 0.67, fairy: 0.67 },
  rock: { fire: 1.5, ice: 1.5, flying: 1.5, bug: 1.5, fighting: 0.67, ground: 0.67, steel: 0.67 },
  ghost: { psychic: 1.5, ghost: 1.5, dark: 0.67, normal: 0 },
  dragon: { dragon: 1.5, steel: 0.67, fairy: 0 },
  dark: { psychic: 1.5, ghost: 1.5, fighting: 0.67, dark: 0.67, fairy: 0.67 },
  steel: { ice: 1.5, rock: 1.5, fairy: 1.5, fire: 0.67, water: 0.67, electric: 0.67, steel: 0.67 },
  fairy: { fighting: 1.5, dragon: 1.5, dark: 1.5, fire: 0.67, poison: 0.67, steel: 0.67 },
};

export function typeMultiplier(attackType          , defenderTypes                     )         {
  const combined = defenderTypes.reduce((value, type) => value * (TYPE_CHART[attackType]?.[type] ?? 1), 1);
  return combined === 0 ? 0 : Math.max(0.5, Math.min(2.25, combined));
}

export function calculateDamage(power        , attacker                , defender                , multiplier = 1)         {
  if (power <= 0) return 0;
  const mitigation = 100 / (100 + Math.max(0, defender.stats.defense));
  return Math.max(1, Math.round(power * (attacker.stats.attack / 50) * mitigation * multiplier));
}

export function createCombatant(monster                   , species                   , traits                            , equipment                                 = [])                 {
  const stats = calculateCombatStats(monster, species, traits, equipment);
  return { monsterId: monster.id, stats, hp: stats.hp, energy: stats.energy, nextActionAt: 1000 / Math.max(1, stats.speed), statuses: [] };
}
