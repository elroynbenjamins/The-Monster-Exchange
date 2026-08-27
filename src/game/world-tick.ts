import type { GameContent } from "../content/definitions.ts";
import type { DomainEvent } from "../core/types.ts";
import { SeededRandom } from "../core/random.ts";
import type { GameState } from "./state.ts";
import { appraiseMonster, createListing, tickMarket, type MarketIndex } from "../systems/market.ts";
import { createMonster } from "../systems/monsters.ts";
import { tickHomebase } from "../systems/homebase.ts";
import { resolvePlayerListingSales, returnExpiredPlayerListings } from "../systems/transactions.ts";
import { expireContracts, recordContractProgress } from "./contracts.ts";
import { progressTrainers } from "../systems/trainers.ts";

export interface WorldTickResult { state: GameState; events: readonly DomainEvent[] }

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
const WEATHER: Readonly<Record<string, readonly string[]>> = {
  greenreach: ["clear", "light-rain", "heavy-rain", "mist"],
  stormpeak: ["windy", "clear", "thunderstorm", "heavy-rain"],
};

function nextIndices(state: GameState, content: GameContent): Readonly<Record<string, MarketIndex>> {
  return Object.fromEntries(content.species.map((species) => {
    const current = state.market.indices[species.id];
    const population = state.world.populations[species.id] ?? 100;
    return [species.id, current ?? { speciesId: species.id, supply: Math.max(5, Math.round(population / 10)), demand: 10, lastPrice: species.baseMarketValue }];
  }));
}

function generateNpcListings(state: GameState, content: GameContent, rng: SeededRandom): GameState {
  const npcListings = state.market.listings.filter(({ sellerId }) => sellerId !== state.player.id);
  const needed = Math.max(0, 4 - npcListings.length);
  let listings = [...state.market.listings];
  for (let index = 0; index < needed; index++) {
    const species = rng.pick(content.species.filter(({ rarity }) => rarity !== "legendary"));
    const monster = createMonster(species, rng, { day: state.world.day, level: rng.int(2, 16), ownerId: `npc-${rng.int(1, 12)}`, qualityBias: rng.float() * 0.12 });
    const appraisal = appraiseMonster(monster, species, content.traits, state.market.indices[species.id]);
    const price = Math.max(1, Math.round(appraisal * (0.85 + rng.float() * 0.35)));
    listings.push(createListing(monster, monster.ownerId!, price, state.world.day, rng.int(2, 5), rng));
  }
  return { ...state, market: { ...state.market, listings } };
}

export function advanceWorldDay(state: GameState, content: GameContent): WorldTickResult {
  if (state.activeExpedition) throw new Error("Finish or retreat from the expedition before ending the day.");
  const day = state.world.day + 1;
  const rng = new SeededRandom(state.world.seed + day * 7919 + state.world.nextRandomOffset);
  const events: DomainEvent[] = [];
  const season = SEASONS[Math.floor((day - 1) / 30) % SEASONS.length]!;
  const weatherByRegion = Object.fromEntries(content.regions.map((region) => [region.id, rng.pick(WEATHER[region.id] ?? ["clear"])]));
  const populations = Object.fromEntries(content.species.map((species) => {
    const current = state.world.populations[species.id] ?? 100;
    const seasonalBias = season === "summer" && species.types.includes("bug") ? 3 : season === "winter" && species.types.includes("ice") ? 3 : 0;
    return [species.id, Math.max(20, Math.min(180, current + rng.int(-2, 2) + seasonalBias))];
  }));
  let next: GameState = { ...state, world: { ...state.world, day, nextRandomOffset: state.world.nextRandomOffset + 1, season, weatherByRegion, populations } };

  const clinicLevel = next.homebase.buildings.find(({ buildingId, status }) => buildingId === "field-clinic" && status === "active")?.level ?? 0;
  const conditions = { ...next.conditions };
  for (const id of next.player.monsterIds) {
    const current = conditions[id] ?? { hpRatio: 1, stamina: 100 };
    conditions[id] = { hpRatio: Math.min(1, current.hpRatio + 0.25 + clinicLevel * 0.12), stamina: Math.min(100, current.stamina + 30 + clinicLevel * 8) };
  }
  next = { ...next, conditions, homebase: tickHomebase(next.homebase, day), breedingJobs: next.breedingJobs.map((job) => job.status === "active" && job.completesOnDay <= day ? { ...job, status: "ready" as const } : job) };

  const saleResult = resolvePlayerListingSales(next, rng);
  next = saleResult.state;
  for (const listingId of saleResult.soldListingIds) {
    next = recordContractProgress(next, { type: "sell-monster" }, content);
    events.push({ type: "market.player-listing-sold", day, payload: { listingId } });
  }
  const expiring = next.market.listings.filter(({ expiresOnDay }) => expiresOnDay <= day);
  next = { ...next, market: tickMarket({ ...next.market, day: day - 1, indices: nextIndices(next, content) }) };
  next = returnExpiredPlayerListings(next, expiring);
  next = generateNpcListings(next, content, rng);
  next = progressTrainers(next, content);
  next = expireContracts(next);
  for (const job of next.breedingJobs.filter(({ status, completesOnDay }) => status === "ready" && completesOnDay === day)) events.push({ type: "breeding.ready", day, payload: { jobId: job.id } });
  events.push({ type: "world.day-advanced", day, payload: { season, weatherByRegion } });
  return { state: next, events };
}
