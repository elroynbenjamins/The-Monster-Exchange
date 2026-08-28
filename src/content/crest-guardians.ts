import type { GameContent } from "./definitions.ts";
import type { GameState } from "../game/state.ts";
import type { RandomSource } from "../core/random.ts";
import { addMonsterToPlayer } from "../game/state.ts";
import { createMonster } from "../systems/monsters.ts";

export type CrestGuardianId = "aurevine" | "tempestyr";

export interface CrestGuardianDefinition {
  speciesId: CrestGuardianId;
  title: string;
  visualConcept: string;
  sanctuary: string;
  minimumReputation: number;
  requirementLabel: string;
}

export const CREST_GUARDIANS: readonly CrestGuardianDefinition[] = [
  {
    speciesId: "aurevine",
    title: "The Verdant Scale",
    visualConcept: "An ivory-and-emerald serpentine stag with leaf antlers, a gold balance crest, and luminous vine ribbons.",
    sanctuary: "The Rootbound Exchange beneath Greenreach Deepwood",
    minimumReputation: 20,
    requirementLabel: "Reach 20 reputation and complete at least 12 total species-research levels.",
  },
  {
    speciesId: "tempestyr",
    title: "The Stormbound Scale",
    visualConcept: "A deep-teal drake with lightning antlers, a gold exchange crest, and a mane that breaks into blue-white arcs.",
    sanctuary: "The Crown Conductor above Stormpeak",
    minimumReputation: 30,
    requirementLabel: "Reach 30 reputation and record at least 20 victories across owned monsters.",
  },
];

export function isCrestGuardianSpeciesId(speciesId: string): speciesId is CrestGuardianId {
  return CREST_GUARDIANS.some((guardian) => guardian.speciesId === speciesId);
}

export function crestGuardianBondEligibility(state: GameState, speciesId: CrestGuardianId): { eligible: boolean; reasons: readonly string[] } {
  const guardian = CREST_GUARDIANS.find((entry) => entry.speciesId === speciesId)!;
  const reasons: string[] = [];
  if (state.player.monsterIds.some((id) => state.monsters[id]?.speciesId === speciesId)) reasons.push(`${guardian.title} has already bonded with this Exchange keeper.`);
  if (state.player.reputation < guardian.minimumReputation) reasons.push(`Requires ${guardian.minimumReputation} reputation.`);
  if (speciesId === "aurevine") {
    const totalResearchLevels = Object.values(state.player.researchBySpecies).reduce((sum, research) => sum + research.level, 0);
    if (totalResearchLevels < 12) reasons.push("Requires 12 total species-research levels.");
  } else {
    const totalWins = state.player.monsterIds.reduce((sum, id) => sum + (state.monsters[id]?.wins ?? 0), 0);
    if (totalWins < 20) reasons.push("Requires 20 victories across owned monsters.");
  }
  return { eligible: reasons.length === 0, reasons };
}

export function bondWithCrestGuardian(state: GameState, speciesId: CrestGuardianId, content: GameContent, rng: RandomSource): GameState {
  const eligibility = crestGuardianBondEligibility(state, speciesId);
  if (!eligibility.eligible) throw new Error(`Guardian bond unavailable: ${eligibility.reasons.join(" ")}`);
  const species = content.species.find(({ id }) => id === speciesId);
  if (!species) throw new Error(`Missing crest guardian species: ${speciesId}.`);
  const guardian = createMonster(species, rng, { day: state.world.day, level: speciesId === "aurevine" ? 40 : 45, qualityBias: 0.42, ownerId: state.player.id });
  return addMonsterToPlayer(state, { ...guardian, sex: "neutral", variantId: "crest", fame: 100 });
}
