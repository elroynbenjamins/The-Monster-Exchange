export type TransportMode = "road" | "rail" | "ferry" | "airship";

export interface TransportRouteDefinition {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  mode: TransportMode;
  costCrowns: number;
  durationDays: number;
  requiredUnlockId?: string;
}

export const transportRoutes: readonly TransportRouteDefinition[] = [
  { id: "greenreach-frostmarch-road", fromRegionId: "greenreach", toRegionId: "frostmarch", mode: "road", costCrowns: 35, durationDays: 1 },
  { id: "greenreach-stonehollow-road", fromRegionId: "greenreach", toRegionId: "stonehollow", mode: "road", costCrowns: 30, durationDays: 1 },
  { id: "greenreach-mistwater-road", fromRegionId: "greenreach", toRegionId: "mistwater-coast", mode: "road", costCrowns: 40, durationDays: 1 },
  { id: "frostmarch-stormpeak-rail", fromRegionId: "frostmarch", toRegionId: "stormpeak", mode: "rail", costCrowns: 85, durationDays: 1 },
  { id: "stonehollow-aurelia-rail", fromRegionId: "stonehollow", toRegionId: "aurelia", mode: "rail", costCrowns: 55, durationDays: 1 },
  { id: "stormpeak-iron-rail", fromRegionId: "stormpeak", toRegionId: "iron-dominion", mode: "rail", costCrowns: 80, durationDays: 1 },
  { id: "aurelia-iron-road", fromRegionId: "aurelia", toRegionId: "iron-dominion", mode: "road", costCrowns: 50, durationDays: 1 },
  { id: "aurelia-mistwater-ferry", fromRegionId: "aurelia", toRegionId: "mistwater-coast", mode: "ferry", costCrowns: 70, durationDays: 1 },
  { id: "iron-mirefen-rail", fromRegionId: "iron-dominion", toRegionId: "mirefen", mode: "rail", costCrowns: 75, durationDays: 1 },
  { id: "mistwater-crystal-ferry", fromRegionId: "mistwater-coast", toRegionId: "crystal-depths", mode: "ferry", costCrowns: 240, durationDays: 2, requiredUnlockId: "STORY_VEYDRIS_ACCESS" },
  { id: "stormpeak-dragonspine-airship", fromRegionId: "stormpeak", toRegionId: "dragonspine", mode: "airship", costCrowns: 320, durationDays: 1, requiredUnlockId: "STORY_VEYDRIS_ACCESS" },
  { id: "dragonspine-deep-rail", fromRegionId: "dragonspine", toRegionId: "the-deep", mode: "rail", costCrowns: 180, durationDays: 1, requiredUnlockId: "STORY_VEYDRIS_ACCESS" },
  { id: "crystal-deep-ferry", fromRegionId: "crystal-depths", toRegionId: "the-deep", mode: "ferry", costCrowns: 120, durationDays: 1, requiredUnlockId: "STORY_VEYDRIS_ACCESS" },
  { id: "deep-rift-ferry", fromRegionId: "the-deep", toRegionId: "rift", mode: "ferry", costCrowns: 210, durationDays: 2, requiredUnlockId: "STORY_VEYDRIS_ACCESS" },
];
