import type { HomebaseState } from "../systems/homebase.ts";
import type { MarketState } from "../systems/market.ts";
import type { MonsterIndividual } from "../core/types.ts";
import type { ExpeditionState } from "../systems/exploration.ts";

export const SAVE_VERSION = 7;

export type ThemePreference = "system" | "light" | "dark";
export interface UiPreferences { theme: ThemePreference; reducedMotion: boolean }

export interface SpeciesResearch { level: number; points: number }

export interface MonsterCondition {
  hpRatio: number;
  stamina: number;
}

export interface ActiveExpedition {
  route: ExpeditionState;
  startedOnDay: number;
  rewards: Readonly<Record<string, number>>;
}

export interface PlayerState {
  id: string;
  name: string;
  crowns: number;
  inventory: Readonly<Record<string, number>>;
  monsterIds: readonly string[];
  activeTeamIds: readonly string[];
  reputation: number;
  researchBySpecies: Readonly<Record<string, SpeciesResearch>>;
}

export interface WorldState {
  day: number;
  seed: number;
  nextRandomOffset: number;
  unlockedZoneIds: readonly string[];
  season: "spring" | "summer" | "autumn" | "winter";
  weatherByRegion: Readonly<Record<string, string>>;
  populations: Readonly<Record<string, number>>;
}

export interface BreedingJob {
  id: string;
  parentIds: readonly [string, string];
  startedOnDay: number;
  completesOnDay: number;
  status: "active" | "ready";
}

export interface ContractState {
  definitionId: string;
  acceptedOnDay: number;
  expiresOnDay: number;
  progress: number;
  status: "active" | "complete" | "claimed" | "expired";
}

export interface TrainerState {
  definitionId: string;
  monsterIds: readonly string[];
  relationship: number;
  wins: number;
  losses: number;
  lastChallengeDay?: number;
}

export interface GameState {
  saveVersion: number;
  contentVersion: number;
  player: PlayerState;
  world: WorldState;
  monsters: Readonly<Record<string, MonsterIndividual>>;
  conditions: Readonly<Record<string, MonsterCondition>>;
  activeExpedition?: ActiveExpedition;
  market: MarketState;
  homebase: HomebaseState;
  breedingJobs: readonly BreedingJob[];
  uiPreferences: UiPreferences;
  contracts: readonly ContractState[];
  trainers: Readonly<Record<string, TrainerState>>;
}

export function createNewGame(playerName: string, seed: number, contentVersion: number): GameState {
  const trimmedName = playerName.trim();
  if (!trimmedName) throw new Error("Player name is required.");
  return {
    saveVersion: SAVE_VERSION,
    contentVersion,
    player: {
      id: "player", name: trimmedName, crowns: 750,
      inventory: { "field-capsule": 5, "training-band": 1, "trail-harness": 1, herbs: 5, timber: 50, stone: 25 },
      monsterIds: [], activeTeamIds: [], reputation: 0, researchBySpecies: {},
    },
    world: { day: 1, seed, nextRandomOffset: 0, unlockedZoneIds: ["greenreach-meadow"], season: "spring", weatherByRegion: { greenreach: "clear", stormpeak: "windy" }, populations: {} },
    monsters: {},
    conditions: {},
    market: { day: 1, indices: {}, listings: [], events: [] },
    homebase: { slotCount: 3, buildings: [], resources: { timber: 50, stone: 25, herbs: 5 } },
    breedingJobs: [],
    uiPreferences: { theme: "system", reducedMotion: false },
    contracts: [],
    trainers: {},
  };
}

export function addMonsterToPlayer(state: GameState, monster: MonsterIndividual, addToTeam = false): GameState {
  const owned = { ...monster, ownerId: state.player.id };
  return {
    ...state,
    monsters: { ...state.monsters, [owned.id]: owned },
    conditions: { ...state.conditions, [owned.id]: { hpRatio: 1, stamina: 100 } },
    player: {
      ...state.player,
      monsterIds: [...state.player.monsterIds, owned.id],
      activeTeamIds: addToTeam && state.player.activeTeamIds.length < 5 ? [...state.player.activeTeamIds, owned.id] : state.player.activeTeamIds,
    },
  };
}

export function changeInventory(state: GameState, itemId: string, delta: number): GameState {
  const next = (state.player.inventory[itemId] ?? 0) + delta;
  if (next < 0) throw new Error(`Not enough ${itemId}.`);
  return { ...state, player: { ...state.player, inventory: { ...state.player.inventory, [itemId]: next } } };
}
