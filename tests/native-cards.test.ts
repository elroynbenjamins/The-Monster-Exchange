import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { content } from '../src/content/index.ts';
import { cardLayout } from '../src/ui/card-layout.ts';
import { createMobileCampaign } from '../src/game/mobile-campaign.ts';
import { buildMonsterdexEntries, filterMonsterdex, monsterdexProgress } from '../src/systems/monsterdex.ts';
interface Frame { speciesId: string; internalId: number; source: string; sheetSize: [number,number]; bounds: [number,number,number,number] }
const frames: Frame[] = JSON.parse(readFileSync('assets/pixel/monsterdex/native-card-frames.json', 'utf8')).records;

test('all 244 native cards resolve by species identity, independently of Dex ordering', () => {
  assert.equal(frames.length, 244);
  assert.equal(new Set(frames.map(frame => frame.speciesId)).size, 244);
  for (const species of content.species) {
    const frame = frames.find(item => item.speciesId === species.id);
    assert.ok(frame, species.id);
    assert.equal(frame.internalId, species.internalId);
    const png = readFileSync(frame.source);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], frame.sheetSize);
    assert.ok(frame.bounds[0] >= 0 && frame.bounds[1] >= 0);
    assert.ok(frame.bounds[2] <= frame.sheetSize[0] && frame.bounds[3] <= frame.sheetSize[1]);
  }
});
test('phone card layout contains the entire card without distortion at all sizes', () => {
  for (const frame of frames) for (const width of [120, 142, 280, 384]) {
    const layout = cardLayout(frame.bounds, frame.sheetSize, width, width * 1.25);
    assert.ok(layout.width <= width + 1e-8 && layout.height <= width * 1.25 + 1e-8);
    assert.ok(Math.abs(layout.width / layout.height - (frame.bounds[2]-frame.bounds[0]) / (frame.bounds[3]-frame.bounds[1])) < 1e-8);
    assert.ok(Math.abs(layout.left + frame.bounds[0] * layout.imageWidth / frame.sheetSize[0]) < 1e-8);
  }
  assert.throws(() => cardLayout([0,0,0,100], [100,100], 120,150));
});
test('repaired source windows include the borders previously cut from Duneclasp and Cragsting', () => {
  const dune = frames.find(frame => frame.speciesId === 'duneclasp')!;
  const crag = frames.find(frame => frame.speciesId === 'cragsting')!;
  assert.deepEqual(dune.bounds, [1108,681,1393,1006]);
  assert.deepEqual(crag.bounds, [5,5,276,341]);
});
test('card frames from the same source never overlap adjacent artwork', () => {
  for (let i=0; i<frames.length; i++) for(let j=i+1; j<frames.length; j++) {
    const a=frames[i], b=frames[j]; if(a.source!==b.source) continue;
    assert.ok(a.bounds[2]<=b.bounds[0] || b.bounds[2]<=a.bounds[0] || a.bounds[3]<=b.bounds[1] || b.bounds[3]<=a.bounds[1], `${a.speciesId} overlaps ${b.speciesId}`);
  }
});
test('browsing the complete card gallery never grants discoveries or changes saves', () => {
  const state=createMobileCampaign({name:'Card keeper',seed:27,starter:'sprigbara'});
  const original=JSON.stringify(state);
  const entries=buildMonsterdexEntries(content.species,state);
  assert.equal(entries.length,244);
  assert.equal(monsterdexProgress(entries).caught,1);
  assert.equal(monsterdexProgress(entries).seen,5);
  assert.ok(filterMonsterdex(entries,{query:'Duneclasp'}).length);
  assert.equal(JSON.stringify(state),original);
});
