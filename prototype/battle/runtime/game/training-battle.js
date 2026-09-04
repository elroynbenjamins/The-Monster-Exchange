import { content } from "../content/index.js";
import { SeededRandom } from "../core/random.js";
import { createMonster } from "../systems/monsters.js";
import { applyBattleAction, chooseAiAction, createBattle, nextActor, validActions,                                     } from "../systems/battle-engine.js";

export { content };
export const SPRITE_SPECIES_ALIASES                                   = { bogcrumbler: "bogrumbler", knubback: "knobback" };
                                                                                                
// Bump the engine revision when combat rules change; content edits invalidate automatically.
const RULES = `training-1:${JSON.stringify(content).split("").reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261)}`;
const MAX_ACTIONS = 2000;
                                                                                                                              

/** Offline exhibition: uses production combat, but never grants campaign rewards. */
export class TrainingBattle {
  state             ;
          rng              ;
          history                 = [];
          setup                                                     ;
  constructor(playerId        , enemyId        , seed = 42) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error("Invalid battle seed");
    this.setup = { playerId, enemyId, seed };
    this.rng = new SeededRandom(seed);
    const make = (id        ) => {
      const species = content.species.find(species => species.id === id);
      if (!species) throw new Error(`Unknown species: ${id}`);
      return createMonster(species, this.rng, { day: 1, level: 18 });
    };
    this.state = createBattle([make(playerId)], [make(enemyId)], content);
  }
  get actions()                          {
    const actor = nextActor(this.state);
    return actor?.side === "player" ? validActions(this.state, actor.id, content) : [];
  }
  label(action              )         {
    if (action.kind === "basic") return "Basic attack";
    if (action.kind === "wait") return "Recover turn";
    return action.kind === "skill" ? content.skills.find(skill => skill.id === action.skillId) .name : "Switch";
  }
  step(action              )                {
    if (this.state.result !== "ongoing") throw new Error("Battle already finished");
    if (this.history.length >= MAX_ACTIONS) throw new Error("Training turn limit reached");
    const before = this.state;
    this.state = applyBattleAction(before, action, content, this.rng, 1);
    this.history.push({ ...action });
    return { action, before, after: this.state };
  }
  save()         {
    const save               = { version: 1, rules: RULES, ...this.setup, actions: this.history };
    return JSON.stringify(save);
  }
  static restore(serialized        )                 {
    if (serialized.length > 500000) throw new Error("Battle save is too large");
    const save = JSON.parse(serialized);
    if (!save || save.version !== 1 || save.rules !== RULES) throw new Error("Battle save is incompatible with this version");
    if (typeof save.playerId !== "string" || typeof save.enemyId !== "string" || !Number.isInteger(save.seed) || !Array.isArray(save.actions) || save.actions.length > MAX_ACTIONS) throw new Error("Malformed battle save");
    const session = new TrainingBattle(save.playerId, save.enemyId, save.seed);
    for (const action of save.actions) {
      const actor = nextActor(session.state);
      const legal = actor && validActions(session.state, actor.id, content).find(candidate =>
        action && Object.keys(action).length === Object.keys(candidate).length &&
        Object.entries(candidate).every(([key, value]) => action[key] === value));
      if (!legal) throw new Error("Battle save contains an invalid turn");
      session.step(legal);
    }
    return session;
  }
  advanceEnemy()                  {
    const frames                  = [];
    // Bounded catch-up; caller may invoke again if the enemy is still next.
    for (let count = 0; count < 100 && this.state.result === "ongoing"; count++) {
      const actor = nextActor(this.state) ;
      if (actor.side === "player") break;
      frames.push(this.step(chooseAiAction(this.state, actor.id, content)));
    }
    return frames;
  }
}
