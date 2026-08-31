import assert from "node:assert/strict";
import test from "node:test";
import { isTransportPlace, routesFrom, travelRegion } from "../src/systems/travel.ts";

const early = { unlockIds: new Set<string>() };
const late = { unlockIds: new Set(["STORY_VEYDRIS_ACCESS"]) };

test("transport routes move between regions and charge time and Crowns", () => {
  const result = travelRegion({ regionId: "greenreach", day: 4, crowns: 100 }, "greenreach-frostmarch-road", early);
  assert.equal(result.status, "travelled");
  if (result.status !== "travelled") return;
  assert.deepEqual(result.state, { regionId: "frostmarch", day: 5, crowns: 65 });
});

test("routes are bidirectional and late-game crossings remain locked", () => {
  assert.equal(travelRegion({ regionId: "frostmarch", day: 1, crowns: 100 }, "greenreach-frostmarch-road", early).status, "travelled");
  assert.equal(travelRegion({ regionId: "stormpeak", day: 1, crowns: 999 }, "stormpeak-dragonspine-airship", early).status, "locked");
  assert.equal(routesFrom("stormpeak", late).some(({ id }) => id === "stormpeak-dragonspine-airship"), true);
});

test("city transport labels connect map interaction to regional travel", () => {
  assert.equal(isTransportPlace("aurelia-docks"), true);
  assert.equal(isTransportPlace("stonehollow-market"), false);
});
