import type { GameState } from "../game/state.ts";
import type { MarketplaceListing } from "./market.ts";
import type { RandomSource } from "../core/random.ts";
import { createListing } from "./market.ts";
import { isCrestGuardianSpeciesId } from "../content/crest-guardians.ts";

export interface MarketBrowseOptions {
  speciesId?: string;
  maximumPrice?: number;
  affordableOnly?: boolean;
  minimumPotential?: number;
  minimumLevel?: number;
  sortBy?: "price" | "potential" | "level";
}

export function browseMarketListings(state: GameState, options: MarketBrowseOptions = {}): readonly MarketplaceListing[] {
  const listings = state.market.listings.filter((listing) => listing.sellerId !== state.player.id)
    .filter((listing) => !options.speciesId || listing.monster.speciesId === options.speciesId)
    .filter((listing) => options.maximumPrice === undefined || listing.askingPrice <= options.maximumPrice)
    .filter((listing) => options.minimumPotential === undefined || listing.monster.potential >= options.minimumPotential)
    .filter((listing) => options.minimumLevel === undefined || listing.monster.level >= options.minimumLevel)
    .filter((listing) => !options.affordableOnly || listing.askingPrice <= state.player.crowns);
  const sortBy = options.sortBy ?? "price";
  return [...listings].sort((a, b) => sortBy === "potential" ? b.monster.potential - a.monster.potential : sortBy === "level" ? b.monster.level - a.monster.level : a.askingPrice - b.askingPrice);
}

export function listingValueLabel(askingPrice: number, appraisal: number): "bargain" | "fair" | "premium" {
  const ratio = askingPrice / Math.max(1, appraisal);
  return ratio <= 0.9 ? "bargain" : ratio <= 1.12 ? "fair" : "premium";
}

export function buyListing(state: GameState, listingId: string): GameState {
  const listing = state.market.listings.find(({ id }) => id === listingId);
  if (!listing) throw new Error("Listing is no longer available.");
  if (listing.sellerId === state.player.id) throw new Error("You cannot buy your own listing.");
  if (state.player.crowns < listing.askingPrice) throw new Error("Not enough Crowns.");
  const monster = { ...listing.monster, ownerId: state.player.id };
  return {
    ...state,
    monsters: { ...state.monsters, [monster.id]: monster },
    conditions: { ...state.conditions, [monster.id]: { hpRatio: 1, stamina: 100 } },
    player: {
      ...state.player, crowns: state.player.crowns - listing.askingPrice,
      monsterIds: [...state.player.monsterIds, monster.id],
    },
    market: { ...state.market, listings: state.market.listings.filter(({ id }) => id !== listingId) },
  };
}

export function purchasePrice(listing: MarketplaceListing): number { return listing.askingPrice; }

export function listPlayerMonster(state: GameState, monsterId: string, askingPrice: number, durationDays: number, rng: RandomSource): GameState {
  if (!state.player.monsterIds.includes(monsterId)) throw new Error("You do not own this monster.");
  if (state.activeExpedition?.route.teamIds.includes(monsterId)) throw new Error("A monster on expedition cannot be listed.");
  const monster = state.monsters[monsterId];
  if (!monster) throw new Error("Monster record is missing.");
  if (isCrestGuardianSpeciesId(monster.speciesId)) throw new Error("Crest Guardians cannot be sold on the Exchange.");
  if (state.player.monsterIds.length <= 1) throw new Error("You cannot list your final monster.");
  const listing = createListing(monster, state.player.id, askingPrice, state.world.day, durationDays, rng);
  return {
    ...state,
    player: {
      ...state.player,
      monsterIds: state.player.monsterIds.filter((id) => id !== monsterId),
      activeTeamIds: state.player.activeTeamIds.filter((id) => id !== monsterId),
    },
    market: { ...state.market, listings: [...state.market.listings, listing] },
  };
}

export function resolvePlayerListingSales(state: GameState, rng: RandomSource): { state: GameState; soldListingIds: readonly string[] } {
  const sold: string[] = [];
  const soldMonsterIds: string[] = [];
  let crowns = state.player.crowns;
  const listings = state.market.listings.filter((listing) => {
    if (listing.sellerId !== state.player.id) return true;
    const index = state.market.indices[listing.monster.speciesId];
    const reference = index?.lastPrice || listing.askingPrice;
    const priceRatio = listing.askingPrice / Math.max(1, reference);
    const chance = Math.max(0.04, Math.min(0.75, 0.48 / priceRatio));
    if (rng.float() >= chance) return true;
    sold.push(listing.id);
    soldMonsterIds.push(listing.monster.id);
    crowns += listing.askingPrice;
    return false;
  });
  const monsters = { ...state.monsters };
  for (const id of soldMonsterIds) monsters[id] = { ...monsters[id]!, ownerId: "npc-market" };
  return { state: { ...state, monsters, player: { ...state.player, crowns }, market: { ...state.market, listings } }, soldListingIds: sold };
}

export function returnExpiredPlayerListings(state: GameState, expired: readonly MarketplaceListing[]): GameState {
  const mine = expired.filter((listing) => listing.sellerId === state.player.id);
  if (!mine.length) return state;
  return {
    ...state,
    monsters: { ...state.monsters, ...Object.fromEntries(mine.map((listing) => [listing.monster.id, listing.monster])) },
    player: { ...state.player, monsterIds: [...state.player.monsterIds, ...mine.map((listing) => listing.monster.id)] },
  };
}
