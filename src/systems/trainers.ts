import type { GameContent } from "../content/definitions.ts";
import type { RandomSource } from "../core/random.ts";
import type { GameState } from "../game/state.ts";
import { createMonster } from "./monsters.ts";
import { applyBattleAction, chooseAiAction, createBattle, nextActor } from "./battle-engine.ts";
import { grantMonsterXp, settleBattleProgression } from "../game/commands.ts";

export function initializeTrainers(state: GameState, content: GameContent, rng: RandomSource): GameState {
  let monsters = { ...state.monsters };
  const trainers = { ...state.trainers };
  for (const definition of content.trainers) {
    if (trainers[definition.id]) continue;
    const monsterIds = definition.teamSpeciesIds.map((speciesId, index) => {
      const species = content.species.find(({ id }) => id === speciesId)!;
      const monster = createMonster(species, rng, { day: state.world.day, level: definition.startingLevel + index, ownerId: definition.id, qualityBias: definition.role === "rival" ? 0.12 : 0.06 });
      monsters[monster.id] = monster;
      return monster.id;
    });
    trainers[definition.id] = { definitionId: definition.id, monsterIds, relationship: 0, wins: 0, losses: 0 };
  }
  return { ...state, monsters, trainers };
}

export function progressTrainers(state: GameState, content: GameContent): GameState {
  let next = state;
  for (const trainer of Object.values(state.trainers)) {
    const definition = content.trainers.find(({ id }) => id === trainer.definitionId);
    if (!definition) continue;
    for (const monsterId of trainer.monsterIds) next = grantMonsterXp(next, monsterId, definition.trainingXpPerDay, content).state;
  }
  return next;
}

export interface TrainerChallengeResult { state: GameState; playerWon: boolean; rewardCrowns: number; turns: number }

export function trainerRelationshipTier(relationship: number): "new" | "familiar" | "trusted" | "close" {
  return relationship >= 20 ? "close" : relationship >= 10 ? "trusted" : relationship >= 4 ? "familiar" : "new";
}

export function estimateTrainerDifficulty(state: GameState, trainerId: string): "easy" | "even" | "hard" | "severe" {
  const trainer = state.trainers[trainerId];
  if (!trainer) throw new Error("Unknown trainer.");
  const playerLevels = state.player.activeTeamIds.map((id) => state.monsters[id]?.level ?? 0);
  const trainerLevels = trainer.monsterIds.map((id) => state.monsters[id]?.level ?? 0);
  const playerPower = playerLevels.reduce((sum, level) => sum + level, 0) / Math.max(1, playerLevels.length);
  const trainerPower = trainerLevels.reduce((sum, level) => sum + level, 0) / Math.max(1, trainerLevels.length);
  const difference = trainerPower - playerPower;
  return difference >= 6 ? "severe" : difference >= 2 ? "hard" : difference > -3 ? "even" : "easy";
}

export function challengeTrainer(state: GameState, trainerId: string, content: GameContent, rng: RandomSource): TrainerChallengeResult {
  if (state.activeExpedition) throw new Error("Trainer challenges are unavailable during an expedition.");
  const trainer = state.trainers[trainerId];
  const definition = content.trainers.find(({ id }) => id === trainerId);
  if (!trainer || !definition) throw new Error("Unknown trainer.");
  if (trainer.lastChallengeDay === state.world.day) throw new Error("This trainer has already battled you today.");
  const playerMonsters = state.player.activeTeamIds.map((id) => state.monsters[id]!).filter(Boolean);
  if (!playerMonsters.length) throw new Error("Choose an active team before challenging a trainer.");
  const enemyMonsters = trainer.monsterIds.map((id) => state.monsters[id]!).filter(Boolean);
  let battle = createBattle(playerMonsters, enemyMonsters, content, Object.fromEntries(playerMonsters.map((monster) => [monster.id, state.conditions[monster.id]?.hpRatio ?? 1])));
  let turns = 0;
  while (battle.result === "ongoing" && turns < 500) {
    const actor = nextActor(battle)!;
    battle = applyBattleAction(battle, chooseAiAction(battle, actor.id, content), content, rng, state.world.day);
    turns++;
  }
  if (battle.result === "ongoing") throw new Error("Trainer battle exceeded the turn limit.");
  const conditions = { ...state.conditions };
  for (const unit of battle.units.filter(({ side }) => side === "player")) {
    const current = conditions[unit.id] ?? { hpRatio: 1, stamina: 100 };
    conditions[unit.id] = { ...current, hpRatio: unit.hp / unit.maxHp };
  }
  const playerWon = battle.result === "player-victory";
  let next = settleBattleProgression({ ...state, conditions }, battle, content).state;
  const rewardCrowns = playerWon ? definition.challengeRewardCrowns : 0;
  next = {
    ...next,
    player: { ...next.player, crowns: next.player.crowns + rewardCrowns },
    trainers: {
      ...next.trainers,
      [trainerId]: {
        ...trainer,
        relationship: trainer.relationship + (playerWon ? 2 : 1),
        wins: trainer.wins + (playerWon ? 0 : 1),
        losses: trainer.losses + (playerWon ? 1 : 0),
        lastChallengeDay: state.world.day,
      },
    },
  };
  return { state: next, playerWon, rewardCrowns, turns };
}
