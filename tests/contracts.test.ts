import assert from "node:assert/strict";
import test from "node:test";
import { abandonContract, acceptContract, claimContract, completedContractNames, content, createNewGame, expireContracts, recordContractProgress } from "../src/index.ts";

test("contracts are accepted, progressed by matching events, and claimed once", () => {
  let state = createNewGame("Niko", 81, content.contentVersion);
  state = acceptContract(state, "mossveil-census", content);
  state = recordContractProgress(state, { type: "capture-species", targetId: "voltgrazer" }, content);
  assert.equal(state.contracts[0]?.progress, 0);
  state = recordContractProgress(state, { type: "capture-species", targetId: "mossveil", amount: 2 }, content);
  assert.equal(state.contracts[0]?.status, "complete");
  const crowns = state.player.crowns;
  state = claimContract(state, "mossveil-census", content);
  assert.equal(state.player.crowns, crowns + 180);
  assert.equal(state.player.reputation, 2);
  assert.equal(state.contracts[0]?.status, "claimed");
  assert.throws(() => claimContract(state, "mossveil-census", content), /not ready/);
});

test("only three contracts can occupy the active board", () => {
  let state = createNewGame("Niko", 81, content.contentVersion);
  state = acceptContract(state, "mossveil-census", content);
  state = acceptContract(state, "alpha-control", content);
  state = acceptContract(state, "market-liquidity", content);
  assert.throws(() => acceptContract(state, "meadow-survey", content), /three contracts/);
});

test("unfinished contracts expire on their deadline", () => {
  let state = acceptContract(createNewGame("Niko", 81, content.contentVersion), "meadow-survey", content);
  state = { ...state, world: { ...state.world, day: state.contracts[0]!.expiresOnDay } };
  state = expireContracts(state);
  assert.equal(state.contracts[0]?.status, "expired");
});

test("claimed and expired contracts can be accepted again", () => {
  let state = acceptContract(createNewGame("Niko", 81, content.contentVersion), "alpha-control", content);
  const before = state;
  state = recordContractProgress(state, { type: "defeat-boss" }, content);
  assert.deepEqual(completedContractNames(before, state, content), ["Alpha Control"]);
  state = claimContract(state, "alpha-control", content);
  state = acceptContract(state, "alpha-control", content);
  assert.equal(state.contracts.find(({ definitionId }) => definitionId === "alpha-control")?.status, "active");
  state = abandonContract(state, "alpha-control");
  assert.equal(state.contracts.find(({ definitionId }) => definitionId === "alpha-control")?.status, "expired");
  state = acceptContract(state, "alpha-control", content);
  assert.equal(state.contracts.find(({ definitionId }) => definitionId === "alpha-control")?.progress, 0);
});
