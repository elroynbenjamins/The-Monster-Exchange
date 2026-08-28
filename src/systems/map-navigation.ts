import { mapById, type InteractiveMapDefinition, type MapHotspotDefinition } from "../content/maps.ts";

export interface MapNavigationState {
  currentMapId: string;
  history: readonly string[];
}

export interface MapAccess {
  unlockIds: ReadonlySet<string>;
}

export type MapNavigationResult =
  | { status: "opened"; state: MapNavigationState; map: InteractiveMapDefinition }
  | { status: "place-selected"; state: MapNavigationState; hotspot: MapHotspotDefinition }
  | { status: "locked" | "awaiting-upload" | "no-hotspot"; state: MapNavigationState; map?: InteractiveMapDefinition; hotspot?: MapHotspotDefinition };

export function createMapNavigation(startMapId = "continent-heartland"): MapNavigationState {
  mapById(startMapId);
  return { currentMapId: startMapId, history: [] };
}

export function canAccessMap(map: InteractiveMapDefinition, access: MapAccess): boolean {
  return !map.unlockId || access.unlockIds.has(map.unlockId);
}

export function hotspotAt(map: InteractiveMapDefinition, x: number, y: number): MapHotspotDefinition | undefined {
  if (x < 0 || x > 1 || y < 0 || y > 1) return undefined;
  return map.hotspots.find(({ bounds }) => x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height);
}

export function openMap(state: MapNavigationState, destinationMapId: string, access: MapAccess): MapNavigationResult {
  const destination = mapById(destinationMapId);
  if (!canAccessMap(destination, access)) return { status: "locked", state, map: destination };
  if (destination.assetStatus !== "ready") return { status: "awaiting-upload", state, map: destination };
  return {
    status: "opened", map: destination,
    state: { currentMapId: destination.id, history: [...state.history, state.currentMapId] },
  };
}

export function activateMapPoint(state: MapNavigationState, x: number, y: number, access: MapAccess): MapNavigationResult {
  const current = mapById(state.currentMapId);
  const hotspot = hotspotAt(current, x, y);
  if (!hotspot) return { status: "no-hotspot", state };
  if (hotspot.kind === "city-place") return { status: "place-selected", state, hotspot };
  if (!hotspot.destinationMapId) return { status: "no-hotspot", state };
  const result = openMap(state, hotspot.destinationMapId, access);
  return result.status === "opened" ? result : { ...result, hotspot };
}

export function closeMapLevel(state: MapNavigationState): MapNavigationState {
  const previous = state.history.at(-1);
  if (!previous) return state;
  return { currentMapId: previous, history: state.history.slice(0, -1) };
}
