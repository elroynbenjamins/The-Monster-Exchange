import test from "node:test";
import assert from "node:assert/strict";
import { TrainingBattle } from "../src/game/training-battle.ts";

test("training uses deterministic production combat and reaches a result", () => {
  const play = () => {
    const session = new TrainingBattle("sprigbara", "cindlet");
    for (let i = 0; i < 300 && session.state.result === "ongoing"; i++) {
      session.advanceEnemy();
      if (session.actions.length) session.step(session.actions[0]);
    }
    return session.state;
  };
  const state = play();
  assert.notEqual(state.result, "ongoing");
  assert.deepEqual(state, play());
  assert.ok(state.events.some(event => event.type === "battle.damage"));
});

test("training rejects unknown species and illegal player actions", () => {
  assert.throws(() => new TrainingBattle("invalid", "cindlet"), /Unknown species/);
  const session = new TrainingBattle("sprigbara", "cindlet");
  const before = session.state;
  assert.throws(() => session.step({ kind: "basic", actorId: "fake", targetId: "fake" }));
  assert.equal(session.state, before);
});

test("same-species opponents have distinct individual identities", () => {
  const session = new TrainingBattle("cindlet", "cindlet");
  assert.notEqual(session.state.units[0].id, session.state.units[1].id);
});

test("save resumes exact state and random sequence including a pending enemy turn", () => {
  const session = new TrainingBattle("sprigbara", "cindlet", 728);
  session.advanceEnemy();
  session.step(session.actions[0]);
  const resumed = TrainingBattle.restore(session.save());
  assert.deepEqual(resumed.state, session.state);
  assert.deepEqual(resumed.advanceEnemy(), session.advanceEnemy());
  assert.deepEqual(resumed.state, session.state);
  assert.equal(resumed.save(), session.save());
  assert.deepEqual(TrainingBattle.restore(resumed.save()).advanceEnemy(), []);
});

test("completed saves remain completed and reject extra turns", () => {
  const session = new TrainingBattle("sprigbara", "cindlet");
  while (session.state.result === "ongoing") {
    session.advanceEnemy();
    if (session.actions.length) session.step(session.actions[0]);
  }
  const resumed = TrainingBattle.restore(session.save());
  assert.deepEqual(resumed.state, session.state);
  assert.deepEqual(resumed.actions, []);
  assert.deepEqual(resumed.advanceEnemy(), []);
  assert.throws(() => resumed.step({ kind: "wait", actorId: "fake" }), /finished/);
});

test("malformed, incompatible and illegal saves are rejected", () => {
  const good = JSON.parse(new TrainingBattle("sprigbara", "cindlet").save());
  for (const bad of [null, {}, { ...good, version: 2 }, { ...good, rules: "old" },
    { ...good, seed: -1 }, { ...good, seed: null }, { ...good, playerId: "missing" },
    { ...good, actions: Array(2001).fill(null) }, { ...good, actions: [null] },
    { ...good, actions: [{ kind: "basic", actorId: "fake", targetId: "fake" }] }]) {
    assert.throws(() => TrainingBattle.restore(JSON.stringify(bad)));
  }
  assert.throws(() => TrainingBattle.restore("{"));
  assert.throws(() => TrainingBattle.restore(" ".repeat(500001)), /too large/);
});
