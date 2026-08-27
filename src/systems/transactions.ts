import type { GameState } from "../game/state.ts";
import type { MarketplaceListing } from "./market.ts";

export function buyListing(state: GameState, listingId: string): GameState {
  const listing = state.market.listings.find(({ id }) => id === listingId);
  if (!listing) throw new Error("Listing is no longer available.");
  if (listing.sellerId === state.player.id) throw new Error("You cannot buy your own listing.");
  if (state.player.crowns < listing.askingPrice) throw new Error("Not enough Crowns.");
  const monster = { ...listing.monster, ownerId: state.player.id };
  return {
    ...state,
    monsters: { ...state.monsters, [monster.id]: monster },
    player: {
      ...state.player, crowns: state.player.crowns - listing.askingPrice,
      monsterIds: [...state.player.monsterIds, monster.id],
    },
    market: { ...state.market, listings: state.market.listings.filter(({ id }) => id !== listingId) },
  };
}

export function purchasePrice(listing: MarketplaceListing): number { return listing.askingPrice; }
