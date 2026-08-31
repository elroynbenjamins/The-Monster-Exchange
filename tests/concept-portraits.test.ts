import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../src/content/index.ts";

test("former portrait concept subjects remain valid catalog monsters while art is replaced", () => {
  for (const id of ["pyroclastor", "brineveil", "borealume"]) {
    assert.ok(content.species.some((species) => species.id === id));
  }
});
