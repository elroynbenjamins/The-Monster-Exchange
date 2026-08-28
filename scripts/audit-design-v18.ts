import { readFile } from "node:fs/promises";
import { content } from "../src/content/index.ts";

const root = new URL("../data/design-v18/", import.meta.url);
const read = async <T>(name: string): Promise<T> => JSON.parse(await readFile(new URL(name, root), "utf8")) as T;
const slug = (value: unknown): string => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Row = Readonly<Record<string, unknown>>;
const [species, stats, passives, learnsets, traitPools, evolutions, zones, encounters, market, obtainability] = await Promise.all([
  read<Row[]>("species-catalog.json"), read<Row[]>("species-combat-stats.json"), read<Row[]>("species-passives.json"),
  read<Row[]>("species-skill-learnsets.json"), read<Row[]>("species-trait-pools.json"), read<Row[]>("evolution-paths.json"),
  read<Row[]>("zone-design.json"), read<Row[]>("zone-encounters.json"), read<Row[]>("species-market-baselines.json"),
  read<Row[]>("special-obtainability-rules.json"),
]);

const errors: string[] = [];
const ids = species.map((row) => slug(row.Name));
const numbers = species.map((row) => Number(row.ID));
const sourceIds = new Set(ids);
if (species.length !== 146) errors.push(`Expected 146 source species, found ${species.length}.`);
if (new Set(ids).size !== ids.length) errors.push("Source species names do not produce unique stable IDs.");
if (new Set(numbers).size !== numbers.length || numbers.some((value, index) => value !== index + 1)) errors.push("Source catalog numbers must be unique and sequential from 1 to 146.");

function requireCoverage(rows: readonly Row[], field: string, label: string): void {
  const covered = new Set(rows.map((row) => slug(row[field])));
  const missing = ids.filter((id) => !covered.has(id));
  if (missing.length) errors.push(`${label} missing ${missing.length} species: ${missing.slice(0, 8).join(", ")}.`);
}

requireCoverage(stats, "Species", "Combat stats");
requireCoverage(passives, "Species", "Passives");
requireCoverage(learnsets, "Species", "Learnsets");
requireCoverage(traitPools, "Species", "Trait pools");
requireCoverage(market, "Species", "Market baselines");
for (const path of evolutions) {
  for (const field of ["From Species", "To Species"]) if (!sourceIds.has(slug(path[field]))) errors.push(`Evolution ${path["Path ID"]} references unknown ${field}: ${path[field]}.`);
}
for (const encounter of encounters) if (!sourceIds.has(slug(encounter.Monster))) errors.push(`Zone ${encounter["Zone ID"]} references unknown monster ${encounter.Monster}.`);
const zoneIds = new Set(zones.map((row) => String(row["Zone ID"] ?? "")));
for (const encounter of encounters) if (!zoneIds.has(String(encounter["Zone ID"] ?? ""))) errors.push(`Encounter references unknown zone ${encounter["Zone ID"]}.`);
for (const rule of obtainability) if (!sourceIds.has(slug(rule.Species))) errors.push(`Obtainability rule references unknown species ${rule.Species}.`);

const runtimeIds = new Set(content.species.map(({ id }) => id));
const missingFromRuntime = ids.filter((id) => !runtimeIds.has(id));
const runtimeOnly = [...runtimeIds].filter((id) => !sourceIds.has(id));
const shared = ids.filter((id) => runtimeIds.has(id));

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Design database v18 integrity: PASS");
  console.log(`Source: ${species.length} species, ${evolutions.length} evolution paths, ${zones.length} zones, ${encounters.length} encounter rows.`);
  console.log(`Runtime comparison: ${shared.length} shared, ${missingFromRuntime.length} awaiting migration, ${runtimeOnly.length} runtime-only.`);
  if (missingFromRuntime.length) console.log(`Next source species: ${missingFromRuntime.slice(0, 12).join(", ")}.`);
  if (runtimeOnly.length) console.log(`Runtime-only species requiring a decision: ${runtimeOnly.join(", ")}.`);
}
