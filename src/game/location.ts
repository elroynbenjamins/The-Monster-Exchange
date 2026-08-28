import type { GameContent } from "../content/definitions.ts";
import { interactiveMaps, mapById, type CityPlaceCapability } from "../content/maps.ts";
import { transportRoutes } from "../content/travel.ts";
import { routeDestination, travelRegion } from "../systems/travel.ts";
import type { GameState } from "./state.ts";
import { advanceWorldDay } from "./world-tick.ts";

const MAJOR_CITY_BY_REGION: Readonly<Record<string, string>> = {
  greenreach: "hearthbrook", frostmarch: "glacierhold", stormpeak: "thunderwatch",
  stonehollow: "stonehollow", aurelia: "aurelia", "iron-dominion": "steelgate",
  "mistwater-coast": "saltwharf", mirefen: "bogmoor", dragonspine: "drakoria",
  "crystal-depths": "luminspire", "the-deep": "abyssal-point", rift: "nullspire",
};

const FALLBACK_SERVICES: readonly CityPlaceCapability[] = ["market", "arena", "monster-storage", "clinic", "workshop", "breeding", "expedition", "transport"];

export function majorCityForRegion(regionId: string): string | undefined { return MAJOR_CITY_BY_REGION[regionId]; }

export function cityServices(cityId: string): readonly CityPlaceCapability[] {
  const cityMap = interactiveMaps.find(({ id }) => id === `city-${cityId}`);
  if (!cityMap) return [];
  const authored = cityMap.hotspots.flatMap(({ capability }) => capability ? [capability] : []);
  return authored.length ? [...new Set(authored)] : FALLBACK_SERVICES;
}

export function enterMajorCity(state: GameState): GameState {
  const cityId = majorCityForRegion(state.player.location.regionId);
  if (!cityId) throw new Error("This region has no major city.");
  const cityMap = mapById(`city-${cityId}`);
  if (cityMap.unlockId && !state.world.unlockedMapIds.includes(cityMap.unlockId)) throw new Error("This city is still locked.");
  return { ...state, player: { ...state.player, location: { ...state.player.location, cityId } } };
}

export function leaveCity(state: GameState): GameState {
  return { ...state, player: { ...state.player, location: { regionId: state.player.location.regionId } } };
}

export function availablePlayerRoutes(state: GameState) {
  return transportRoutes.filter((route) => route.fromRegionId === state.player.location.regionId || route.toRegionId === state.player.location.regionId);
}

export function travelPlayer(state: GameState, routeId: string, content: GameContent): GameState {
  if (state.activeExpedition) throw new Error("Finish or retreat from the expedition before travelling.");
  const access = { unlockIds: new Set(state.world.unlockedMapIds) };
  const result = travelRegion({ regionId: state.player.location.regionId, day: state.world.day, crowns: state.player.crowns }, routeId, access);
  if (result.status !== "travelled") {
    const messages = { "unknown-route": "Unknown route.", "wrong-origin": "That route does not depart from here.", locked: "That route is still locked.", "insufficient-crowns": "Not enough Crowns for this journey." };
    throw new Error(messages[result.status]);
  }
  let next: GameState = { ...state, player: { ...state.player, crowns: result.state.crowns, location: { regionId: routeDestination(result.route, state.player.location.regionId)! } } };
  for (let day = 0; day < result.route.durationDays; day++) next = advanceWorldDay(next, content).state;
  return next;
}
