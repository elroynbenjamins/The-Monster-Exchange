import type { GameContent } from "./definitions.ts";
import { CATALOG_EVOLUTIONS, CATALOG_PASSIVES, CATALOG_SKILLS, CATALOG_SPECIES, speciesPoolForZone } from "./monster-catalog.ts";
import { GENERATED_V45_TRAITS } from "./generated-v45.ts";

export const content: GameContent = {
  contentVersion: 45,
  traits: GENERATED_V45_TRAITS,
  skills: [
    ...CATALOG_SKILLS,
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
  passives: CATALOG_PASSIVES,
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
  species: CATALOG_SPECIES,
  evolutions: CATALOG_EVOLUTIONS,
  regions: [
    { id: "greenreach", name: "Greenreach", types: ["grass", "bug", "poison"], zoneIds: ["greenreach-meadow", "greenreach-deepwood"] },
    { id: "frostmarch", name: "Frostmarch", types: ["ice", "water"], zoneIds: ["frostmarch-glacial-shelf"] },
    { id: "stormpeak", name: "Stormpeak", types: ["electric", "flying"], zoneIds: ["stormpeak-foothills"] },
    { id: "stonehollow", name: "Stonehollow", types: ["rock", "ground"], zoneIds: ["stonehollow-quarries"] },
    { id: "aurelia", name: "Aurelia", types: ["normal", "fairy", "psychic"], zoneIds: ["aurelia-riverbank"] },
    { id: "iron-dominion", name: "Iron Dominion", types: ["steel", "fighting"], zoneIds: ["iron-dominion-slagfields"] },
    { id: "mistwater-coast", name: "Mistwater Coast", types: ["water", "flying"], zoneIds: ["mistwater-reefs"] },
    { id: "mirefen", name: "Mirefen", types: ["poison", "ghost", "dark"], zoneIds: ["mirefen-rotten-basin"] },
    { id: "dragonspine", name: "Dragonspine", types: ["fire", "dragon"], zoneIds: ["dragonspine-molten-fangs"] },
    { id: "crystal-depths", name: "Crystal Depths", types: ["rock", "fairy", "psychic"], zoneIds: ["crystal-depths-prism-chasm"] },
    { id: "the-deep", name: "The Deep", types: ["water", "ghost", "dark"], zoneIds: ["the-deep-drowned-bastion"] },
    { id: "rift", name: "The Rift", types: ["ghost", "psychic", "dragon"], zoneIds: ["rift-anomaly-nests"] },
  ],
  zones: [
    { id: "greenreach-meadow", name: "Greenreach Meadow", description: "A rain-fed grassland where new field agents learn to track wild monsters and gather basic supplies.", regionId: "greenreach", levelRange: [2, 7], speciesPool: speciesPoolForZone("greenreach-meadow"), hazards: ["heavy-rain"], nodeWeights: { encounter: 45, resource: 25, choice: 12, rest: 10, discovery: 8 }, boss: { speciesId: "mossveil", level: 8, rewardCrowns: 150, researchNotes: 1, unlocksZoneId: "greenreach-deepwood" } },
    { id: "greenreach-deepwood", name: "Greenreach Deepwood", description: "An old, overgrown forest with valuable specimens, dense spore clouds, and few safe camps.", regionId: "greenreach", levelRange: [10, 18], speciesPool: speciesPoolForZone("greenreach-deepwood"), hazards: ["toxic-spores"], nodeWeights: { encounter: 50, resource: 18, choice: 15, rest: 7, discovery: 10 }, boss: { speciesId: "canopyre", level: 20, rewardCrowns: 400, researchNotes: 3, unlocksZoneId: "stormpeak-foothills" } },
    { id: "stormpeak-foothills", name: "Stormpeak Foothills", description: "Exposed highland trails where charged winds make every expedition fast, dangerous, and profitable.", regionId: "stormpeak", levelRange: [8, 14], speciesPool: speciesPoolForZone("stormpeak-foothills"), hazards: ["thunderstorm"], nodeWeights: { encounter: 48, resource: 20, choice: 14, rest: 8, discovery: 10 }, boss: { speciesId: "voltgrazer", level: 16, rewardCrowns: 300, researchNotes: 2 } },
    { id: "frostmarch-glacial-shelf", name: "Glacial Shelf", description: "Wind-carved ice fields beyond Glacierhold conceal frozen lakes, migrating herds, and unstable crystal caves.", regionId: "frostmarch", levelRange: [7, 13], speciesPool: speciesPoolForZone("frostmarch-glacial-shelf"), hazards: ["whiteout"], nodeWeights: { encounter: 46, resource: 22, choice: 12, rest: 9, discovery: 11 }, boss: { speciesId: "rimehorn", level: 15, rewardCrowns: 320, researchNotes: 2 } },
    { id: "stonehollow-quarries", name: "Grimstone Quarries", description: "Terraced quarries and abandoned lift tunnels hold mineral monsters, ore seams, and frequent rockfalls.", regionId: "stonehollow", levelRange: [9, 16], speciesPool: speciesPoolForZone("stonehollow-quarries"), hazards: ["cave-in"], nodeWeights: { encounter: 42, resource: 30, choice: 11, rest: 7, discovery: 10 }, boss: { speciesId: "cairnox", level: 18, rewardCrowns: 390, researchNotes: 2 } },
    { id: "aurelia-riverbank", name: "Riverbank Wilds", description: "Managed heartland preserves surround old ruins where adaptable and mystical species thrive near the capital.", regionId: "aurelia", levelRange: [12, 20], speciesPool: speciesPoolForZone("aurelia-riverbank"), hazards: ["arcane-mirage"], nodeWeights: { encounter: 44, resource: 18, choice: 18, rest: 10, discovery: 10 }, boss: { speciesId: "runebuck", level: 22, rewardCrowns: 480, researchNotes: 3 } },
    { id: "iron-dominion-slagfields", name: "Slagfields", description: "Industrial badlands of hot metal, rail ruins, and discarded machinery reward prepared Steel and Fighting teams.", regionId: "iron-dominion", levelRange: [15, 24], speciesPool: speciesPoolForZone("iron-dominion-slagfields"), hazards: ["smelter-heat"], nodeWeights: { encounter: 45, resource: 28, choice: 10, rest: 6, discovery: 11 }, boss: { speciesId: "bastionsect", level: 26, rewardCrowns: 600, researchNotes: 3 } },
    { id: "mistwater-reefs", name: "Coral Trench", description: "A maze of reefs, storm shoals, and flooded caves links island habitats across the Mistwater Coast.", regionId: "mistwater-coast", levelRange: [11, 19], speciesPool: speciesPoolForZone("mistwater-reefs"), hazards: ["riptide"], nodeWeights: { encounter: 49, resource: 19, choice: 12, rest: 8, discovery: 12 }, boss: { speciesId: "reefhowl", level: 21, rewardCrowns: 470, researchNotes: 3 } },
    { id: "mirefen-rotten-basin", name: "Rotten Basin", description: "Poisoned waterways and whispering fungal groves make Mirefen profitable only for resistant field teams.", regionId: "mirefen", levelRange: [18, 27], speciesPool: speciesPoolForZone("mirefen-rotten-basin"), hazards: ["toxic-spores"], nodeWeights: { encounter: 52, resource: 17, choice: 13, rest: 5, discovery: 13 }, boss: { speciesId: "bogrumbler", level: 29, rewardCrowns: 720, researchNotes: 4 } },
    { id: "dragonspine-molten-fangs", name: "The Molten Fangs", description: "Late-game volcanic ridges surround wyrm nests, magma caverns, and the oldest fire sanctuaries.", regionId: "dragonspine", levelRange: [32, 42], speciesPool: speciesPoolForZone("dragonspine-molten-fangs"), hazards: ["smelter-heat"], nodeWeights: { encounter: 54, resource: 18, choice: 11, rest: 5, discovery: 12 }, boss: { speciesId: "pyroclastor", level: 44, rewardCrowns: 1500, researchNotes: 7 } },
    { id: "crystal-depths-prism-chasm", name: "Prism Chasm", description: "Resonant crystal ravines distort light, thought, and distance around rare luminous habitats.", regionId: "crystal-depths", levelRange: [34, 44], speciesPool: speciesPoolForZone("crystal-depths-prism-chasm"), hazards: ["arcane-mirage"], nodeWeights: { encounter: 48, resource: 24, choice: 12, rest: 5, discovery: 11 }, boss: { speciesId: "facetoad", level: 46, rewardCrowns: 1600, researchNotes: 8 } },
    { id: "the-deep-drowned-bastion", name: "Drowned Bastion", description: "Sunken fortifications and blackwater channels hold abyssal species that rarely approach the surface.", regionId: "the-deep", levelRange: [38, 48], speciesPool: speciesPoolForZone("the-deep-drowned-bastion"), hazards: ["abyssal-pressure"], nodeWeights: { encounter: 56, resource: 15, choice: 12, rest: 4, discovery: 13 }, boss: { speciesId: "deepmaw", level: 50, rewardCrowns: 1900, researchNotes: 9 } },
    { id: "rift-anomaly-nests", name: "Anomaly Nests", description: "Fractured paths loop around Nullspire while void storms draw spectral and draconic monsters from unstable spaces.", regionId: "rift", levelRange: [42, 50], speciesPool: speciesPoolForZone("rift-anomaly-nests"), hazards: ["reality-shear"], nodeWeights: { encounter: 58, resource: 12, choice: 12, rest: 3, discovery: 15 }, boss: { speciesId: "riftwarden", level: 50, rewardCrowns: 2400, researchNotes: 12 } },
  ],
  hazards: [
    { id: "heavy-rain", name: "Heavy Rain", protectedTypes: ["water", "grass"], protectedTags: ["amphibious"], riskReduction: 0.12, description: "Water- and Grass-adapted teams navigate flooded ground more safely." },
    { id: "toxic-spores", name: "Toxic Spores", protectedTypes: ["poison", "steel"], protectedTags: ["plantlike"], riskReduction: 0.12, description: "Poison-resistant or plantlike monsters can identify safe paths." },
    { id: "thunderstorm", name: "Thunderstorm", protectedTypes: ["electric", "ground"], protectedTags: ["burrowing"], riskReduction: 0.12, description: "Conductive and grounded monsters sense or divert dangerous strikes." },
    { id: "whiteout", name: "Whiteout", protectedTypes: ["ice", "flying"], protectedTags: ["frostborn"], riskReduction: 0.12, description: "Ice-adapted and aerial scouts keep their bearings in blinding snow." },
    { id: "cave-in", name: "Cave-in", protectedTypes: ["rock", "ground", "steel"], protectedTags: ["burrowing", "mineral"], riskReduction: 0.12, description: "Stonewise monsters detect unstable tunnels before they collapse." },
    { id: "arcane-mirage", name: "Arcane Mirage", protectedTypes: ["psychic", "fairy", "dark"], protectedTags: ["mystic"], riskReduction: 0.12, description: "Mystical senses distinguish real routes from reflected ones." },
    { id: "smelter-heat", name: "Smelter Heat", protectedTypes: ["fire", "water", "steel"], protectedTags: ["heatborn", "armored"], riskReduction: 0.12, description: "Heat-resistant teams cross furnaces and lava channels safely." },
    { id: "riptide", name: "Riptide", protectedTypes: ["water", "flying", "electric"], protectedTags: ["aquatic", "aerial"], riskReduction: 0.12, description: "Aquatic and aerial monsters read violent coastal currents." },
    { id: "abyssal-pressure", name: "Abyssal Pressure", protectedTypes: ["water", "ghost", "steel"], protectedTags: ["aquatic", "spirit"], riskReduction: 0.12, description: "Deepwater and spectral teams endure crushing blackwater descents." },
    { id: "reality-shear", name: "Reality Shear", protectedTypes: ["ghost", "psychic", "dragon"], protectedTags: ["spirit", "mystic", "draconic"], riskReduction: 0.12, description: "Void-aware monsters anchor the team when paths fracture." },
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
