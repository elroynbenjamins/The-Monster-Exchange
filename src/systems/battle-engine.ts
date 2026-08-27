import type { DomainEvent, GameType, MonsterIndividual, SpeciesDefinition } from "../core/types.ts";
import type { RandomSource } from "../core/random.ts";
import type { EquipmentDefinition, PassiveDefinition, SkillDefinition, StatusDefinition, SynergyDefinition, TraitDefinition } from "../content/definitions.ts";
import { calculateDamage, createCombatant, typeMultiplier } from "./combat.ts";
import { evaluateTeamSynergies, passiveForMonster } from "./team-effects.ts";

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
  baseMaxHp: number;
  baseMaxEnergy: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  speed: number;
  attack: number;
  defense: number;
  readyAt: number;
  cooldowns: Readonly<Record<string, number>>;
  active: boolean;
  shield: number;
  statuses: readonly ActiveStatus[];
}

export interface ActiveStatus { id: string; remainingActions: number; stacks: number }

export interface BattleState {
  tick: number;
  round: number;
  units: readonly BattleUnit[];
  result: BattleResult;
  events: readonly DomainEvent[];
  activeSynergies: Readonly<Record<BattleSide, readonly string[]>>;
}

export type BattleAction =
  | { kind: "basic"; actorId: string; targetId: string }
  | { kind: "skill"; actorId: string; skillId: string; targetId?: string }
  | { kind: "switch"; actorId: string; targetId: string }
  | { kind: "wait"; actorId: string };

export interface BattleContent {
  species: readonly SpeciesDefinition[];
  traits: readonly TraitDefinition[];
  skills: readonly SkillDefinition[];
  statuses: readonly StatusDefinition[];
  passives: readonly PassiveDefinition[];
  synergies: readonly SynergyDefinition[];
  equipment: readonly EquipmentDefinition[];
}

function refreshTeamStats(units: BattleUnit[], content: BattleContent): Readonly<Record<BattleSide, readonly string[]>> {
  const activeSynergies = {} as Record<BattleSide, readonly string[]>;
  for (const side of ["player", "enemy"] as const) {
    const sideUnits = units.filter((unit) => unit.side === side);
    const activeMonsters = sideUnits.filter(({ active, hp }) => active && hp > 0).map(({ monster }) => monster);
    const effects = evaluateTeamSynergies(activeMonsters, content.species, content.synergies);
    activeSynergies[side] = effects.synergyIds;
    for (const unit of sideUnits) {
      const passive = passiveForMonster(unit.monster, content.species, content.passives);
      const synergy = unit.active && unit.hp > 0 ? effects.statModifiers : {};
      const oldMaxHp = unit.maxHp || unit.baseMaxHp;
      const hpRatio = oldMaxHp > 0 ? unit.hp / oldMaxHp : 1;
      unit.maxHp = Math.max(1, Math.round(unit.baseMaxHp * (1 + (passive.statModifiers?.hp ?? 0) + (synergy.hp ?? 0))));
      unit.maxEnergy = Math.max(1, Math.round(unit.baseMaxEnergy * (1 + (passive.statModifiers?.energy ?? 0) + (synergy.energy ?? 0))));
      unit.attack = Math.max(1, Math.round(unit.baseAttack * (1 + (passive.statModifiers?.attack ?? 0) + (synergy.attack ?? 0))));
      unit.defense = Math.max(1, Math.round(unit.baseDefense * (1 + (passive.statModifiers?.defense ?? 0) + (synergy.defense ?? 0))));
      unit.speed = Math.max(1, Math.round(unit.baseSpeed * (1 + (passive.statModifiers?.speed ?? 0) + (synergy.speed ?? 0))));
      unit.hp = Math.min(unit.maxHp, Math.max(unit.hp > 0 ? 1 : 0, Math.round(unit.maxHp * hpRatio)));
      unit.energy = Math.min(unit.maxEnergy, unit.energy);
    }
  }
  return activeSynergies;
}

