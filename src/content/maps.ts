export type MapLevel = "continent" | "region" | "city";
export type MapAssetStatus = "ready" | "awaiting-upload";
export type CityPlaceCapability =
  | "government" | "market" | "arena" | "monster-storage" | "clinic"
  | "breeding" | "workshop" | "expedition" | "transport";

export interface NormalizedMapBounds { x: number; y: number; width: number; height: number; }

export interface MapHotspotDefinition {
  id: string;
  label: string;
  kind: "region" | "major-city" | "city-place";
  bounds: NormalizedMapBounds;
  destinationMapId?: string;
  placeId?: string;
  capability?: CityPlaceCapability;
}

export interface InteractiveMapDefinition {
  id: string;
  name: string;
  level: MapLevel;
  parentMapId?: string;
  assetId?: string;
  assetStatus: MapAssetStatus;
  unlockId?: string;
  hotspots: readonly MapHotspotDefinition[];
}

const region = (id: string, label: string, bounds: NormalizedMapBounds): MapHotspotDefinition => ({
  id: `open-${id}`, label, kind: "region", bounds, destinationMapId: `region-${id}`,
});
const city = (id: string, label: string, bounds: NormalizedMapBounds): MapHotspotDefinition => ({
  id: `open-${id}`, label, kind: "major-city", bounds, destinationMapId: `city-${id}`,
});
const place = (cityId: string, id: string, label: string, capability: CityPlaceCapability, bounds: NormalizedMapBounds): MapHotspotDefinition => ({
  id: `visit-${cityId}-${id}`, placeId: `${cityId}-${id}`, label, kind: "city-place", capability, bounds,
});

const readyRegion = (id: string, name: string, parentMapId: string, cityId: string, cityName: string, cityBounds: NormalizedMapBounds, unlockId?: string): InteractiveMapDefinition => ({
  id: `region-${id}`, name, level: "region", parentMapId, assetId: `maps/regions/region--${id}--map`,
  assetStatus: "ready", unlockId, hotspots: [city(cityId, cityName, cityBounds)],
});
const pendingMap = (id: string, name: string, level: MapLevel, parentMapId: string, unlockId?: string): InteractiveMapDefinition => ({
  id, name, level, parentMapId, assetStatus: "awaiting-upload", unlockId, hotspots: [],
});

