import type { HomebaseState } from "../systems/homebase.ts";
import type { MarketState } from "../systems/market.ts";
import type { MonsterIndividual } from "../core/types.ts";
import type { ExpeditionState } from "../systems/exploration.ts";

export const SAVE_VERSION = 2;

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
}

export interface WorldState {
  day: number;
  seed: number;
  nextRandomOffset: number;
  unlockedZoneIds: readonly string[];
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
}

export function createNewGame(playerName: string, seed: number, contentVersion: number): GameState {
  const trimmedName = playerName.trim();
  if (!trimmedName) throw new Error("Player name is required.");
  return {
    saveVersion: SAVE_VERSION,
    contentVersion,
    player: {
      id: "player", name: trimmedName, crowns: 750,
      inventory: { "field-capsule": 5, herbs: 5, timber: 50, stone: 25 },
      monsterIds: [], activeTeamIds: [], reputation: 0,
    },
    world: { day: 1, seed, nextRandomOffset: 0, unlockedZoneIds: ["greenreach-meadow"] },
    monsters: {},
    conditions: {},
    market: { day: 1, indices: {}, listings: [], events: [] },
    homebase: { slotCount: 3, buildings: [], resources: { timber: 50, stone: 25, herbs: 5 } },
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
