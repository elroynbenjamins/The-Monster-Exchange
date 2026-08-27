import assert from "node:assert/strict";
import test from "node:test";
import { byId, content, encounterSpeciesWeight } from "../src/index.ts";

test("population directly changes a species encounter weight within safe bounds", () => {
  const species = byId(content.species, "mossveil");
  assert.equal(encounterSpeciesWeight(100, species, { populations: { mossveil: 50 } }), 50);
  assert.equal(encounterSpeciesWeight(100, species, { populations: { mossveil: 180 } }), 150);
});

test("season and weather favor ecologically matching monster types", () => {
  const mossveil = byId(content.species, "mossveil");
  const voltgrazer = byId(content.species, "voltgrazer");
  assert.ok(encounterSpeciesWeight(100, mossveil, { season: "spring" }) > encounterSpeciesWeight(100, mossveil, { season: "winter" }));
  assert.ok(encounterSpeciesWeight(100, voltgrazer, { weather: "thunderstorm" }) > encounterSpeciesWeight(100, voltgrazer, { weather: "clear" }));
});
