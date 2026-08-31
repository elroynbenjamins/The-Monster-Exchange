import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../data/design-v45/", import.meta.url);
const read = async (name) => JSON.parse(await readFile(new URL(name, root), "utf8"));
const write = async (name, rows) => writeFile(new URL(name, root), `${JSON.stringify(rows, null, 2)}\n`, "utf8");

const starterFamilies = [
  { line: "Sprigbara", ids: [91, 92, 93] },
  { line: "Cindlet", ids: [5, 6, 7] },
  { line: "Rifflin", ids: [8, 213, 9] },
  { line: "Joltmeer", ids: [214, 215, 216] },
  { line: "Rimeket", ids: [217, 218, 219] },
];

const species = await read("species-catalog.json");
for (const family of starterFamilies) {
  for (const id of family.ids) {
    const row = species.find((candidate) => candidate.ID === id);
    if (!row) throw new Error(`Missing starter family member ${id}.`);
    row["Evolution Line"] = family.line;
  }
}
await write("species-catalog.json", species);

const dex = await read("full-dex-order.json");
for (const [familyIndex, family] of starterFamilies.entries()) {
  for (const [stageIndex, id] of family.ids.entries()) {
    const row = dex.find((candidate) => candidate["Internal Species ID"] === id);
    if (!row) throw new Error(`Missing Dex row for ${id}.`);
    row["Family Block"] = familyIndex + 1;
    row["Stage Position"] = stageIndex + 1;
    row["Family Size"] = family.ids.length;
    row["Audit Note"] = "Family contiguous; repaired from canonical evolution path";
  }
}
await write("full-dex-order.json", dex);

const restored = [
  {
    id: 220, name: "Hailhorn", baseId: 23, primary: "Frostmarch", secondary: null,
    ecology: { "Size Class": "Medium", Temperament: "Bold / competitive", Diet: "Cold-climate herbivore", "Activity Cycle": "Crepuscular", "Social Structure": "Small seasonal herds", "Breeding Pattern": "Family line / slower maturity", "Habitat Need": "glacier foothills, avalanche gullies, frozen ridgelines", "Threat Level": "Moderate", "Capture Behavior": "Evolution-stage encounter; braces and counters direct charges", "Economic Role": "Competitive / transport demand", "Implementation Notes": "Primary region: Frostmarch; restored middle evolution" },
    weekly: 673.75, economic: 1.131, battle: 1.03, collector: 1.02, scarcity: 1.02,
  },
  {
    id: 221, name: "Gloamfawn", baseId: 28, primary: "Mirefen", secondary: "Greenreach",
    ecology: { "Size Class": "Medium", Temperament: "Gentle but elusive", Diet: "Magical flora / ambient spirit energy", "Activity Cycle": "Nocturnal", "Social Structure": "Loose memorial groups", "Breeding Pattern": "Family line / slower maturity", "Habitat Need": "memorial thickets, pale groves, lantern-root paths", "Threat Level": "Moderate", "Capture Behavior": "Evolution-stage encounter; responds to calm, nonviolent approach", "Economic Role": "Research / collector / habitat value", "Implementation Notes": "Primary region: Mirefen; secondary: Greenreach; restored middle evolution" },
    weekly: 525, economic: 1.135, battle: 1.03, collector: 1.02, scarcity: 1.02,
  },
];

const traits = await read("species-trait-pools.json");
for (const item of restored) {
  if (!traits.some((row) => row["Monster ID"] === item.id)) {
    traits.push(...traits.filter((row) => row["Monster ID"] === item.baseId).map((row) => ({ ...row, "Monster ID": item.id, Species: item.name, Notes: "Inherited family-weighted pool for restored middle evolution" })));
  }
}
traits.sort((a, b) => a["Monster ID"] - b["Monster ID"]);
await write("species-trait-pools.json", traits);

const ecology = await read("species-ecology.json");
for (const item of restored) if (!ecology.some((row) => row["Monster ID"] === item.id)) ecology.push({ "Monster ID": item.id, Species: item.name, ...item.ecology });
ecology.sort((a, b) => a["Monster ID"] - b["Monster ID"]);
await write("species-ecology.json", ecology);

