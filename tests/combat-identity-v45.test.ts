import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";

test("v45 finalized combat identities use the approved roles and unchanged stat budgets", () => {
  const expected = {
    tusslegrub: ["striker", 34, 81, 35, 63, 47, 260],
    somnaloak: ["support", 72, 47, 58, 56, 87, 320],
    umbraasp: ["speedster", 56, 78, 49, 84, 57, 324],
    nightwake: ["striker", 63, 71, 54, 68, 53, 309],
  } as const;
  for (const [id, [role, hp, attack, defense, speed, energy, budget]] of Object.entries(expected)) {
    const species = content.species.find((candidate) => candidate.id === id)!;
    assert.equal(species.battleRole, role);
    assert.deepEqual(species.baseStats, { hp, attack, defense, speed, energy });
    assert.equal(hp + attack + defense + speed + energy, budget);
  }
});
