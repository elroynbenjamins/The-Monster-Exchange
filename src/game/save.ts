import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { GameState } from "./state.ts";
import { SAVE_VERSION } from "./state.ts";

function migrateSave(raw: GameState & { saveVersion: number }): GameState {
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
  return migrated;
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
