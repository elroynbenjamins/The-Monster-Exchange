import type { DomainEvent, MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { TraitDefinition } from "../content/definitions.ts";
import type { RandomSource } from "../core/random.ts";
import { createId } from "../core/id.ts";

export interface MarketIndex { speciesId: string; supply: number; demand: number; lastPrice: number }
export interface MarketplaceListing { id: string; monster: MonsterIndividual; sellerId: string; askingPrice: number; listedOnDay: number; expiresOnDay: number }
export interface MarketState { day: number; indices: Readonly<Record<string, MarketIndex>>; listings: readonly MarketplaceListing[]; events: readonly DomainEvent[] }

export function appraiseMonster(monster: MonsterIndividual, species: SpeciesDefinition, traits: readonly TraitDefinition[], index?: MarketIndex): number {
  const potentialFactor = 0.65 + monster.potential / 100;
  const levelFactor = 1 + Math.max(0, monster.level - 1) * 0.018;
  const fameFactor = 1 + Math.min(0.5, monster.fame * 0.005 + monster.wins * 0.002);
  const traitFactor = 1 + monster.traitIds.reduce((sum, id) => sum + (traits.find((trait) => trait.id === id)?.marketModifier ?? 0.02), 0);
  const pressure = index ? Math.max(0.6, Math.min(1.8, index.demand / Math.max(1, index.supply))) : 1;
  return Math.max(1, Math.round(species.baseMarketValue * potentialFactor * levelFactor * fameFactor * traitFactor * pressure));
}

export function createListing(monster: MonsterIndividual, sellerId: string, askingPrice: number, day: number, durationDays: number, rng: RandomSource): MarketplaceListing {
  if (askingPrice <= 0 || durationDays <= 0) throw new Error("Listing price and duration must be positive.");
  if (monster.ownerId !== sellerId) throw new Error("Seller does not own this monster.");
  return { id: createId("listing", rng), monster, sellerId, askingPrice, listedOnDay: day, expiresOnDay: day + durationDays };
}

export function tickMarket(state: MarketState): MarketState {
  const day = state.day + 1;
  const expired = state.listings.filter((listing) => listing.expiresOnDay <= day);
  const listings = state.listings.filter((listing) => listing.expiresOnDay > day);
  const indices = Object.fromEntries(Object.entries(state.indices).map(([id, value]) => [id, {
    ...value,
    supply: Math.max(1, Math.round(value.supply * 0.9 + listings.filter((listing) => listing.monster.speciesId === id).length * 0.1)),
    demand: Math.max(1, Math.round(value.demand * 0.97 + 3)),
  }]));
  const events: DomainEvent[] = expired.map((listing) => ({ type: "market.listing-expired", day, payload: { listingId: listing.id } }));
  return { day, indices, listings, events };
}