const CITY_PLACES: Readonly<Record<string, readonly MapHotspotDefinition[]>> = {
  aurelia: [
    place("aurelia", "palace", "Sovereign Palace", "government", { x: 0.35, y: 0.20, width: 0.30, height: 0.20 }),
    place("aurelia", "market", "Exchange Market", "market", { x: 0.06, y: 0.19, width: 0.30, height: 0.22 }),
    place("aurelia", "arena", "Grand Arena", "arena", { x: 0.70, y: 0.31, width: 0.27, height: 0.24 }),
    place("aurelia", "stables", "Monster Stables", "monster-storage", { x: 0.67, y: 0.49, width: 0.30, height: 0.23 }),
    place("aurelia", "clinic", "Field Clinic", "clinic", { x: 0.67, y: 0.14, width: 0.29, height: 0.19 }),
    place("aurelia", "gardens", "Breeding Gardens", "breeding", { x: 0.03, y: 0.47, width: 0.31, height: 0.22 }),
    place("aurelia", "guild", "Expedition Guild", "expedition", { x: 0.32, y: 0.75, width: 0.37, height: 0.18 }),
    place("aurelia", "docks", "Silverwind Docks", "transport", { x: 0.33, y: 0.55, width: 0.36, height: 0.19 }),
  ],
  stonehollow: [
    place("stonehollow", "market", "Exchange Market", "market", { x: 0.05, y: 0.23, width: 0.31, height: 0.18 }),
    place("stonehollow", "quarry", "Great Quarry", "government", { x: 0.34, y: 0.33, width: 0.34, height: 0.17 }),
    place("stonehollow", "workshop", "Forge Workshop", "workshop", { x: 0.68, y: 0.30, width: 0.29, height: 0.20 }),
    place("stonehollow", "arena", "Stone Arena", "arena", { x: 0.03, y: 0.44, width: 0.31, height: 0.18 }),
    place("stonehollow", "storage", "Monster Storage", "monster-storage", { x: 0.03, y: 0.57, width: 0.31, height: 0.17 }),
    place("stonehollow", "clinic", "Field Clinic", "clinic", { x: 0.64, y: 0.54, width: 0.31, height: 0.17 }),
    place("stonehollow", "guild", "Expedition Guild", "expedition", { x: 0.61, y: 0.44, width: 0.35, height: 0.17 }),
    place("stonehollow", "station", "Ironroad Station", "transport", { x: 0.34, y: 0.60, width: 0.35, height: 0.17 }),
  ],
  drakoria: [
    place("drakoria", "citadel", "High Citadel", "government", { x: 0.34, y: 0.13, width: 0.34, height: 0.24 }),
    place("drakoria", "market", "Blazefang Market", "market", { x: 0.67, y: 0.34, width: 0.30, height: 0.20 }),
    place("drakoria", "arena", "Dragon Arena", "arena", { x: 0.69, y: 0.20, width: 0.28, height: 0.18 }),
    place("drakoria", "roosts", "Monster Roosts", "monster-storage", { x: 0.03, y: 0.20, width: 0.31, height: 0.20 }),
    place("drakoria", "clinic", "Ember Clinic", "clinic", { x: 0.04, y: 0.36, width: 0.29, height: 0.18 }),
    place("drakoria", "workshop", "Forge Workshop", "workshop", { x: 0.34, y: 0.35, width: 0.33, height: 0.18 }),
    place("drakoria", "guild", "Expedition Guild", "expedition", { x: 0.66, y: 0.46, width: 0.31, height: 0.17 }),
    place("drakoria", "gate", "Blackstone Gate", "transport", { x: 0.34, y: 0.50, width: 0.34, height: 0.18 }),
  ],
  steelgate: [
    place("steelgate", "citadel", "Iron Citadel", "government", { x: 0.33, y: 0.12, width: 0.35, height: 0.20 }),
    place("steelgate", "market", "Exchange Market", "market", { x: 0.04, y: 0.20, width: 0.32, height: 0.20 }),
    place("steelgate", "arena", "Steel Arena", "arena", { x: 0.68, y: 0.20, width: 0.29, height: 0.20 }),
    place("steelgate", "depot", "Monster Depot", "monster-storage", { x: 0.66, y: 0.34, width: 0.31, height: 0.18 }),
    place("steelgate", "clinic", "Foundry Clinic", "clinic", { x: 0.34, y: 0.35, width: 0.32, height: 0.16 }),
    place("steelgate", "workshop", "Forge Workshop", "workshop", { x: 0.34, y: 0.44, width: 0.32, height: 0.17 }),
    place("steelgate", "guild", "Expedition Guild", "expedition", { x: 0.05, y: 0.57, width: 0.31, height: 0.18 }),
    place("steelgate", "station", "Ironrail Station", "transport", { x: 0.61, y: 0.57, width: 0.34, height: 0.18 }),
  ],
  thunderwatch: [
    place("thunderwatch", "citadel", "Upper Citadel", "government", { x: 0.31, y: 0.12, width: 0.38, height: 0.22 }),
    place("thunderwatch", "market", "Exchange Market", "market", { x: 0.33, y: 0.33, width: 0.35, height: 0.17 }),
    place("thunderwatch", "arena", "Storm Arena", "arena", { x: 0.34, y: 0.46, width: 0.34, height: 0.16 }),
    place("thunderwatch", "aerie", "Monster Aerie", "monster-storage", { x: 0.67, y: 0.47, width: 0.30, height: 0.18 }),
    place("thunderwatch", "clinic", "Tempest Clinic", "clinic", { x: 0.67, y: 0.29, width: 0.29, height: 0.17 }),
    place("thunderwatch", "workshop", "Arc Workshop", "workshop", { x: 0.03, y: 0.29, width: 0.29, height: 0.18 }),
    place("thunderwatch", "guild", "Expedition Guild", "expedition", { x: 0.33, y: 0.60, width: 0.36, height: 0.17 }),
    place("thunderwatch", "station", "Ironrail Station", "transport", { x: 0.02, y: 0.58, width: 0.31, height: 0.19 }),
  ],
  glacierhold: [
    place("glacierhold", "keep", "Frostkeep", "government", { x: 0.32, y: 0.13, width: 0.37, height: 0.22 }),
    place("glacierhold", "market", "Exchange Market", "market", { x: 0.03, y: 0.28, width: 0.35, height: 0.20 }),
    place("glacierhold", "arena", "Ice Arena", "arena", { x: 0.67, y: 0.31, width: 0.30, height: 0.20 }),
    place("glacierhold", "lodge", "Monster Lodge", "monster-storage", { x: 0.63, y: 0.46, width: 0.34, height: 0.18 }),
    place("glacierhold", "clinic", "Hearth Clinic", "clinic", { x: 0.04, y: 0.51, width: 0.32, height: 0.17 }),
    place("glacierhold", "workshop", "Rime Workshop", "workshop", { x: 0.20, y: 0.58, width: 0.34, height: 0.17 }),
    place("glacierhold", "guild", "Expedition Guild", "expedition", { x: 0.58, y: 0.55, width: 0.38, height: 0.17 }),
    place("glacierhold", "harbor", "Iceharbor", "transport", { x: 0.23, y: 0.65, width: 0.31, height: 0.16 }),
  ],
};

