import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEM_VISUALS,itemName} from '../src/ui/item-visuals.ts';
import {content} from '../src/content/index.ts';
import {createNewGame} from '../src/game/state.ts';
test('all starting supplies, equipment and crafting ingredients have item visuals',()=>{
 const state=createNewGame('Icons',1,47);
 const ids=new Set([...Object.keys(state.player.inventory),...Object.keys(state.homebase.resources),'crowns','research-notes',...content.equipment.map(e=>e.id),...content.recipes.flatMap(r=>[...Object.keys(r.inputs),...Object.keys(r.outputs)])]);
 for(const id of ids){assert.ok(ITEM_VISUALS[id],id);assert.ok(itemName(id).length);}
 assert.equal(new Set(Object.values(ITEM_VISUALS).map(i=>i.cell)).size,Object.keys(ITEM_VISUALS).length);
});
test('item atlas is a square PNG and all tile windows remain within its bounds',()=>{
 const png=readFileSync('assets/pixel/homebase/item-atlas-v1.png');
 assert.equal(png.toString('ascii',1,4),'PNG');
 assert.equal(png.readUInt32BE(16),png.readUInt32BE(20));
 for(const item of Object.values(ITEM_VISUALS))assert.ok(Number.isInteger(item.cell)&&item.cell>=0&&item.cell<16);
 assert.equal(itemName('future-material'),'future material');
});