const obtainability = await read("obtainability-matrix.json");
for (const item of restored) if (!obtainability.some((row) => row["Monster ID"] === item.id)) obtainability.push({
  "Monster ID": item.id, Species: item.name, "Primary Obtain Method": "Evolution only", "Ordinary Wild?": "No",
  "Alpha Capable?": "No", "Boss / Hunt?": "No", "Evolution Only?": "Yes", "Auction Eligible?": "Conditional",
  "Research Gate?": "No", "Primary Region": item.primary, Rarity: "Uncommon",
  "Spawn / Capture Notes": "Never add to normal encounter tables; obtain by evolving the preceding family stage.",
});
obtainability.sort((a, b) => a["Monster ID"] - b["Monster ID"]);
await write("obtainability-matrix.json", obtainability);

const markets = await read("species-market-baselines.json");
const numeric = (value) => typeof value === "number" ? value : Number(String(value ?? "").replace(/\s*Crowns?$/i, "").replace(/x$/i, "").replace(/\./g, "").replace(",", "."));
for (const row of markets.filter((candidate) => candidate["Monster ID"] >= 213 && candidate["Monster ID"] <= 219)) {
  row["Weekly Passive Material Value"] = numeric(row["Weekly Passive Material Value"]);
  row["Rarity Base"] = numeric(row["Rarity Base"]);
  row["Evolution Factor"] = numeric(row["Evolution Factor"]);
  row["Economic Utility Factor"] = numeric(row["Economic Utility Factor"]);
  row["Battle Utility Factor"] = numeric(row["Battle Utility Factor"]);
  row["Collector Factor"] = numeric(row["Collector Factor"]) || 1;
  row["Scarcity Factor"] = numeric(row["Scarcity Factor"]) || 1;
  row["Baseline Species Value"] = Math.round(row["Rarity Base"] * row["Evolution Factor"] * row["Economic Utility Factor"] * row["Battle Utility Factor"] * row["Collector Factor"] * row["Scarcity Factor"]);
  row["Baseline Supply Index"] = row.Rarity === "Common" ? 85 : row.Rarity === "Uncommon" ? 58 : 9;
  row["Baseline Liquidity"] = row.Rarity === "Common" ? "High" : row.Rarity === "Uncommon" ? "Medium-High" : "Low";
  row["Auction Candidate"] = "Conditional";
}
for (const item of restored) if (!markets.some((row) => row["Monster ID"] === item.id)) {
  const evolution = 0.95;
  const value = Math.round(1400 * evolution * item.economic * item.battle * item.collector * item.scarcity);
  markets.push({ "Monster ID": item.id, Species: item.name, Rarity: "Uncommon", Stage: "2/3", "Primary Region": item.primary,
    "Secondary Region": item.secondary, "Weekly Passive Material Value": item.weekly, "Rarity Base": 1400,
    "Evolution Factor": evolution, "Economic Utility Factor": item.economic, "Battle Utility Factor": item.battle,
    "Collector Factor": item.collector, "Scarcity Factor": item.scarcity, "Baseline Species Value": value,
    "Baseline Supply Index": 58, "Baseline Liquidity": "Medium-High", "Auction Candidate": "Conditional" });
}
markets.sort((a, b) => a["Monster ID"] - b["Monster ID"]);
await write("species-market-baselines.json", markets);

const dexCatalog = dex.filter((row) => Number.isInteger(row["Dex #"])).map((row) => {
  const source = species.find((candidate) => candidate.ID === row["Internal Species ID"]);
  return { "Catalog #": row["Dex #"], Species: row.Species, "Type 1": row["Type 1"], "Type 2": row["Type 2"], Rarity: row.Rarity,
    "Primary Region": row["Primary Region"], "Evolution Stage": source?.["Evolution Stage"] ?? "Standalone",
    "Dex Description": source?.["Dex Description"] ?? source?.["Concept Summary"] ?? null, "Unknown Label": "???",
    "Crest Guardian?": ["Aurevine", "Tempestyr"].includes(row.Species) ? "Yes" : "No",
    "Public Market Eligible?": ["Aurevine", "Tempestyr"].includes(row.Species) ? "No" : "Yes",
    "Implementation Notes": "Catalog number follows Full Dex Order; internal Species ID remains separate" };
});
await write("monsterdex-catalog.json", dexCatalog);

console.log(`Repaired v45 authority: ${traits.length} trait rows, ${ecology.length} ecology rows, ${obtainability.length} obtainability rows, ${markets.length} market rows.`);
