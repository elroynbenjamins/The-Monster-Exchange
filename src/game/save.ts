import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { GameState } from "./state.ts";
import { SAVE_VERSION } from "./state.ts";

export async function saveGame(path: string, state: GameState): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(state, null, 2), "utf8");
  await rename(temporaryPath, path);
}

export async function loadGame(path: string, expectedContentVersion: number): Promise<GameState> {
  const parsed = JSON.parse(await readFile(path, "utf8")) as GameState;
  if (parsed.saveVersion !== SAVE_VERSION) throw new Error(`Unsupported save version ${parsed.saveVersion}.`);
  if (parsed.contentVersion > expectedContentVersion) throw new Error("This save uses newer game content.");
  return parsed;
}
