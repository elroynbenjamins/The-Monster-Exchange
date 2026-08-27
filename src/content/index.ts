import type { GameContent } from "./definitions.ts";

export const content: GameContent = {
  contentVersion: 1,
  traits: [
    { id: "hardy", name: "Hardy", statModifiers: { hp: 0.1 }, inheritable: true },
    { id: "keen-senses", name: "Keen Senses", statModifiers: { speed: 0.06 }, marketModifier: 0.04, inheritable: true },
    { id: "patient", name: "Patient", statModifiers: { defense: 0.06 }, inheritable: true },
  ],
  skills: [
    { id: "root-lash", name: "Root Lash", type: "grass", power: 42, energyCost: 20, cooldown: 0, target: "enemy" },
    { id: "spore-veil", name: "Spore Veil", type: "poison", power: 12, energyCost: 35, cooldown: 2, target: "all-enemies", statusId: "poison", statusChance: 0.35 },
    { id: "static-prance", name: "Static Prance", type: "electric", power: 48, energyCost: 25, cooldown: 0, target: "enemy", statusId: "shock", statusChance: 0.2 },
    { id: "grounding-hum", name: "Grounding Hum", type: "ground", power: 0, energyCost: 30, cooldown: 2, target: "all-allies" },
    { id: "canopy-surge", name: "Canopy Surge", type: "grass", power: 65, energyCost: 55, cooldown: 3, target: "enemy" },
  ],
  species: [
    {
      id: "mossveil", name: "Mossveil", types: ["grass", "poison"], tags: ["plantlike", "mollusk"], rarity: "common",
      baseStats: { hp: 54, attack: 38, defense: 52, speed: 31, energy: 100 },
      geneCaps: { hp: 31, attack: 31, defense: 31, speed: 31 }, traitPool: ["hardy", "patient"],
      breedingGroups: ["verdant"], skillPool: ["root-lash", "spore-veil"], passiveId: "dew-fed",
      evolutionIds: ["mossveil-to-canopyre"], habitats: ["greenreach-meadow"], baseMarketValue: 220,
      artId: "monsters/mossveil/mossveil--base--idle--right",
    },
    {
      id: "canopyre", name: "Canopyre", types: ["grass", "fairy"], tags: ["plantlike", "mollusk"], rarity: "uncommon",
      baseStats: { hp: 76, attack: 58, defense: 71, speed: 46, energy: 100 },
      geneCaps: { hp: 31, attack: 31, defense: 31, speed: 31 }, traitPool: ["hardy", "patient"],
      breedingGroups: ["verdant"], skillPool: ["root-lash", "spore-veil", "canopy-surge"], passiveId: "living-canopy",
      evolutionIds: [], habitats: ["greenreach-deepwood"], baseMarketValue: 610,
      artId: "monsters/canopyre/canopyre--base--idle--right",
    },
    {
      id: "voltgrazer", name: "Voltgrazer", types: ["electric", "ground"], tags: ["beast", "herd"], rarity: "uncommon",
      baseStats: { hp: 62, attack: 55, defense: 45, speed: 68, energy: 100 },
      geneCaps: { hp: 31, attack: 31, defense: 31, speed: 31 }, traitPool: ["keen-senses", "patient"],
      breedingGroups: ["field"], skillPool: ["static-prance", "grounding-hum"], passiveId: "storm-fed",
      evolutionIds: [], habitats: ["stormpeak-foothills"], baseMarketValue: 430,
      artId: "monsters/voltgrazer/voltgrazer--base--idle--right",
    },
  ],
  evolutions: [
    { id: "mossveil-to-canopyre", fromSpeciesId: "mossveil", toSpeciesId: "canopyre", requirements: { minLevel: 18, minPotential: 55 } },
  ],
  regions: [
    { id: "greenreach", name: "Greenreach", types: ["grass", "bug", "poison"], zoneIds: ["greenreach-meadow", "greenreach-deepwood"] },
    { id: "stormpeak", name: "Stormpeak Isles", types: ["electric", "flying"], zoneIds: ["stormpeak-foothills"] },
  ],
  zones: [
    { id: "greenreach-meadow", regionId: "greenreach", levelRange: [2, 7], speciesPool: [{ speciesId: "mossveil", weight: 100 }], hazards: ["heavy-rain"], nodeWeights: { encounter: 45, resource: 25, choice: 12, rest: 10, discovery: 8 } },
    { id: "greenreach-deepwood", regionId: "greenreach", levelRange: [10, 18], speciesPool: [{ speciesId: "mossveil", weight: 80 }, { speciesId: "canopyre", weight: 20 }], hazards: ["toxic-spores"], nodeWeights: { encounter: 50, resource: 18, choice: 15, rest: 7, discovery: 10 } },
    { id: "stormpeak-foothills", regionId: "stormpeak", levelRange: [8, 14], speciesPool: [{ speciesId: "voltgrazer", weight: 100 }], hazards: ["thunderstorm"], nodeWeights: { encounter: 48, resource: 20, choice: 14, rest: 8, discovery: 10 } },
  ],
  buildings: [
    { id: "breeding-nest", name: "Breeding Nest", maxLevel: 5, baseBuildDays: 2, baseCost: { timber: 30, stone: 15 }, capability: "breeding" },
    { id: "field-clinic", name: "Field Clinic", maxLevel: 5, baseBuildDays: 1, baseCost: { timber: 20, herbs: 15 }, capability: "healing" },
    { id: "expedition-lodge", name: "Expedition Lodge", maxLevel: 5, baseBuildDays: 3, baseCost: { timber: 40, stone: 20 }, capability: "expedition" },
  ],
};

export function byId<T extends { id: string }>(definitions: readonly T[], id: string): T {
  const found = definitions.find((definition) => definition.id === id);
  if (!found) throw new Error(`Unknown content id: ${id}`);
  return found;
}