const readyCity = (id: string, name: string, parentMapId: string, unlockId?: string): InteractiveMapDefinition => ({
  id: `city-${id}`, name, level: "city", parentMapId, assetId: `maps/cities/city--${id}--map`,
  assetStatus: "ready", unlockId, hotspots: CITY_PLACES[id] ?? [],
});

export const interactiveMaps: readonly InteractiveMapDefinition[] = [
  {
    id: "continent-heartland", name: "Heartland Continent", level: "continent", assetStatus: "ready",
    assetId: "maps/continents/continent--heartland--world-map",
    hotspots: [
      region("frostmarch", "Frostmarch", { x: 0.27, y: 0.02, width: 0.34, height: 0.23 }),
      region("stormpeak", "Stormpeak", { x: 0.63, y: 0.03, width: 0.34, height: 0.36 }),
      region("greenreach", "Greenreach", { x: 0.02, y: 0.13, width: 0.34, height: 0.35 }),
      region("stonehollow", "Stonehollow", { x: 0.25, y: 0.24, width: 0.31, height: 0.34 }),
      region("iron-dominion", "Iron Dominion", { x: 0.63, y: 0.35, width: 0.34, height: 0.29 }),
      region("aurelia", "Aurelia", { x: 0.37, y: 0.43, width: 0.31, height: 0.28 }),
      region("mistwater-coast", "Mistwater Coast", { x: 0.02, y: 0.58, width: 0.47, height: 0.36 }),
      region("mirefen", "Mirefen", { x: 0.64, y: 0.59, width: 0.33, height: 0.36 }),
    ],
  },
  {
    id: "continent-frontier", name: "Frontier Continent", level: "continent", assetStatus: "ready",
    assetId: "maps/continents/continent--frontier--world-map", unlockId: "late-game-continent",
    hotspots: [
      region("dragonspine", "Dragonspine", { x: 0.04, y: 0.02, width: 0.92, height: 0.29 }),
      region("crystal-depths", "Crystal Depths", { x: 0.03, y: 0.29, width: 0.49, height: 0.36 }),
      region("the-deep", "The Deep", { x: 0.51, y: 0.31, width: 0.46, height: 0.35 }),
      region("rift", "The Rift", { x: 0.03, y: 0.65, width: 0.94, height: 0.32 }),
    ],
  },
  readyRegion("frostmarch", "Frostmarch", "continent-heartland", "glacierhold", "Glacierhold", { x: 0.28, y: 0.34, width: 0.44, height: 0.28 }),
  readyRegion("stormpeak", "Stormpeak", "continent-heartland", "thunderwatch", "Thunderwatch", { x: 0.34, y: 0.32, width: 0.34, height: 0.25 }),
  readyRegion("greenreach", "Greenreach", "continent-heartland", "hearthbrook", "Hearthbrook", { x: 0.31, y: 0.34, width: 0.39, height: 0.29 }),
  readyRegion("iron-dominion", "Iron Dominion", "continent-heartland", "steelgate", "Steelgate", { x: 0.10, y: 0.22, width: 0.43, height: 0.33 }),
  readyRegion("aurelia", "Aurelia", "continent-heartland", "aurelia", "Aurelia", { x: 0.18, y: 0.23, width: 0.64, height: 0.43 }),
  readyRegion("mistwater-coast", "Mistwater Coast", "continent-heartland", "saltwharf", "Saltwharf", { x: 0.25, y: 0.28, width: 0.48, height: 0.29 }),
  readyRegion("mirefen", "Mirefen", "continent-heartland", "bogmoor", "Bogmoor", { x: 0.29, y: 0.29, width: 0.43, height: 0.29 }),
  pendingMap("region-stonehollow", "Stonehollow", "region", "continent-heartland"),
  readyRegion("dragonspine", "Dragonspine", "continent-frontier", "drakoria", "Drakoria", { x: 0.29, y: 0.28, width: 0.43, height: 0.34 }, "late-game-continent"),
  readyRegion("crystal-depths", "Crystal Depths", "continent-frontier", "luminspire", "Luminspire", { x: 0.31, y: 0.34, width: 0.39, height: 0.25 }, "late-game-continent"),
  readyRegion("the-deep", "The Deep", "continent-frontier", "abyssal-point", "Abyssal Point", { x: 0.25, y: 0.30, width: 0.50, height: 0.31 }, "late-game-continent"),
  readyRegion("rift", "The Rift", "continent-frontier", "nullspire", "Nullspire", { x: 0.34, y: 0.31, width: 0.34, height: 0.28 }, "late-game-continent"),
  readyCity("aurelia", "Aurelia", "region-aurelia"),
  readyCity("stonehollow", "Stonehollow", "region-stonehollow"),
  readyCity("drakoria", "Drakoria", "region-dragonspine", "late-game-continent"),
  readyCity("steelgate", "Steelgate", "region-iron-dominion"),
  readyCity("thunderwatch", "Thunderwatch", "region-stormpeak"),
  readyCity("glacierhold", "Glacierhold", "region-frostmarch"),
  pendingMap("city-hearthbrook", "Hearthbrook", "city", "region-greenreach"),
  pendingMap("city-saltwharf", "Saltwharf", "city", "region-mistwater-coast"),
  pendingMap("city-bogmoor", "Bogmoor", "city", "region-mirefen"),
  pendingMap("city-luminspire", "Luminspire", "city", "region-crystal-depths", "late-game-continent"),
  pendingMap("city-abyssal-point", "Abyssal Point", "city", "region-the-deep", "late-game-continent"),
  pendingMap("city-nullspire", "Nullspire", "city", "region-rift", "late-game-continent"),
];

export function mapById(id: string): InteractiveMapDefinition {
  const map = interactiveMaps.find((candidate) => candidate.id === id);
  if (!map) throw new Error(`Unknown interactive map: ${id}`);
  return map;
}
