import assert from "node:assert/strict";
import test from "node:test";
import { SeededRandom } from "../src/core/random.ts";
import { content } from "../src/content/index.ts";
import { createNewGame } from "../src/game/state.ts";
import { createListing } from "../src/systems/market.ts";
import { createMonster } from "../src/systems/monsters.ts";
import { browseMarketListings, buyListing } from "../src/systems/transactions.ts";

function stateWithListing(speciesId = "voltgrazer", askingPrice = 100) {
  const species = content.species.find(({ id }) => id === speciesId)!;
  const state = createNewGame("Market", 77, content.contentVersion);
  const monster = createMonster(species, new SeededRandom(4), { day: 1, ownerId: "npc-market" });
  const listing = createListing(monster, "npc-market", askingPrice, 1, 3, new SeededRandom(5));
  return { state: { ...state, market: { ...state.market, listings: [listing] } }, listing };
}

test("public listings require prior discovery and browsing does not reveal species", () => {
  const { state, listing } = stateWithListing();
  assert.equal(browseMarketListings(state).length, 1);
  assert.equal(state.player.discoveryBySpecies.voltgrazer, undefined);
  assert.throws(() => buyListing(state, listing.id, content.species), /must see this species/i);
});

test("seen and previously caught species can be purchased and become caught", () => {
  for (const priorStatus of ["SEEN", "CAUGHT"] as const) {
    const { state, listing } = stateWithListing();
    const discovered = { ...state, player: { ...state.player, discoveryBySpecies: { voltgrazer: priorStatus } } };
    const bought = buyListing(discovered, listing.id, content.species);
    assert.equal(bought.player.discoveryBySpecies.voltgrazer, "CAUGHT");
    assert.ok(bought.player.monsterIds.includes(listing.monster.id));
  }
});

test("market purchase still enforces funds, ownership, and species restrictions", () => {
  const expensive = stateWithListing("voltgrazer", 100_000);
  const seen = { ...expensive.state, player: { ...expensive.state.player, discoveryBySpecies: { voltgrazer: "SEEN" as const } } };
  assert.throws(() => buyListing(seen, expensive.listing.id, content.species), /not enough Crowns/i);

  const own = stateWithListing();
  const ownState = { ...own.state, player: { ...own.state.player, discoveryBySpecies: { voltgrazer: "SEEN" as const } }, market: { ...own.state.market, listings: [{ ...own.listing, sellerId: own.state.player.id }] } };
  assert.throws(() => buyListing(ownState, own.listing.id, content.species), /own listing/i);

  const restricted = stateWithListing("aurevine");
  const knownRestricted = { ...restricted.state, player: { ...restricted.state.player, discoveryBySpecies: { aurevine: "SEEN" as const } } };
  assert.throws(() => buyListing(knownRestricted, restricted.listing.id, content.species), /cannot be bought/i);
});
