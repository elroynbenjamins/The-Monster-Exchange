import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chapters, INTRO_KEY, readProgress, writeProgress } from "../prototype/welcome/story.js";

test("story art exists and introduction ends in the starting city", () => {
  assert.equal(chapters.length, 4);
  for (const chapter of chapters) assert.ok(existsSync(`.${chapter.image}`));
  assert.match(chapters.at(-1)!.note, /Willowmere/);
});
test("intro remembers progress and completion in its own save slot", () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.equal(readProgress(storage).chapter, 0);
  assert.equal(writeProgress(storage, 2), true);
  assert.equal(readProgress(storage).chapter, 2);
  writeProgress(storage, 3, true);
  assert.equal(readProgress(storage).completed, true);
  assert.deepEqual([...data.keys()], [INTRO_KEY]);
});
test("invalid or unavailable intro saves do not block the story", () => {
  for (const value of ["{", "null", '{"version":1,"chapter":99,"completed":false}', '{"version":2,"chapter":1,"completed":false}']) {
    assert.equal(readProgress({ getItem: () => value }).chapter, 0);
  }
  assert.equal(readProgress(undefined).chapter, 0);
  assert.equal(writeProgress(undefined, 1), false);
});
