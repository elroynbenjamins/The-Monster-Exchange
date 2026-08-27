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
    { id: "grounding-hum", name: "Grounding Hum", type: "ground", power: 0, energyCost: 30, cooldown: 2, target: "all-allies", shieldPower: 24 },
    { id: "canopy-surge", name: "Canopy Surge", type: "grass", power: 65, energyCost: 55, cooldown: 3, target: "enemy" },
  ],
  statuses: [
    { id: "burn", name: "Burn", duration: 3, maxStacks: 1, tick: "after-action", damagePercentMaxHp: 0.04, attackModifier: -0.08 },
    { id: "poison", name: "Poison", duration: 3, maxStacks: 3, tick: "after-action", damagePercentMaxHp: 0.025 },
    { id: "shock", name: "Shock", duration: 2, maxStacks: 1, tick: "after-action", speedModifier: -0.2 },
    { id: "freeze", name: "Freeze", duration: 1, maxStacks: 1, tick: "after-action", speedModifier: -0.35 },
    { id: "sleep", name: "Sleep", duration: 2, maxStacks: 1, tick: "after-action", preventsAction: true, breaksOnDamage: true },
    { id: "stun", name: "Stun", duration: 1, maxStacks: 1, tick: "after-action", preventsAction: true },
    { id: "bleed", name: "Bleed", duration: 3, maxStacks: 2, tick: "after-action", damagePercentMaxHp: 0.035 },
    { id: "wet", name: "Wet", duration: 2, maxStacks: 1, tick: "after-action" },
    { id: "fear", name: "Fear", duration: 2, maxStacks: 1, tick: "after-action", attackModifier: -0.15 },
    { id: "confusion", name: "Confusion", duration: 2, maxStacks: 1, tick: "after-action" },
  ],
  passives: [
    { id: "dew-fed", name: "Dew Fed", statModifiers: { defense: 0.08 } },
    { id: "living-canopy", name: "Living Canopy", teamShieldPercent: 0.06 },
    { id: "storm-fed", name: "Storm Fed", statModifiers: { speed: 0.08 } },
  ],
  synergies: [
    { id: "pack-instinct", name: "Pack Instinct", minimumMembers: 2, requiredTags: { beast: 2 }, statModifiers: { speed: 0.05 }, displayText: "Two active Beast monsters gain +5% Speed." },
    { id: "verdant-harmony", name: "Verdant Harmony", minimumMembers: 2, requiredTypes: { grass: 1, fairy: 1 }, statModifiers: { defense: 0.04 }, displayText: "Active Grass and Fairy members gain +4% Defense." },
    { id: "grounded-circuit", name: "Grounded Circuit", minimumMembers: 2, requiredTypes: { electric: 1, ground: 1 }, statModifiers: { energy: 0.05 }, displayText: "An Electric and Ground formation gains +5% Energy." },
    { id: "toxic-canopy", name: "Toxic Canopy", minimumMembers: 2, requiredTypes: { grass: 1, poison: 1 }, teamShieldPercent: 0.04, displayText: "A Grass and Poison formation begins with a 4% HP shield." },
  ],
  equipment: [
    { id: "training-band", name: "Training Band", statModifiers: { attack: 0.08 }, description: "A weighted band that improves Attack." },
    { id: "guard-plate", name: "Guard Plate", statModifiers: { defense: 0.1, speed: -0.04 }, description: "Protective plating that trades a little Speed for Defense." },
    { id: "vital-charm", name: "Vital Charm", statModifiers: { hp: 0.1 }, description: "A stabilizing charm that raises maximum HP." },
    { id: "focus-coil", name: "Focus Coil", statModifiers: { energy: 0.1 }, description: "A conductive coil that increases battle Energy." },
    { id: "trail-harness", name: "Trail Harness", expeditionStaminaModifier: -0.15, description: "A balanced harness that reduces expedition Stamina use." },
    { id: "capture-lens", name: "Capture Lens", captureBonus: 0.08, description: "A field lens that improves capture calibration." },
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
    { id: "greenreach-meadow", name: "Greenreach Meadow", description: "A rain-fed grassland where new field agents learn to track wild monsters and gather basic supplies.", regionId: "greenreach", levelRange: [2, 7], speciesPool: [{ speciesId: "mossveil", weight: 100 }], hazards: ["heavy-rain"], nodeWeights: { encounter: 45, resource: 25, choice: 12, rest: 10, discovery: 8 }, boss: { speciesId: "mossveil", level: 8, rewardCrowns: 150, researchNotes: 1, unlocksZoneId: "greenreach-deepwood" } },
    { id: "greenreach-deepwood", name: "Greenreach Deepwood", description: "An old, overgrown forest with valuable specimens, dense spore clouds, and few safe camps.", regionId: "greenreach", levelRange: [10, 18], speciesPool: [{ speciesId: "mossveil", weight: 80 }, { speciesId: "canopyre", weight: 20 }], hazards: ["toxic-spores"], nodeWeights: { encounter: 50, resource: 18, choice: 15, rest: 7, discovery: 10 }, boss: { speciesId: "canopyre", level: 20, rewardCrowns: 400, researchNotes: 3, unlocksZoneId: "stormpeak-foothills" } },
    { id: "stormpeak-foothills", name: "Stormpeak Foothills", description: "Exposed highland trails where charged winds make every expedition fast, dangerous, and profitable.", regionId: "stormpeak", levelRange: [8, 14], speciesPool: [{ speciesId: "voltgrazer", weight: 100 }], hazards: ["thunderstorm"], nodeWeights: { encounter: 48, resource: 20, choice: 14, rest: 8, discovery: 10 }, boss: { speciesId: "voltgrazer", level: 16, rewardCrowns: 300, researchNotes: 2 } },
  ],
  hazards: [
    { id: "heavy-rain", name: "Heavy Rain", protectedTypes: ["water", "grass"], protectedTags: ["amphibious"], riskReduction: 0.12, description: "Water- and Grass-adapted teams navigate flooded ground more safely." },
    { id: "toxic-spores", name: "Toxic Spores", protectedTypes: ["poison", "steel"], protectedTags: ["plantlike"], riskReduction: 0.12, description: "Poison-resistant or plantlike monsters can identify safe paths." },
    { id: "thunderstorm", name: "Thunderstorm", protectedTypes: ["electric", "ground"], protectedTags: ["burrowing"], riskReduction: 0.12, description: "Conductive and grounded monsters sense or divert dangerous strikes." },
  ],
  buildings: [
    { id: "breeding-nest", name: "Breeding Nest", maxLevel: 5, baseBuildDays: 2, baseCost: { timber: 30, stone: 15 }, capability: "breeding" },
    { id: "field-clinic", name: "Field Clinic", maxLevel: 5, baseBuildDays: 1, baseCost: { timber: 20, herbs: 15 }, capability: "healing" },
    { id: "expedition-lodge", name: "Expedition Lodge", maxLevel: 5, baseBuildDays: 3, baseCost: { timber: 40, stone: 20 }, capability: "expedition" },
    { id: "research-lab", name: "Research Lab", maxLevel: 5, baseBuildDays: 2, baseCost: { timber: 25, stone: 20, herbs: 10 }, capability: "research" },
    { id: "field-workshop", name: "Field Workshop", maxLevel: 5, baseBuildDays: 2, baseCost: { timber: 35, stone: 15 }, capability: "production" },
  ],
  contracts: [
    { id: "meadow-survey", name: "Meadow Survey", description: "Complete an expedition through Greenreach Meadow.", objective: { event: "complete-expedition", targetId: "greenreach-meadow", required: 1 }, durationDays: 5, reward: { crowns: 120, reputation: 1, items: { "field-capsule": 1 } } },
    { id: "mossveil-census", name: "Mossveil Census", description: "Capture two Mossveil for the regional population census.", objective: { event: "capture-species", targetId: "mossveil", required: 2 }, durationDays: 8, reward: { crowns: 180, reputation: 2 } },
    { id: "alpha-control", name: "Alpha Control", description: "Defeat a protected alpha at the end of an expedition.", objective: { event: "defeat-boss", required: 1 }, durationDays: 7, reward: { crowns: 250, reputation: 2, items: { "research-notes": 1 } } },
    { id: "market-liquidity", name: "Market Liquidity", description: "Complete a player monster sale on the Exchange.", objective: { event: "sell-monster", required: 1 }, durationDays: 10, reward: { crowns: 150, reputation: 1 } },
  ],
  recipes: [
    { id: "craft-field-capsule", name: "Field Capsule", inputs: { herbs: 2, stone: 1 }, outputs: { "field-capsule": 1 }, requiredBuildingId: "field-workshop", requiredBuildingLevel: 1 },
    { id: "craft-training-band", name: "Training Band", inputs: { timber: 3, stone: 2 }, outputs: { "training-band": 1 }, requiredBuildingId: "field-workshop", requiredBuildingLevel: 2 },
    { id: "craft-trail-harness", name: "Trail Harness", inputs: { timber: 4, herbs: 2 }, outputs: { "trail-harness": 1 }, requiredBuildingId: "field-workshop", requiredBuildingLevel: 2 },
    { id: "craft-capture-lens", name: "Capture Lens", inputs: { stone: 5, "research-notes": 2 }, outputs: { "capture-lens": 1 }, requiredBuildingId: "field-workshop", requiredBuildingLevel: 3 },
  ],
  trainers: [
    { id: "rival-rowan", name: "Rowan Vale", role: "rival", specialty: "Competitive battling and market timing", teamSpeciesIds: ["voltgrazer", "mossveil"], startingLevel: 5, trainingXpPerDay: 28, challengeRewardCrowns: 120, description: "An ambitious trader-trainer who wants to reach the Exchange rankings before you." },
    { id: "friend-tessa", name: "Tessa Reed", role: "friend", specialty: "Ecology, field research, and unusual traits", teamSpeciesIds: ["mossveil"], startingLevel: 4, trainingXpPerDay: 20, challengeRewardCrowns: 80, description: "A patient field researcher who shares discoveries and tests new teams with you." },
  ],
};

export function byId<T extends { id: string }>(definitions: readonly T[], id: string): T {
  const found = definitions.find((definition) => definition.id === id);
  if (!found) throw new Error(`Unknown content id: ${id}`);
  return found;
}
