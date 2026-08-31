import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { GameState } from "./state.ts";
import { SAVE_VERSION } from "./state.ts";

const CITY_ALIASES: Readonly<Record<string, string>> = {
  hearthbrook: "willowmere", stonehollow: "cairnstead", saltwharf: "tidemark", bogmoor: "fenwatch",
  glacierhold: "rimegate", thunderwatch: "thunderrest", aurelia: "crownspire", steelgate: "ferrum-gate",
  drakoria: "ashenhold", luminspire: "lumenfall", "abyssal-point": "blacktide", nullspire: "seamwatch",
};
const MAP_ALIASES: Readonly<Record<string, string>> = {
  "continent-heartland": "continent-ardenfall", "continent-frontier": "continent-veydris",
  ...Object.fromEntries(Object.entries(CITY_ALIASES).map(([oldId, newId]) => [`city-${oldId}`, `city-${newId}`])),
};

export function migrateSave(raw: GameState & { saveVersion: number }): GameState {
  let migrated = raw;
  if (migrated.saveVersion === 1) {
    const conditions = Object.fromEntries(Object.keys(raw.monsters).map((id) => [id, { hpRatio: 1, stamina: 100 }]));
    migrated = { ...migrated, saveVersion: 2, conditions };
  }
  if (migrated.saveVersion === 2) {
    migrated = {
      ...migrated,
      saveVersion: 3,
      breedingJobs: [],
      world: { ...migrated.world, season: "spring", weatherByRegion: { greenreach: "clear", stormpeak: "windy" }, populations: {} },
    };
  }
  if (migrated.saveVersion === 3) {
    migrated = { ...migrated, saveVersion: 4, player: { ...migrated.player, researchBySpecies: {} } };
  }
  if (migrated.saveVersion === 4) {
    migrated = { ...migrated, saveVersion: 5, uiPreferences: { theme: "system", reducedMotion: false } };
  }
  if (migrated.saveVersion === 5) migrated = { ...migrated, saveVersion: 6, contracts: [] };
  if (migrated.saveVersion === 6) migrated = { ...migrated, saveVersion: 7, trainers: {} };
  if (migrated.saveVersion === 7) migrated = {
    ...migrated,
    saveVersion: 8,
    player: { ...migrated.player, location: { regionId: "greenreach", cityId: "hearthbrook" } },
    world: { ...migrated.world, unlockedMapIds: [] },
  };
  if (migrated.saveVersion === 8) {
    const oldUnlocks = migrated.world.unlockedMapIds ?? [];
    const storyFlags = [...(migrated.world.storyFlags ?? [])];
    if (oldUnlocks.includes("late-game-continent") && !storyFlags.includes("STORY_VEYDRIS_ACCESS")) storyFlags.push("STORY_VEYDRIS_ACCESS");
    migrated = {
      ...migrated, saveVersion: 9,
      player: {
        ...migrated.player,
        location: { ...migrated.player.location, cityId: migrated.player.location.cityId ? (CITY_ALIASES[migrated.player.location.cityId] ?? migrated.player.location.cityId) : undefined },
        specialEvolutionProgress: migrated.player.specialEvolutionProgress ?? {},
      },
      world: {
        ...migrated.world, storyFlags,
        unlockedMapIds: oldUnlocks.filter((id) => id !== "late-game-continent").map((id) => MAP_ALIASES[id] ?? id),
        travelEventState: migrated.world.travelEventState ?? { resolvedEventIds: [] }, dynamicState: migrated.world.dynamicState ?? {},
      },
      rivalStateExtensions: migrated.rivalStateExtensions ?? {},
      homebaseQueues: migrated.homebaseQueues ?? { constructionIds: [], breedingJobIds: [] },
      monetizationEntitlements: migrated.monetizationEntitlements ?? [],
    };
  }
  const existingDiscovery = migrated.player.discoveryBySpecies ?? {};
  const discoveryBySpecies = { ...existingDiscovery };
  for (const [speciesId, research] of Object.entries(migrated.player.researchBySpecies ?? {})) {
    if (research.level > 0 && discoveryBySpecies[speciesId] !== "CAUGHT") discoveryBySpecies[speciesId] = "SEEN";
  }
  for (const monsterId of migrated.player.monsterIds ?? []) {
    const speciesId = migrated.monsters[monsterId]?.speciesId;
    if (speciesId) discoveryBySpecies[speciesId] = "CAUGHT";
  }
  return {
    ...migrated,
    player: { ...migrated.player, discoveryBySpecies, selectedStarterSpeciesId: migrated.player.selectedStarterSpeciesId ?? null, specialEvolutionProgress: migrated.player.specialEvolutionProgress ?? {} },
  };
}

export async function saveGame(path: string, state: GameState): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(state, null, 2), "utf8");
  await rename(temporaryPath, path);
}

export async function loadGame(path: string, expectedContentVersion: number): Promise<GameState> {
  const parsed = migrateSave(JSON.parse(await readFile(path, "utf8")) as GameState);
  if (parsed.saveVersion !== SAVE_VERSION) throw new Error(`Unsupported save version ${parsed.saveVersion}.`);
  if (parsed.contentVersion > expectedContentVersion) throw new Error("This save uses newer game content.");
  return parsed;
}