export function createBattle(
  playerMonsters: readonly MonsterIndividual[],
  enemyMonsters: readonly MonsterIndividual[],
  content: BattleContent,
  initialHpRatios: Readonly<Record<string, number>> = {},
): BattleState {
  if (!playerMonsters.length || !enemyMonsters.length) throw new Error("A battle requires monsters on both sides.");
  const makeUnits = (monsters: readonly MonsterIndividual[], side: BattleSide): BattleUnit[] => monsters.slice(0, 5).map((monster, index) => {
    const species = content.species.find(({ id }) => id === monster.speciesId);
    if (!species) throw new Error(`Unknown species ${monster.speciesId}.`);
    const combatant = createCombatant(monster, species, content.traits, content.equipment);
    const ratio = Math.max(0.01, Math.min(1, initialHpRatios[monster.id] ?? 1));
    return {
      id: monster.id, side, monster, species, hp: Math.max(1, Math.round(combatant.stats.hp * ratio)), maxHp: combatant.stats.hp,
      energy: combatant.stats.energy, maxEnergy: combatant.stats.energy, baseMaxHp: combatant.stats.hp, baseMaxEnergy: combatant.stats.energy,
      baseAttack: combatant.stats.attack, baseDefense: combatant.stats.defense, baseSpeed: combatant.stats.speed, speed: combatant.stats.speed,
      attack: combatant.stats.attack, defense: combatant.stats.defense, readyAt: combatant.nextActionAt,
      cooldowns: {}, active: index < 3, shield: 0, statuses: [],
    };
  });
  const units = [...makeUnits(playerMonsters, "player"), ...makeUnits(enemyMonsters, "enemy")];
  const activeSynergies = refreshTeamStats(units, content);
  for (const side of ["player", "enemy"] as const) {
    const active = units.filter((unit) => unit.side === side && unit.active);
    const teamEffects = evaluateTeamSynergies(active.map(({ monster }) => monster), content.species, content.synergies);
    const passiveShield = active.reduce((sum, unit) => sum + (passiveForMonster(unit.monster, content.species, content.passives).teamShieldPercent ?? 0), 0);
    const shieldPercent = Math.min(0.25, teamEffects.teamShieldPercent + passiveShield);
    for (const unit of active) unit.shield = Math.round(unit.maxHp * shieldPercent);
  }
  const synergyEvents: DomainEvent[] = Object.entries(activeSynergies).flatMap(([side, ids]) => ids.map((synergyId) => ({ type: "battle.synergy-activated", day: 0, payload: { side, synergyId } })));
  const passiveEvents: DomainEvent[] = units.filter(({ active }) => active).map((unit) => ({ type: "battle.passive-activated", day: 0, payload: { side: unit.side, monsterId: unit.id, passiveId: unit.species.passiveId } }));
  const events = [...synergyEvents, ...passiveEvents];
  return { tick: 0, round: 0, units, result: "ongoing", events, activeSynergies };
}

export function nextActor(state: BattleState): BattleUnit | undefined {
  return state.units.filter(({ hp, active }) => hp > 0 && active).sort((a, b) => a.readyAt - b.readyAt || b.speed - a.speed)[0];
}

export function validActions(state: BattleState, actorId: string, content: Pick<BattleContent, "skills" | "statuses">): readonly BattleAction[] {
  const actor = state.units.find(({ id }) => id === actorId);
  if (!actor || actor.hp <= 0 || state.result !== "ongoing") return [];
  if (actor.statuses.some((status) => content.statuses.find(({ id }) => id === status.id)?.preventsAction)) return [{ kind: "wait", actorId }];
  const enemies = state.units.filter((unit) => unit.side !== actor.side && unit.hp > 0 && unit.active);
  const allies = state.units.filter((unit) => unit.side === actor.side && unit.hp > 0 && unit.active);
  const reserves = state.units.filter((unit) => unit.side === actor.side && unit.hp > 0 && !unit.active);
  const actions: BattleAction[] = enemies.map((target) => ({ kind: "basic", actorId, targetId: target.id }));
  for (const reserve of reserves) actions.push({ kind: "switch", actorId, targetId: reserve.id });
  for (const skillId of actor.monster.equippedSkillIds) {
    const skill = content.skills.find(({ id }) => id === skillId);
    if (!skill || actor.energy < skill.energyCost || (actor.cooldowns[skill.id] ?? 0) > 0) continue;
    if (skill.target === "enemy") for (const target of enemies) actions.push({ kind: "skill", actorId, skillId, targetId: target.id });
    else if (skill.target === "ally") for (const target of allies) actions.push({ kind: "skill", actorId, skillId, targetId: target.id });
    else actions.push({ kind: "skill", actorId, skillId });
  }
  return actions;
}

