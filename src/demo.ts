import { SeededRandom, appraiseMonster, breed, byId, calculateDamage, content, createCombatant, createExpedition, createListing, createMonster, tickMarket } from "./index.ts";

const rng = new SeededRandom(20260827);
const mossveil = byId(content.species, "mossveil");
const parentA = createMonster(mossveil, rng, { day: 1, level: 12, ownerId: "player" });
const parentB = { ...createMonster(mossveil, rng, { day: 1, level: 10, ownerId: "player" }), sex: parentA.sex === "female" ? "male" as const : "female" as const };
const { offspring } = breed(parentA, parentB, mossveil, mossveil, rng, 8, "player");
const initialIndex = { speciesId: mossveil.id, supply: 12, demand: 18, lastPrice: 0 };
const askingPrice = appraiseMonster(offspring, mossveil, content.traits, initialIndex);
const listing = createListing(offspring, "player", askingPrice, 8, 3, rng);
const market = tickMarket({ day: 8, indices: { [mossveil.id]: initialIndex }, listings: [listing], events: [] });
const zone = byId(content.zones, "greenreach-meadow");
const expedition = createExpedition(zone, [parentA.id, parentB.id], rng);
const attacker = createCombatant(parentA, mossveil, content.traits);
const defender = createCombatant(parentB, mossveil, content.traits);

console.log(JSON.stringify({
  offspring: { id: offspring.id, species: offspring.speciesId, potential: offspring.potential, parents: offspring.lineage.parentIds },
  listing: { id: listing.id, askingPrice: listing.askingPrice, expiresOnDay: listing.expiresOnDay },
  marketDay: market.day,
  expedition: { zone: expedition.zoneId, route: expedition.nodes.map((node) => node.type) },
  sampleDamage: calculateDamage(42, attacker, defender),
}, null, 2));
