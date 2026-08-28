import { interactiveMaps } from "../content/maps.ts";
import { transportRoutes, type TransportRouteDefinition } from "../content/travel.ts";

export interface TravelState { regionId: string; day: number; crowns: number; }
export interface TravelAccess { unlockIds: ReadonlySet<string>; }

export type TravelResult =
  | { status: "travelled"; state: TravelState; route: TransportRouteDefinition }
  | { status: "unknown-route" | "wrong-origin" | "locked" | "insufficient-crowns"; state: TravelState; route?: TransportRouteDefinition };

export function routesFrom(regionId: string, access: TravelAccess): readonly TransportRouteDefinition[] {
  return transportRoutes.filter((route) =>
    (route.fromRegionId === regionId || route.toRegionId === regionId)
    && (!route.requiredUnlockId || access.unlockIds.has(route.requiredUnlockId)),
  );
}

export function routeDestination(route: TransportRouteDefinition, originRegionId: string): string | undefined {
  if (route.fromRegionId === originRegionId) return route.toRegionId;
  if (route.toRegionId === originRegionId) return route.fromRegionId;
  return undefined;
}

export function travelRegion(state: TravelState, routeId: string, access: TravelAccess): TravelResult {
  const route = transportRoutes.find(({ id }) => id === routeId);
  if (!route) return { status: "unknown-route", state };
  const destination = routeDestination(route, state.regionId);
  if (!destination) return { status: "wrong-origin", state, route };
  if (route.requiredUnlockId && !access.unlockIds.has(route.requiredUnlockId)) return { status: "locked", state, route };
  if (state.crowns < route.costCrowns) return { status: "insufficient-crowns", state, route };
  return {
    status: "travelled", route,
    state: { regionId: destination, day: state.day + route.durationDays, crowns: state.crowns - route.costCrowns },
  };
}

export function isTransportPlace(placeId: string): boolean {
  return interactiveMaps.some((map) => map.hotspots.some((hotspot) => hotspot.placeId === placeId && hotspot.capability === "transport"));
}
