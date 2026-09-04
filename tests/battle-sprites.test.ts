import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { content, SPRITE_SPECIES_ALIASES } from "../src/game/training-battle.ts";

test("all 90 sprite identities resolve to v47 and have four correctly sized poses", () => {
  const root = "assets/pixel/battle/monster-exchange-battle-sprites-v1";
  const manifest = JSON.parse(readFileSync(`${root}/sprites.json`, "utf8"));
  const monsters = manifest.lines.flatMap((line: { monsters: { id: string }[] }) => line.monsters);
  assert.equal(monsters.length, 90);
  assert.equal(manifest.sourceFacing, "left");
  const ids = new Set<string>();
  for (const monster of monsters) {
    const id = SPRITE_SPECIES_ALIASES[monster.id] ?? monster.id;
    assert.ok(content.species.some(species => species.id === id), id);
    assert.ok(!ids.has(id), `Duplicate species ${id}`);
    ids.add(id);
    for (const size of [128, 256]) for (const pose of ["idle", "attack", "hit", "defeated"]) {
      const png = readFileSync(`${root}/sprites/${size}/${monster.id}/${pose}.png`);
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      assert.equal(png.readUInt32BE(16), size);
      assert.equal(png.readUInt32BE(20), size);
    }
  }
});