function targetsFor(state: BattleState, actor: BattleUnit, action: BattleAction, skill?: SkillDefinition): BattleUnit[] {
  if (action.kind === "switch" || action.kind === "wait") return [];
  if (action.targetId) {
    const target = state.units.find(({ id }) => id === action.targetId);
    if (!target || target.hp <= 0) throw new Error("Invalid battle target.");
    return [target];
  }
  if (!skill) throw new Error("A basic attack needs a target.");
  if (skill.target === "all-enemies") return state.units.filter((unit) => unit.side !== actor.side && unit.hp > 0 && unit.active);
  if (skill.target === "all-allies") return state.units.filter((unit) => unit.side === actor.side && unit.hp > 0 && unit.active);
  if (skill.target === "self") return [actor];
  throw new Error("This action needs a target.");
}

export function applyBattleAction(state: BattleState, action: BattleAction, content: BattleContent, rng: RandomSource, day = 0): BattleState {
  const actor = state.units.find(({ id }) => id === action.actorId);
  if (!actor || nextActor(state)?.id !== actor.id) throw new Error("It is not this monster's turn.");
  const skill = action.kind === "skill" ? content.skills.find(({ id }) => id === action.skillId) : undefined;
  const isValid = validActions(state, actor.id, content).some((candidate) => {
    if (candidate.kind !== action.kind) return false;
    if (candidate.kind === "skill" && action.kind === "skill") return candidate.skillId === action.skillId && candidate.targetId === action.targetId;
    if (candidate.kind === "basic" && action.kind === "basic") return candidate.targetId === action.targetId;
    if (candidate.kind === "switch" && action.kind === "switch") return candidate.targetId === action.targetId;
    return candidate.kind === "wait" && action.kind === "wait";
  });
  if (!isValid) throw new Error("Action is not currently usable.");
  const targets = targetsFor(state, actor, action, skill);
  const units = state.units.map((unit) => ({ ...unit, cooldowns: { ...unit.cooldowns }, statuses: unit.statuses.map((status) => ({ ...status })) }));
  const acting = units.find(({ id }) => id === actor.id)!;
  const events: DomainEvent[] = [];
  if (action.kind === "switch") {
    const reserve = units.find(({ id }) => id === action.targetId)!;
    acting.active = false;
    reserve.active = true;
    reserve.readyAt = acting.readyAt;
    events.push({ type: "battle.switched", day, payload: { outId: acting.id, inId: reserve.id } });
  }
  const power = skill?.power ?? 28;
  for (const targetSnapshot of targets) {
    const target = units.find(({ id }) => id === targetSnapshot.id)!;
    if (power > 0 && target.side !== acting.side) {
      const attackType = skill?.type ?? acting.species.types[0];
      let multiplier = typeMultiplier(attackType, target.species.types.filter(Boolean) as GameType[]);
      const wet = target.statuses.some(({ id }) => id === "wet");
      const burning = target.statuses.some(({ id }) => id === "burn");
      const poison = target.statuses.find(({ id }) => id === "poison");
      if (wet && attackType === "electric") { multiplier *= 1.15; events.push({ type: "battle.combo-triggered", day, payload: { comboId: "wet-electric", targetId: target.id } }); }
      if (burning && attackType === "fire") { multiplier *= 1.1; events.push({ type: "battle.combo-triggered", day, payload: { comboId: "burn-fire", targetId: target.id } }); }
      if (poison && attackType === "bug") {
        multiplier *= 1.15;
        target.statuses = poison.stacks > 1 ? target.statuses.map((active) => active.id === "poison" ? { ...active, stacks: active.stacks - 1 } : active) : target.statuses.filter(({ id }) => id !== "poison");
        events.push({ type: "battle.combo-triggered", day, payload: { comboId: "poison-bug", targetId: target.id } });
      }
      const attackModifier = acting.statuses.reduce((value, status) => value + (content.statuses.find(({ id }) => id === status.id)?.attackModifier ?? 0) * status.stacks, 1);
      const damage = calculateDamage(power, { monsterId: acting.id, stats: { hp: acting.maxHp, attack: Math.max(1, acting.attack * attackModifier), defense: acting.defense, speed: acting.speed, energy: acting.maxEnergy }, hp: acting.hp, energy: acting.energy, nextActionAt: acting.readyAt, statuses: [] }, { monsterId: target.id, stats: { hp: target.maxHp, attack: target.attack, defense: target.defense, speed: target.speed, energy: target.maxEnergy }, hp: target.hp, energy: target.energy, nextActionAt: target.readyAt, statuses: [] }, multiplier);
      const absorbed = Math.min(target.shield, damage);
      target.shield -= absorbed;
      const hpDamage = damage - absorbed;
      target.hp = Math.max(0, target.hp - hpDamage);
      if (hpDamage > 0) target.statuses = target.statuses.filter((active) => !content.statuses.find(({ id }) => id === active.id)?.breaksOnDamage);
      events.push({ type: "battle.damage", day, payload: { actorId: acting.id, targetId: target.id, skillId: skill?.id, damage: hpDamage, absorbed, multiplier, remainingHp: target.hp } });
    }
    if (skill?.healingPower && target.side === acting.side) {
      const healed = Math.min(target.maxHp - target.hp, Math.round(skill.healingPower * acting.attack / 50));
      target.hp += healed;
      events.push({ type: "battle.healed", day, payload: { actorId: acting.id, targetId: target.id, healed } });
    }
    if (skill?.shieldPower && target.side === acting.side) {
      const shield = Math.round(skill.shieldPower * acting.attack / 50);
      target.shield = Math.min(Math.round(target.maxHp * 0.5), target.shield + shield);
      events.push({ type: "battle.shielded", day, payload: { actorId: acting.id, targetId: target.id, shield } });
    }
    if (skill?.cleanseCount && target.side === acting.side) target.statuses = target.statuses.slice(skill.cleanseCount);
    const comboStatusBonus = skill?.statusId === "shock" && target.statuses.some(({ id }) => id === "wet") ? 0.25 : 0;
    if (skill?.statusId && target.hp > 0 && rng.float() < Math.min(1, (skill.statusChance ?? 1) + comboStatusBonus)) {
      const definition = content.statuses.find(({ id }) => id === skill.statusId);
      if (!definition) throw new Error(`Unknown status ${skill.statusId}.`);
      const existing = target.statuses.find(({ id }) => id === skill.statusId);
      target.statuses = existing
        ? target.statuses.map((active) => active.id === skill.statusId ? { ...active, remainingActions: definition.duration, stacks: Math.min(definition.maxStacks, active.stacks + 1) } : active)
        : [...target.statuses, { id: skill.statusId, remainingActions: definition.duration, stacks: 1 }];
      events.push({ type: "battle.status-applied", day, payload: { targetId: target.id, statusId: skill.statusId } });
    }
  }
  acting.energy = Math.min(acting.maxEnergy, acting.energy - (skill?.energyCost ?? 0) + (skill ? 5 : 14));
  const reduced = Object.fromEntries(Object.entries(acting.cooldowns).map(([id, value]) => [id, Math.max(0, value - 1)]));
  acting.cooldowns = skill?.cooldown ? { ...reduced, [skill.id]: skill.cooldown } : reduced;
  const speedModifier = acting.statuses.reduce((value, status) => value + (content.statuses.find(({ id }) => id === status.id)?.speedModifier ?? 0) * status.stacks, 1);
  acting.readyAt += 1000 / Math.max(1, acting.speed * Math.max(0.25, speedModifier));
  const afterActionStatuses: ActiveStatus[] = [];
  for (const active of acting.statuses) {
    const definition = content.statuses.find(({ id }) => id === active.id)!;
    if (definition.tick === "after-action" && definition.damagePercentMaxHp) {
      const damage = Math.max(1, Math.round(acting.maxHp * definition.damagePercentMaxHp * active.stacks));
      acting.hp = Math.max(0, acting.hp - damage);
      events.push({ type: "battle.status-damage", day, payload: { targetId: acting.id, statusId: active.id, damage } });
    }
    if (active.remainingActions - 1 > 0) afterActionStatuses.push({ ...active, remainingActions: active.remainingActions - 1 });
    else events.push({ type: "battle.status-expired", day, payload: { targetId: acting.id, statusId: active.id } });
  }
  acting.statuses = afterActionStatuses;
  for (const side of ["player", "enemy"] as const) {
    let activeLiving = units.filter((unit) => unit.side === side && unit.active && unit.hp > 0).length;
    for (const reserve of units.filter((unit) => unit.side === side && !unit.active && unit.hp > 0)) {
      if (activeLiving >= 3) break;
      reserve.active = true;
      reserve.readyAt = Math.max(reserve.readyAt, acting.readyAt);
      activeLiving++;
      events.push({ type: "battle.reserve-entered", day, payload: { monsterId: reserve.id } });
    }
  }
  const activeSynergies = refreshTeamStats(units, content);
  const playerAlive = units.some((unit) => unit.side === "player" && unit.hp > 0);
  const enemyAlive = units.some((unit) => unit.side === "enemy" && unit.hp > 0);
  const result: BattleResult = !enemyAlive ? "player-victory" : !playerAlive ? "enemy-victory" : "ongoing";
  if (result !== "ongoing") events.push({ type: "battle.finished", day, payload: { result } });
  const aliveTimes = units.filter(({ hp }) => hp > 0).map(({ readyAt }) => readyAt);
  return { tick: aliveTimes.length ? Math.min(...aliveTimes) : state.tick, round: state.round + 1, units, result, events: [...state.events, ...events], activeSynergies };
}

