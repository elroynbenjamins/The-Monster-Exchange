import { access } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join } from "node:path";
import {
  SeededRandom, addMonsterToPlayer, attemptCapture, byId, changeInventory, content, createMonster,
  createNewGame, generateWildEncounter, loadGame, saveGame, type GameState,
} from "./index.ts";

const savePath = join(process.cwd(), ".local", "save.json");
const ui = createInterface({ input, output });

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function askNumber(prompt: string, min: number, max: number): Promise<number> {
  while (true) {
    const value = Number.parseInt(await ui.question(prompt), 10);
    if (Number.isInteger(value) && value >= min && value <= max) return value;
    console.log(`Choose a number from ${min} to ${max}.`);
  }
}

function roster(state: GameState): void {
  console.log("\nYour monsters");
  for (const id of state.player.monsterIds) {
    const monster = state.monsters[id]!;
    const species = byId(content.species, monster.speciesId);
    console.log(`- ${monster.nickname ?? species.name} · Lv.${monster.level} · Potential ${monster.potential} · ${monster.traitIds.join(", ") || "no trait"}`);
  }
}

async function newGame(): Promise<GameState> {
  console.log("\nMONSTERMARKET — Greenreach Field Office\n");
  const name = await ui.question("Manager name: ");
  let state = createNewGame(name, Date.now() & 0xffff_ffff, content.contentVersion);
  const choices = [byId(content.species, "mossveil"), byId(content.species, "voltgrazer")];
  console.log("\nChoose your first partner:");
  choices.forEach((species, index) => console.log(`${index + 1}. ${species.name} — ${species.types.join(" / ")} · ${species.tags.join(", ")}`));
  const selection = await askNumber("> ", 1, choices.length);
  const starter = createMonster(choices[selection - 1]!, new SeededRandom(state.world.seed), { day: 1, level: 5, ownerId: state.player.id, qualityBias: 0.12 });
  state = addMonsterToPlayer(state, starter, true);
  await saveGame(savePath, state);
  return state;
}

async function explore(state: GameState): Promise<GameState> {
  const zone = byId(content.zones, state.world.unlockedZoneIds[0]!);
  const rng = new SeededRandom(state.world.seed + state.world.nextRandomOffset + 1);
  const encounter = generateWildEncounter(zone, content.species, rng, state.world.day);
  console.log(`\nIn ${zone.id}, a Lv.${encounter.monster.level} ${encounter.species.name} appears.`);
  console.log(`Estimated Potential: ${encounter.estimatedPotential[0]}–${encounter.estimatedPotential[1]}`);
  console.log("1. Battle and weaken it  2. Leave");
  const action = await askNumber("> ", 1, 2);
  let next = { ...state, world: { ...state.world, nextRandomOffset: state.world.nextRandomOffset + 1 } };
  if (action === 2) return next;
  const remainingHp = rng.int(18, 48) / 100;
  const crownsFound = rng.int(18, 45);
  next = { ...next, player: { ...next.player, crowns: next.player.crowns + crownsFound } };
  console.log(`Your team weakens it to ${Math.round(remainingHp * 100)}% HP. You recover ${crownsFound} Crowns from the field contract.`);
  if ((next.player.inventory["field-capsule"] ?? 0) < 1) { console.log("You have no Field Capsules."); return next; }
  console.log("1. Use a Field Capsule  2. Let it go");
  if (await askNumber("> ", 1, 2) === 1) {
    next = changeInventory(next, "field-capsule", -1);
    const result = attemptCapture(encounter, remainingHp, rng);
    if (result.captured) {
      next = addMonsterToPlayer(next, encounter.monster, next.player.activeTeamIds.length < 5);
      console.log(`Captured ${encounter.species.name}! Its true Potential is ${encounter.monster.potential}.`);
    } else console.log(`${encounter.species.name} escaped the capsule.`);
  }
  return next;
}

async function run(): Promise<void> {
  let state = await exists(savePath) ? await loadGame(savePath, content.contentVersion) : await newGame();
  console.log(`\nWelcome, ${state.player.name}.`);
  while (true) {
    console.log(`\nDay ${state.world.day} · ${state.player.crowns} Crowns · ${state.player.inventory["field-capsule"] ?? 0} Capsules`);
    console.log("1. Explore Greenreach  2. View roster  3. Rest until tomorrow  4. Save and quit");
    const action = await askNumber("> ", 1, 4);
    if (action === 1) state = await explore(state);
    if (action === 2) roster(state);
    if (action === 3) {
      state = { ...state, world: { ...state.world, day: state.world.day + 1 }, market: { ...state.market, day: state.market.day + 1 } };
      console.log("A new market day begins.");
    }
    await saveGame(savePath, state);
    if (action === 4) break;
  }
}

try { await run(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; } finally { ui.close(); }
