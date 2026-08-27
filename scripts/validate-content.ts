import { GAME_TYPES } from "../src/core/types.ts";
import { content } from "../src/content/index.ts";

const errors: string[] = [];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const groups = [content.species, content.traits, content.skills, content.statuses, content.passives, content.synergies, content.equipment, content.evolutions, content.regions, content.zones, content.hazards, content.buildings, content.contracts, content.recipes];
const allIds = new Set<string>();

for (const group of groups) {
  for (const item of group) {
    if (!idPattern.test(item.id)) errors.push(`Invalid kebab-case id: ${item.id}`);
    if (allIds.has(item.id)) errors.push(`Duplicate global id: ${item.id}`);
    allIds.add(item.id);
  }
}

const speciesIds = new Set(content.species.map(({ id }) => id));
const traitIds = new Set(content.traits.map(({ id }) => id));
const skillIds = new Set(content.skills.map(({ id }) => id));
const statusIds = new Set(content.statuses.map(({ id }) => id));
const passiveIds = new Set(content.passives.map(({ id }) => id));
const evolutionIds = new Set(content.evolutions.map(({ id }) => id));
const zoneIds = new Set(content.zones.map(({ id }) => id));
const hazardIds = new Set(content.hazards.map(({ id }) => id));
const buildingIds = new Set(content.buildings.map(({ id }) => id));

for (const species of content.species) {
  for (const type of species.types) if (type && !GAME_TYPES.includes(type)) errors.push(`${species.id}: unknown type ${type}`);
  for (const id of species.traitPool) if (!traitIds.has(id)) errors.push(`${species.id}: unknown trait ${id}`);
  for (const id of species.skillPool) if (!skillIds.has(id)) errors.push(`${species.id}: unknown skill ${id}`);
  if (!passiveIds.has(species.passiveId)) errors.push(`${species.id}: unknown passive ${species.passiveId}`);
  for (const id of species.evolutionIds) if (!evolutionIds.has(id)) errors.push(`${species.id}: unknown evolution ${id}`);
  for (const id of species.habitats) if (!zoneIds.has(id)) errors.push(`${species.id}: unknown habitat ${id}`);
  if (!species.artId.startsWith(`monsters/${species.id}/${species.id}--`)) errors.push(`${species.id}: artId violates asset convention`);
}
for (const evolution of content.evolutions) {
  if (!speciesIds.has(evolution.fromSpeciesId) || !speciesIds.has(evolution.toSpeciesId)) errors.push(`${evolution.id}: unknown species reference`);
}
for (const skill of content.skills) if (skill.statusId && !statusIds.has(skill.statusId)) errors.push(`${skill.id}: unknown status ${skill.statusId}`);
for (const synergy of content.synergies) {
  for (const type of Object.keys(synergy.requiredTypes ?? {})) if (!GAME_TYPES.includes(type as (typeof GAME_TYPES)[number])) errors.push(`${synergy.id}: unknown required type ${type}`);
  const totalStatBonus = Object.values(synergy.statModifiers ?? {}).reduce((sum, value) => sum + (value ?? 0), 0);
  if (totalStatBonus > 0.15) errors.push(`${synergy.id}: individual synergy stat bonuses exceed the 15% cap`);
}
for (const equipment of content.equipment) {
  for (const modifier of Object.values(equipment.statModifiers ?? {})) if (Math.abs(modifier ?? 0) > 0.25) errors.push(`${equipment.id}: stat modifier exceeds 25%`);
  if ((equipment.expeditionStaminaModifier ?? 0) < -0.5 || (equipment.expeditionStaminaModifier ?? 0) > 0) errors.push(`${equipment.id}: expedition stamina modifier must be between -50% and 0`);
  if ((equipment.captureBonus ?? 0) < 0 || (equipment.captureBonus ?? 0) > 0.2) errors.push(`${equipment.id}: capture bonus must be between 0 and 20%`);
}
for (const region of content.regions) for (const id of region.zoneIds) if (!zoneIds.has(id)) errors.push(`${region.id}: unknown zone ${id}`);
for (const zone of content.zones) {
  for (const entry of zone.speciesPool) if (!speciesIds.has(entry.speciesId)) errors.push(`${zone.id}: unknown species ${entry.speciesId}`);
  for (const id of zone.hazards) if (!hazardIds.has(id)) errors.push(`${zone.id}: unknown hazard ${id}`);
  if (zone.boss && !speciesIds.has(zone.boss.speciesId)) errors.push(`${zone.id}: unknown boss species ${zone.boss.speciesId}`);
  if (zone.boss?.unlocksZoneId && !zoneIds.has(zone.boss.unlocksZoneId)) errors.push(`${zone.id}: unknown boss unlock zone ${zone.boss.unlocksZoneId}`);
  if (zone.boss && (zone.boss.level < zone.levelRange[1] || zone.boss.rewardCrowns < 1 || zone.boss.researchNotes < 0)) errors.push(`${zone.id}: invalid boss level or rewards`);
}
for (const hazard of content.hazards) {
  for (const type of hazard.protectedTypes ?? []) if (!GAME_TYPES.includes(type)) errors.push(`${hazard.id}: unknown protected type ${type}`);
  if (hazard.riskReduction < 0 || hazard.riskReduction > 0.25) errors.push(`${hazard.id}: risk reduction must be between 0 and 25%`);
}
for (const contract of content.contracts) {
  if (contract.objective.required < 1 || contract.durationDays < 1 || contract.reward.crowns < 0) errors.push(`${contract.id}: invalid objective, duration, or reward`);
  if (contract.objective.event === "capture-species" && contract.objective.targetId && !speciesIds.has(contract.objective.targetId)) errors.push(`${contract.id}: unknown target species ${contract.objective.targetId}`);
  if (contract.objective.event === "complete-expedition" && contract.objective.targetId && !zoneIds.has(contract.objective.targetId)) errors.push(`${contract.id}: unknown target zone ${contract.objective.targetId}`);
}
for (const recipe of content.recipes) {
  if (!buildingIds.has(recipe.requiredBuildingId)) errors.push(`${recipe.id}: unknown required building ${recipe.requiredBuildingId}`);
  if (recipe.requiredBuildingLevel < 1 || !Object.keys(recipe.inputs).length || !Object.keys(recipe.outputs).length) errors.push(`${recipe.id}: invalid recipe requirements`);
  for (const amount of [...Object.values(recipe.inputs), ...Object.values(recipe.outputs)]) if (!Number.isInteger(amount) || amount < 1) errors.push(`${recipe.id}: recipe amounts must be positive whole numbers`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Content v${content.contentVersion} valid: ${allIds.size} definitions checked.`);
}
