import { access } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join } from "node:path";
import {
  SeededRandom, addMonsterToPlayer, appraiseMonster, attemptCapture, byId, changeInventory, content, createMonster,
  createNewGame, finishExpedition, generateWildEncounter, listPlayerMonster, loadGame, resolveExpeditionNode,
  resolvePlayerListingSales, restTeam, returnExpiredPlayerListings, saveGame, startExpeditionRun, tickMarket, type GameState,
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
    const condition = state.conditions[id] ?? { hpRatio: 1, stamina: 100 };
    console.log(`- ${monster.nickname ?? species.name} · Lv.${monster.level} · Potential ${monster.potential} · HP ${Math.round(condition.hpRatio * 100)}% · Stamina ${condition.stamina}`);
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

async function captureAfterEncounter(state: GameState, rng: SeededRandom): Promise<GameState> {
  const zone = byId(content.zones, state.activeExpedition!.route.zoneId);
  const encounter = generateWildEncounter(zone, content.species, rng, state.world.day);
  const remainingHp = rng.int(18, 48) / 100;
  console.log(`\nThe encounter included a Lv.${encounter.monster.level} ${encounter.species.name}, now at ${Math.round(remainingHp * 100)}% HP.`);
  console.log(`Estimated Potential: ${encounter.estimatedPotential[0]}–${encounter.estimatedPotential[1]}`);
  let next = { ...state, world: { ...state.world, nextRandomOffset: state.world.nextRandomOffset + 1 } };
  if ((next.player.inventory["field-capsule"] ?? 0) < 1) { console.log("You have no Field Capsules."); return next; }
  console.log("1. Use a Field Capsule  2. Leave it behind");
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

async function expedition(state: GameState): Promise<GameState> {
  const rng = new SeededRandom(state.world.seed + state.world.nextRandomOffset + 101);
  let next = state.activeExpedition ? state : startExpeditionRun(state, byId(content.zones, state.world.unlockedZoneIds[0]!), rng);
  console.log(next.activeExpedition === state.activeExpedition ? "\nResuming expedition." : "\nThe team enters Greenreach Meadow.");
  while (next.activeExpedition) {
    const route = next.activeExpedition.route;
    if (route.status === "completed") {
      next = finishExpedition(next);
      console.log("Expedition complete. All secured rewards were added to your inventory.");
      break;
    }
    if (route.status === "abandoned") {
      next = finishExpedition(next, true);
      console.log("The team was defeated and evacuated with 60% of its secured rewards.");
      break;
    }
    const node = route.nodes[route.currentNode]!;
    console.log(`\nRoute ${route.currentNode + 1}/${route.nodes.length}: ${node.type}`);
    console.log("1. Resolve node  2. Retreat with 60% rewards  3. Save and return to office");
    const choice = await askNumber("> ", 1, 3);
    if (choice === 2) { next = finishExpedition(next, true); console.log("The team retreats safely."); break; }
    if (choice === 3) break;
    const outcome = resolveExpeditionNode(next, rng);
    next = outcome.state;
    console.log(outcome.event.payload.message);
    if (node.type === "encounter" && !outcome.defeated) next = await captureAfterEncounter(next, rng);
    await saveGame(savePath, next);
  }
  return next;
}

async function sellMonster(state: GameState): Promise<GameState> {
  if (state.player.monsterIds.length <= 1) { console.log("You need at least two monsters before listing one."); return state; }
  roster(state);
  console.log("\nChoose a monster to list:");
  state.player.monsterIds.forEach((id, index) => console.log(`${index + 1}. ${byId(content.species, state.monsters[id]!.speciesId).name}`));
  const selectedId = state.player.monsterIds[(await askNumber("> ", 1, state.player.monsterIds.length)) - 1]!;
  const monster = state.monsters[selectedId]!;
  const species = byId(content.species, monster.speciesId);
  const suggested = appraiseMonster(monster, species, content.traits, state.market.indices[species.id]);
  console.log(`Suggested appraisal: ${suggested} Crowns.`);
  const price = await askNumber("Asking price: ", 1, 1000000);
  try {
    return listPlayerMonster(state, selectedId, price, 3, new SeededRandom(state.world.seed + state.world.nextRandomOffset + 500));
  } catch (error) { console.log(error instanceof Error ? error.message : error); return state; }
}

function advanceDay(state: GameState): GameState {
  let next = restTeam(state);
  const expiring = next.market.listings.filter((listing) => listing.expiresOnDay <= state.market.day + 1);
  next = { ...next, market: tickMarket({ ...next.market, day: state.market.day }) };
  next = returnExpiredPlayerListings(next, expiring);
  const sales = resolvePlayerListingSales(next, new SeededRandom(next.world.seed + next.world.day * 97));
  if (sales.soldListingIds.length) console.log(`${sales.soldListingIds.length} marketplace listing sold.`);
  return sales.state;
}

async function run(): Promise<void> {
  let state = await exists(savePath) ? await loadGame(savePath, content.contentVersion) : await newGame();
  console.log(`\nWelcome, ${state.player.name}.`);
  while (true) {
    console.log(`\nDay ${state.world.day} · ${state.player.crowns} Crowns · ${state.player.inventory["field-capsule"] ?? 0} Capsules`);
    console.log("1. Expedition  2. View roster  3. Rest until tomorrow  4. Sell a monster  5. Save and quit");
    const action = await askNumber("> ", 1, 5);
    if (action === 1) state = await expedition(state);
    if (action === 2) roster(state);
    if (action === 3) {
      try { state = advanceDay(state); console.log("The team recovers and a new market day begins."); }
      catch (error) { console.log(error instanceof Error ? error.message : error); }
    }
    if (action === 4) state = await sellMonster(state);
    await saveGame(savePath, state);
    if (action === 5) break;
  }
}

try { await run(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; } finally { ui.close(); }
