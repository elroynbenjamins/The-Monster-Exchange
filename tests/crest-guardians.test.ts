import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";
import { bondWithCrestGuardian, crestGuardianBondEligibility } from "../src/content/crest-guardians.ts";
import { createNewGame } from "../src/game/state.ts";
import { SeededRandom } from "../src/core/random.ts";
import { canBreed } from "../src/systems/breeding.ts";
import { listPlayerMonster } from "../src/systems/transactions.ts";
import { createMonster } from "../src/systems/monsters.ts";

test("Aurevine requires reputation and broad research, then bonds only once", () => {
  let state = createNewGame("Keeper", 101, content.contentVersion);
  assert.equal(crestGuardianBondEligibility(state, "aurevine").eligible, false);
  state = {
    ...state,
    player: { ...state.player, reputation: 20, researchBySpecies: { mossveil: { level: 5, points: 0 }, canopyre: { level: 4, points: 0 }, voltgrazer: { level: 3, points: 0 } } },
  };
  state = bondWithCrestGuardian(state, "aurevine", content, new SeededRandom(4));
  const guardian = state.monsters[state.player.monsterIds[0]!]!;
  assert.equal(guardian.speciesId, "aurevine");
  assert.equal(guardian.sex, "neutral");
  assert.equal(guardian.variantId, "crest");
  assert.equal(crestGuardianBondEligibility(state, "aurevine").eligible, false);
  assert.throws(() => listPlayerMonster(state, guardian.id, 99999, 3, new SeededRandom(8)), /cannot be sold/i);
});

test("crest guardians cannot be bred", () => {
  const species = content.species.find(({ id }) => id === "tempestyr")!;
  const monster = createMonster(species, new SeededRandom(2), { day: 1, level: 45 });
  assert.match(canBreed(monster, { ...monster, id: "other" }, species, species).reason ?? "", /cannot be bred/i);
});