export function chooseAiAction(state: BattleState, actorId: string, content: BattleContent): BattleAction {
  const actions = validActions(state, actorId, content);
  if (!actions.length) throw new Error("AI has no valid action.");
  const actor = state.units.find(({ id }) => id === actorId)!;
  return actions.map((action) => {
    if (action.kind === "wait") return { action, score: 1000 };
    if (action.kind === "switch") {
      const reserve = state.units.find(({ id }) => id === action.targetId)!;
      return { action, score: actor.hp / actor.maxHp < 0.2 ? 35 + reserve.hp / reserve.maxHp * 10 : -20 };
    }
    const skill = action.kind === "skill" ? content.skills.find(({ id }) => id === action.skillId) : undefined;
    const target = action.targetId ? state.units.find(({ id }) => id === action.targetId) : undefined;
    let score = (skill?.power ?? 28) - (skill?.energyCost ?? 0) * 0.12;
    if (target && target.side !== actor.side) {
      score *= typeMultiplier(skill?.type ?? actor.species.types[0], target.species.types.filter(Boolean) as GameType[]);
      if (target.hp / target.maxHp < 0.3) score += 18;
    }
    if (skill?.target === "all-enemies") score += state.units.filter((unit) => unit.side !== actor.side && unit.hp > 0).length * 10;
    if (skill?.statusId) score += 8;
    if (skill?.healingPower && actor.hp / actor.maxHp < 0.5) score += 40;
    return { action, score };
  }).sort((a, b) => b.score - a.score)[0]!.action;
}
