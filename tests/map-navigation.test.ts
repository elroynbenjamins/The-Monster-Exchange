import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { interactiveMaps, mapById } from "../src/content/maps.ts";
import { activateMapPoint, closeMapLevel, createMapNavigation, openMap } from "../src/systems/map-navigation.ts";

const earlyGame = { unlockIds: new Set<string>() };
const lateGame = { unlockIds: new Set(["STORY_VEYDRIS_ACCESS"]) };

test("continent hotspots zoom into uploaded region maps", () => {
  const state = createMapNavigation();
  const result = activateMapPoint(state, 0.8, 0.2, earlyGame);
  assert.equal(result.status, "opened");
  if (result.status !== "opened") return;
  assert.equal(result.state.currentMapId, "region-stormpeak");
  assert.equal(closeMapLevel(result.state).currentMapId, "continent-ardenfall");
});

test("late-game continent and its regions require an explicit unlock", () => {
  const state = createMapNavigation();
  assert.equal(openMap(state, "continent-veydris", earlyGame).status, "locked");
  assert.equal(openMap(state, "continent-veydris", lateGame).status, "opened");
});

test("major cities are clickable and report their pending city-map upload", () => {
  const state = { currentMapId: "region-rift", history: ["continent-veydris"] };
  const result = activateMapPoint(state, 0.5, 0.45, lateGame);
  assert.equal(result.status, "awaiting-upload");
  assert.equal(result.map?.id, "city-seamwatch");
});

test("ready city maps expose selectable gameplay places", () => {
  const state = { currentMapId: "city-crownspire", history: ["continent-ardenfall", "region-aurelia"] };
  const result = activateMapPoint(state, 0.8, 0.4, earlyGame);
  assert.equal(result.status, "place-selected");
  if (result.status === "place-selected") assert.equal(result.hotspot.capability, "arena");
});

test("every ready map asset follows the pixel-map naming convention", () => {
  for (const map of interactiveMaps.filter(({ assetStatus }) => assetStatus === "ready")) {
    assert.match(map.assetId ?? "", /^maps\/(continents|regions|cities)\/(continent|region|city)--[a-z0-9-]+--(?:world-)?map$/);
    assert.equal(existsSync(`assets/pixel/${map.assetId}.png`), true, `${map.id} asset is missing`);
  }
  assert.equal(mapById("region-crystal-depths").hotspots[0]?.label, "Lumenfall");
});
