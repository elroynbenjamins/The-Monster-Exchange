import type { DomainEvent, GameType, MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import type { SkillDefinition, TraitDefinition } from "../content/definitions.ts";
import { calculateDamage, createCombatant, typeMultiplier } from "./combat.ts";

export type BattleSide = "player" | "enemy";
export type BattleResult = "player-victory" | "enemy-victory" | "ongoing";

export interface BattleUnit {
  id: string;
  side: BattleSide;
  monster: MonsterIndividual;
  species: SpeciesDefinition;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  attack: number;
  defense: number;
  readyAt: number;
  cooldowns: Readonly<Record<string, number>>;
  statuses: readonly string[];
}

export interface BattleState {
  tick: number;
  round: number;
  units: readonly BattleUnit[];
  result: BattleResult;
  events: readonly DomainEvent[];
}

export type BattleAction =
  | { kind: "basic"; actorId: string; targetId: string }
  | { kind: "skill"; actorId: string; skillId: string; targetId?: string };

export interface BattleContent {
  species: readonly SpeciesDefinition[];
  traits: readonly TraitDefinition[];
  skills: readonly SkillDefinition[];
}

export function createBattle(
  playerMonsters: readonly MonsterIndividual[],
  enemyMonsters: readonly MonsterIndividual[],
  content: BattleContent,
  initialHpRatios: Readonly<Record<string, number>> = {},
): BattleState {
  if (!playerMonsters.length || !enemyMonsters.length) throw new Error("A battle requires monsters on both sides.");
  const makeUnits = (monsters: readonly MonsterIndividual[], side: BattleSide): BattleUnit[] => monsters.slice(0, 3).map((monster) => {
    const species = content.species.find(({ id }) => id === monster.speciesId);
    if (!species) throw new Error(`Unknown species ${monster.speciesId}.`);
    const combatant = createCombatant(monster, species, content.traits);
    const ratio = Math.max(0.01, Math.min(1, initialHpRatios[monster.id] ?? 1));
    return {
      id: monster.id, side, monster, species, hp: Math.max(1, Math.round(combatant.stats.hp * ratio)), maxHp: combatant.stats.hp,
      energy: combatant.stats.energy, maxEnergy: combatant.stats.energy, speed: combatant.stats.speed,
      attack: combatant.stats.attack, defense: combatant.stats.defense, readyAt: combatant.nextActionAt,
      cooldowns: {}, statuses: [],
    };
  });
  return { tick: 0, round: 0, units: [...makeUnits(playerMonsters, "player"), ...makeUnits(enemyMonsters, "enemy")], result: "ongoing", events: [] };
}

export function nextActor(state: BattleState): BattleUnit | undefined {
  return state.units.filter(({ hp }) => hp > 0).sort((a, b) => a.readyAt - b.readyAt || b.speed - a.speed)[0];
}

export function validActions(state: BattleState, actorId: string, skills: readonly SkillDefinition[]): readonly BattleAction[] {
  const actor = state.units.find(({ id }) => id === actorId);
  if (!actor || actor.hp <= 0 || state.result !== "ongoing") return [];
  const enemies = state.units.filter((unit) => unit.side !== actor.side && unit.hp > 0);
  const allies = state.units.filter((unit) => unit.side === actor.side && unit.hp > 0);
  const actions: BattleAction[] = enemies.map((target) => ({ kind: "basic", actorId, targetId: target.id }));
  for (const skillId of actor.monster.equippedSkillIds) {
    const skill = skills.find(({ id }) => id === skillId);
    if (!skill || actor.energy < skill.energyCost || (actor.cooldowns[skill.id] ?? 0) > 0) continue;
    if (skill.target === "enemy") for (const target of enemies) actions.push({ kind: "skill", actorId, skillId, targetId: target.id });
    else if (skill.target === "ally") for (const target of allies) actions.push({ kind: "skill", actorId, skillId, targetId: target.id });
    else actions.push({ kind: "skill", actorId, skillId });
  }
  return actions;
}

function targetsFor(state: BattleState, actor: BattleUnit, action: BattleAction, skill?: SkillDefinition): BattleUnit[] {
  if (action.targetId) {
    const target = state.units.find(({ id }) => id === action.targetId);
    if (!target || target.hp <= 0) throw new Error("Invalid battle target.");
    return [target];
  }
  if (!skill) throw new Error("A basic attack needs a target.");
  if (skill.target === "all-enemies") return state.units.filter((unit) => unit.side !== actor.side && unit.hp > 0);
  if (skill.target === "all-allies") return state.units.filter((unit) => unit.side === actor.side && unit.hp > 0);
  if (skill.target === "self") return [actor];
  throw new Error("This action needs a target.");
}

export function applyBattleAction(state: BattleState, action: BattleAction, content: BattleContent, rng: RandomSource, day = 0): BattleState {
  const actor = state.units.find(({ id }) => id === action.actorId);
  if (!actor || nextActor(state)?.id !== actor.id) throw new Error("It is not this monster's turn.");
  const skill = action.kind === "skill" ? content.skills.find(({ id }) => id === action.skillId) : undefined;
  if (action.kind === "skill" && !validActions(state, actor.id, content.skills).some((candidate) => candidate.kind === "skill" && candidate.skillId === action.skillId && candidate.targetId === action.targetId)) throw new Error("Skill is not currently usable.");
  const targets = targetsFor(state, actor, action, skill);
  const units = state.units.map((unit) => ({ ...unit, cooldowns: { ...unit.cooldowns }, statuses: [...unit.statuses] }));
  const acting = units.find(({ id }) => id === actor.id)!;
  const events: DomainEvent[] = [];
  const power = skill?.power ?? 28;
  for (const targetSnapshot of targets) {
    const target = units.find(({ id }) => id === targetSnapshot.id)!;
    if (power > 0 && target.side !== acting.side) {
      const multiplier = typeMultiplier(skill?.type ?? acting.species.types[0], target.species.types.filter(Boolean) as GameType[]);
      const damage = calculateDamage(power, { monsterId: acting.id, stats: { hp: acting.maxHp, attack: acting.attack, defense: acting.defense, speed: acting.speed, energy: acting.maxEnergy }, hp: acting.hp, energy: acting.energy, nextActionAt: acting.readyAt, statuses: acting.statuses }, { monsterId: target.id, stats: { hp: target.maxHp, attack: target.attack, defense: target.defense, speed: target.speed, energy: target.maxEnergy }, hp: target.hp, energy: target.energy, nextActionAt: target.readyAt, statuses: target.statuses }, multiplier);
      target.hp = Math.max(0, target.hp - damage);
      events.push({ type: "battle.damage", day, payload: { actorId: acting.id, targetId: target.id, skillId: skill?.id, damage, multiplier, remainingHp: target.hp } });
    }
    if (skill?.statusId && target.hp > 0 && rng.float() < (skill.statusChance ?? 1)) {
      target.statuses = [...new Set([...target.statuses, skill.statusId])];
      events.push({ type: "battle.status-applied", day, payload: { targetId: target.id, statusId: skill.statusId } });
    }
  }
  acting.energy = Math.min(acting.maxEnergy, acting.energy - (skill?.energyCost ?? 0) + (skill ? 5 : 14));
  const reduced = Object.fromEntries(Object.entries(acting.cooldowns).map(([id, value]) => [id, Math.max(0, value - 1)]));
  acting.cooldowns = skill?.cooldown ? { ...reduced, [skill.id]: skill.cooldown } : reduced;
  acting.readyAt += 1000 / Math.max(1, acting.speed);
  const playerAlive = units.some((unit) => unit.side === "player" && unit.hp > 0);
  const enemyAlive = units.some((unit) => unit.side === "enemy" && unit.hp > 0);
  const result: BattleResult = !enemyAlive ? "player-victory" : !playerAlive ? "enemy-victory" : "ongoing";
  if (result !== "ongoing") events.push({ type: "battle.finished", day, payload: { result } });
  const aliveTimes = units.filter(({ hp }) => hp > 0).map(({ readyAt }) => readyAt);
  return { tick: aliveTimes.length ? Math.min(...aliveTimes) : state.tick, round: state.round + 1, units, result, events: [...state.events, ...events] };
}

export function chooseAiAction(state: BattleState, actorId: string, content: BattleContent): BattleAction {
  const actions = validActions(state, actorId, content.skills);
  if (!actions.length) throw new Error("AI has no valid action.");
  const actor = state.units.find(({ id }) => id === actorId)!;
  return actions.map((action) => {
    const skill = action.kind === "skill" ? content.skills.find(({ id }) => id === action.skillId) : undefined;
    const target = action.targetId ? state.units.find(({ id }) => id === action.targetId) : undefined;
    let score = (skill?.power ?? 28) - (skill?.energyCost ?? 0) * 0.12;
    if (target && target.side !== actor.side) {
      score *= typeMultiplier(skill?.type ?? actor.species.types[0], target.species.types.filter(Boolean) as GameType[]);
      if (target.hp / target.maxHp < 0.3) score += 18;
    }
    if (skill?.target === "all-enemies") score += state.units.filter((unit) => unit.side !== actor.side && unit.hp > 0).length * 10;
    if (skill?.statusId) score += 8;
    return { action, score };
  }).sort((a, b) => b.score - a.score)[0]!.action;
}
