import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { content } from '../src/content/index.ts';
import { NATIVE_BATTLE_ASSET_ROOT as root, NATIVE_SPRITE_ALIASES as aliases, UNASSIGNED_SPRITES } from '../src/content/battle-assets.ts';

test('expanded pack has 176 complete four-pose sets and verified native mappings', () => {
  const manifest = JSON.parse(readFileSync(`${root}/sprites.json`, 'utf8'));
  const monsters: { id: string }[] = manifest.lines.flatMap((line: { monsters: { id: string }[] }) => line.monsters);
  assert.equal(monsters.length, 176);
  const resolved = new Set<string>();
  const unknown: string[] = [];
  for (const monster of monsters) {
    const id = aliases[monster.id] ?? monster.id;
    if (content.species.some(species => species.id === id)) {
      assert.ok(!resolved.has(id), `Duplicate species ${id}`); resolved.add(id);
    } else unknown.push(monster.id);
    for (const size of [128, 256]) for (const pose of ['idle', 'attack', 'hit', 'defeated']) {
      const png = readFileSync(`${root}/sprites/${size}/${monster.id}/${pose}.png`);
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.equal(png.readUInt32BE(16), size);
      assert.equal(png.readUInt32BE(20), size);
      assert.equal(png[25], 6, 'RGBA sprite');
    }
  }
  assert.equal(resolved.size, 176);
  assert.deepEqual(unknown.sort(), [...UNASSIGNED_SPRITES].sort());
});
