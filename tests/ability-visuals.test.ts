import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {content} from '../src/content/index.ts';
import {ABILITY_CELLS,abilityCell} from '../src/ui/ability-visuals.ts';
test('all runtime skills and statuses have distinct explicit icon assignments',()=>{
 const ids=[...content.skills,...content.statuses].map(x=>x.id);
 assert.equal(ids.length,53);assert.equal(new Set(ids.map(id=>ABILITY_CELLS[id])).size,53);
 for(const id of ids)assert.ok(Number.isInteger(ABILITY_CELLS[id]));
 assert.ok(existsSync('assets/pixel/abilities/ability-atlas-v1.png'));
 assert.equal(abilityCell('unknown-passive'),53);
});
