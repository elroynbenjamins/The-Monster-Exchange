import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../data/design-v45/", import.meta.url);
const output = new URL("../src/content/generated-v45.ts", import.meta.url);
const read = async (name) => JSON.parse(await readFile(new URL(name, root), "utf8"));
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const [catalog, stats, dexRows, dexCatalog, paths, markets, traitCatalog, traitPools, obtainability, learnsets, passives] = await Promise.all([
  read("species-catalog.json"), read("species-combat-stats.json"), read("full-dex-order.json"),
  read("monsterdex-catalog.json"), read("evolution-paths.json"), read("species-market-baselines.json"),
  read("trait-catalog.json"), read("species-trait-pools.json"), read("obtainability-matrix.json"),
  read("species-skill-learnsets.json"), read("species-passives.json"),
]);
const validDex = dexRows.filter((row) => Number.isInteger(row["Dex #"]) && Number.isInteger(row["Internal Species ID"]));
const dexById = new Map(validDex.map((row) => [row["Internal Species ID"], row["Dex #"]]));
const dexDescription = new Map(dexCatalog.map((row) => [row.Species, row["Dex Description"]]));
const combatRoleById = new Map(stats.map((row) => [row["Monster ID"], String(row["Battle Role"] ?? "Balanced").toLowerCase()]));
const lineById = new Map();
for (const row of paths) {
  lineById.set(row["From ID"], row["Evolution Line"]);
  lineById.set(row["To ID"], row["Evolution Line"]);
}
const concepts = catalog.map((row) => {
  const stageText = String(row["Evolution Stage"] ?? "Standalone");
  const match = stageText.match(/(\d+)\s*\/\s*(\d+)/);
  const internalId = row.ID;
  return {
    internalId,
    dexNumber: dexById.get(internalId),
    name: row.Name,
    types: [String(row["Type 1"]).toLowerCase(), row["Type 2"] ? String(row["Type 2"]).toLowerCase() : null].filter(Boolean),
    rarity: String(row.Rarity).toLowerCase(),
    battleRole: combatRoleById.get(internalId) || "balanced",
    description: dexDescription.get(row.Name) || row["Dex Description"] || row["Concept Summary"] || `${row.Name} is a documented Monster Exchange species.`,
    stage: match ? Number(match[1]) : 1,
    totalStages: match ? Number(match[2]) : 1,
    lineId: slug(row["Evolution Line"] || lineById.get(internalId) || row.Name),
  };
});
const statsById = Object.fromEntries(stats.map((row) => [slug(row.Species), {
  hp: row["Base HP"], attack: row["Base Attack"], defense: row["Base Defense"], speed: row["Base Speed"], energy: row["Base Energy"],
}]));
const marketById = Object.fromEntries(markets.map((row) => [slug(row.Species), row["Baseline Species Value"]]));
const zoneByRegion = {
  Greenreach: "greenreach-meadow", Stormpeak: "stormpeak-foothills", Frostmarch: "frostmarch-glacial-shelf",
  Stonehollow: "stonehollow-quarries", Aurelia: "aurelia-riverbank", "Iron Dominion": "iron-dominion-slagfields",
  "Mistwater Coast": "mistwater-reefs", Mirefen: "mirefen-rotten-basin", Dragonspine: "dragonspine-molten-fangs",
  "Crystal Depths": "crystal-depths-prism-chasm", "The Deep": "the-deep-drowned-bastion", "The Rift": "rift-anomaly-nests",
};
const integrations = Object.fromEntries(catalog.map((row) => {
  const id = row.ID;
  const obtain = obtainability.find((candidate) => candidate["Monster ID"] === id);
  const market = markets.find((candidate) => candidate["Monster ID"] === id);
  const habitats = [row["Primary Region"], row["Secondary Region"]].map((region) => {
    if (region === "Greenreach" && /forest|grove|wood|thicket|canopy/i.test(String(row["Habitat / Ecology"] ?? ""))) return "greenreach-deepwood";
    return zoneByRegion[region];
  }).filter(Boolean);
  return [slug(row.Name), {
    traitPool: traitPools.filter((candidate) => candidate["Monster ID"] === id && candidate.Eligible !== "No").map((candidate) => slug(candidate.Trait)),
    sourceTraitIds: traitPools.filter((candidate) => candidate["Monster ID"] === id && candidate.Eligible !== "No").map((candidate) => candidate["Trait ID"]),
    sourceSkillIds: learnsets.filter((candidate) => candidate["Monster ID"] === id).map((candidate) => candidate["Skill ID"]),
    sourcePassiveId: passives.find((candidate) => candidate["Monster ID"] === id)?.["Passive ID"],
    habitats, weeklyMaterialValue: market?.["Weekly Passive Material Value"] ?? 0,
    obtainability: {
      wildCatchable: obtain?.["Ordinary Wild?"] === "Yes", evolutionOnly: obtain?.["Evolution Only?"] === "Yes",
      directHatch: obtain?.["Evolution Only?"] !== "Yes", tradeable: obtain?.["Auction Eligible?"] !== "No",
      auctionEligible: ["Yes", "Conditional"].includes(obtain?.["Auction Eligible?"]),
    },
  }];
}));
const generatedTraits = traitCatalog.map((row) => {
  const modifiers = {};
  for (const stat of ["HP", "Attack", "Defense", "Speed"]) {
    const match = String(row["Numeric Effect"] ?? "").match(new RegExp(`([+-]\\d+)% ${stat}`, "i"));
    if (match) modifiers[stat.toLowerCase()] = Number(match[1]) / 100;
  }
  const marketMatch = String(row["Economic Effect"] ?? "").match(/(?:value|yield).*?([+-]\d+)%/i);
  return { id: slug(row["Trait Name"]), name: row["Trait Name"], ...(Object.keys(modifiers).length ? { statModifiers: modifiers } : {}),
    ...(marketMatch ? { marketModifier: Number(marketMatch[1]) / 100 } : {}), inheritable: true };
});
const generatedPassives = passives.map((row) => {
  const effect = String(row.Effect ?? "");
  const startEnergy = effect.match(/(?:First action each battle starts with|At battle start[^.]*gain) \+?(\d+) Energy/i);
  const switchEnergy = effect.match(/After switching in, gain \+?(\d+) Energy once per battle/i);
  const flowTimeline = effect.match(/After taking damage, gain \+?(\d+)% timeline progress/i);
  const switchShield = effect.match(/Once per battle after .* switches in, gain a shield equal to (\d+)% max HP/i);
  const switchMode = row.Species === "Omeniri" ? "control-discount" : row.Species === "Noctimiri" ? "dark-damage" : row.Species === "Oraciri" ? "forecast" : undefined;
  return { id: slug(row["Passive ID"]), sourceId: row["Passive ID"], name: row["Passive Name"], effectText: effect,
    ...(startEnergy ? { battleStartEnergy: Number(startEnergy[1]) } : {}), ...(switchEnergy ? { switchInEnergy: Number(switchEnergy[1]) } : {}),
    ...(flowTimeline ? { damageTakenTimelinePercent: Number(flowTimeline[1]) / 100 } : {}),
    ...(switchShield ? { switchInShieldPercent: Number(switchShield[1]) / 100 } : {}), ...(switchMode ? { switchMode } : {}) };
});
const regionId = (value) => value ? ({ "The Rift": "rift" }[value] || slug(value)) : undefined;
const positiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
const evolutions = paths.map((row) => {
  const requirements = Object.fromEntries(Object.entries({
    minLevel: positiveNumber(row["Level Req"]), minWins: positiveNumber(row["Battle Wins Req"]),
    itemId: row["Material ID"] ? slug(row["Material ID"]) : undefined,
    itemQuantity: positiveNumber(row["Material Qty"]), regionId: regionId(row["Region Req"]),
    weather: row["Weather Req"] ? slug(row["Weather Req"]) : undefined,
    environmentTag: row["Environment Req"] ? slug(row["Environment Req"]) : undefined,
    minResearchLevel: positiveNumber(row["Research Req"]), licenceId: row["Licence Req"] ? slug(row["Licence Req"]) : undefined,
    storyMilestoneId: row["Story Req"] ? slug(row["Story Req"]) : undefined,
  }).filter(([, value]) => value !== null && value !== undefined && value !== "" && value !== 0));
  const fromSpeciesId = slug(row["From Species"]);
  const toSpeciesId = slug(row["To Species"]);
  return { id: `${fromSpeciesId}-to-${toSpeciesId}`, fromSpeciesId, toSpeciesId, requirements };
});

const source = `// Generated from Monster Exchange Master Design Database v45. Do not edit by hand.\n` +
  `export const GENERATED_V45_CONCEPTS = ${JSON.stringify(concepts, null, 2)} as const;\n\n` +
  `export const GENERATED_V45_STATS = ${JSON.stringify(statsById, null, 2)} as const;\n\n` +
  `export const GENERATED_V45_MARKET_VALUES = ${JSON.stringify(marketById, null, 2)} as const;\n\n` +
  `export const GENERATED_V45_INTEGRATIONS = ${JSON.stringify(integrations, null, 2)} as const;\n\n` +
  `export const GENERATED_V45_TRAITS = ${JSON.stringify(generatedTraits, null, 2)} as const;\n\n` +
  `export const GENERATED_V45_PASSIVES = ${JSON.stringify(generatedPassives, null, 2)} as const;\n\n` +
  `export const GENERATED_V45_EVOLUTIONS = ${JSON.stringify(evolutions, null, 2)} as const;\n`;
await writeFile(output, source, "utf8");
console.log(`Generated ${concepts.length} v45 species with ${validDex.length} Dex mappings.`);
