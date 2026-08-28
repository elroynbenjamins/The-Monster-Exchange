import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { content } from "../src/content/index.ts";

test("the three portrait style concepts reference real catalog monsters", () => {
  for (const id of ["pyroclastor", "brineveil", "borealume"]) {
    assert.ok(content.species.some((species) => species.id === id));
    assert.equal(existsSync(`assets/pixel/monsters/concept-portraits/${id}--concept-portrait.png`), true);
  }
});
