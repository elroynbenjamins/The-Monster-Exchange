import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_KEY, MOBILE_STORY, MobileCampaignStore, applyMobileCommand, createMobileCampaign, newCampaignRecord, restoreCampaign } from '../src/game/mobile-campaign.ts';
import { browseMarketListings, buyListing, cancelPlayerListing } from '../src/systems/transactions.ts';
import { createListing } from '../src/systems/market.ts';
import { SeededRandom } from '../src/core/random.ts';
import { content } from '../src/content/index.ts';
const setup = { name: 'Phone Keeper', seed: 42, starter: 'sprigbara' };
const stock = () => createMobileCampaign(setup);
const permitted = () => { let state=stock(); state=applyMobileCommand(state,{kind:'story',step:'meet-guide'}); state=applyMobileCommand(state,{kind:'story',step:'field-lesson'}); state=applyMobileCommand(state,{kind:'story',step:'tutorial-capture'}); return {...state,world:{...state.world,storyFlags:[...state.world.storyFlags,MOBILE_STORY.starters]}}; };

test('native campaign starts with one chosen partner and protected starter preview stock', () => {
  const state = stock();
  assert.deepEqual(state, stock());
  assert.equal(state.world.day, 1);
  assert.equal(state.player.crowns, 750);
  assert.equal(state.player.monsterIds.length, 1);
  assert.equal(state.market.listings.length, 5);
  assert.equal(state.market.listings.every(item => ['sprigbara','cindlet','rifflin','joltmeer','rimeket'].includes(item.monster.speciesId)), true);
  assert.equal(state.player.location.cityId, 'willowmere');
  assert.equal(state.player.discoveryBySpecies.rifflin, 'SEEN');
});
test('story lesson gates trading, guarantees first capture, and preserves protected starters', () => {
  let state=stock();
  assert.throws(()=>applyMobileCommand(state,{kind:'buy',listingId:state.market.listings[0].id}),/field lesson/);
  state=applyMobileCommand(state,{kind:'story',step:'meet-guide'});
  state=applyMobileCommand(state,{kind:'story',step:'field-lesson'});
  state=applyMobileCommand(state,{kind:'story',step:'tutorial-capture'});
  assert.equal(state.player.monsterIds.length,2);
  assert.equal(state.player.inventory['field-capsule'],4);
  assert.ok(state.world.storyFlags.includes(MOBILE_STORY.market));
});
test('home base construction is validated through native campaign commands',()=>{
  let state=stock();
  state=applyMobileCommand(state,{kind:'build',buildingId:'breeding-nest'});
  assert.equal(state.homebase.buildings[0]?.status,'constructing');
  assert.throws(()=>applyMobileCommand(state,{kind:'build',buildingId:'breeding-nest'}),/already exists/);
});
test('native travel charges fare once, ticks the world and arrives in the proper city', () => {
  const before = stock();
  const after = applyMobileCommand(before, { kind: 'travel', routeId: 'greenreach-stonehollow-road' });
  assert.equal(after.player.crowns, before.player.crowns - 30);
  assert.equal(after.world.day, 2);
  assert.equal(after.market.day, 2);
  assert.equal(after.player.location.cityId, 'cairnstead');
  assert.throws(() => applyMobileCommand(before, { kind: 'travel', routeId: 'deep-rift-ferry' }));
});
test('native purchase, listing and cancellation preserve ownership and currency', () => {
  let state = permitted();
  const listing = browseMarketListings(state, { affordableOnly: true })[0];
  assert.ok(listing, 'opening stock should offer at least one affordable monster');
  const crowns = state.player.crowns;
  state = applyMobileCommand(state, { kind: 'buy', listingId: listing.id });
  assert.equal(state.player.crowns, crowns - listing.askingPrice);
  assert.equal(state.monsters[listing.monster.id].ownerId, state.player.id);
  assert.throws(() => applyMobileCommand(state, { kind: 'buy', listingId: listing.id }));
  state = applyMobileCommand(state, { kind: 'list', monsterId: listing.monster.id, price: 200 });
  assert.equal(state.player.monsterIds.includes(listing.monster.id), false);
  const own = state.market.listings.find(item => item.sellerId === state.player.id)!;
  state = applyMobileCommand(state, { kind: 'cancel', listingId: own.id });
  assert.equal(state.player.monsterIds.filter(id => id === listing.monster.id).length, 1);
  assert.equal(state.player.crowns, crowns - listing.askingPrice);
  assert.throws(() => cancelPlayerListing(state, own.id));
  assert.throws(() => cancelPlayerListing(state, state.market.listings[0].id));
});
test('invalid prices, expired purchases, final-monster sales and trading outside a city are rejected', () => {
  const state = permitted();
  const monster = state.monsters[state.player.monsterIds[0]];
  for (const price of [NaN, Infinity, 0, -1, 1.5]) assert.throws(() => createListing(monster, state.player.id, price, 1, 3, new SeededRandom(3)));
  const finalOnly=stock();
  const finalPermitted={...finalOnly,world:{...finalOnly.world,storyFlags:[MOBILE_STORY.market]}};
  assert.throws(() => applyMobileCommand(finalPermitted, { kind: 'list', monsterId: finalPermitted.player.monsterIds[0], price: 100 }), /final monster/);
  const expired = { ...state, world: { ...state.world, day: state.market.listings[0].expiresOnDay } };
  assert.equal(browseMarketListings(expired).length, 0);
  assert.throws(() => buyListing(expired, state.market.listings[0].id, content.species), /expired/);
  const outside = { ...state, player: { ...state.player, location: { regionId: 'greenreach' } } };
  assert.throws(() => applyMobileCommand(outside, { kind: 'buy', listingId: state.market.listings[0].id }), /Visit a city/);
});
test('native contracts accept, progress from completed expeditions, and pay exactly once',()=>{
  let state=permitted();
  state=applyMobileCommand(state,{kind:'contract-accept',definitionId:'meadow-survey'});
  state={...state,activeExpedition:{startedOnDay:state.world.day,rewards:{},route:{id:'test-route',zoneId:'greenreach-meadow',teamIds:state.player.activeTeamIds,stamina:50,currentNode:1,nodes:[{id:'boss',type:'boss',resolved:true}],status:'completed'}}};
  state=applyMobileCommand(state,{kind:'expedition-return',retreat:false});
  assert.equal(state.contracts.find(item=>item.definitionId==='meadow-survey')?.status,'complete');
  const crowns=state.player.crowns;
  state=applyMobileCommand(state,{kind:'contract-claim',definitionId:'meadow-survey'});
  assert.equal(state.player.crowns,crowns+120);
  assert.throws(()=>applyMobileCommand(state,{kind:'contract-claim',definitionId:'meadow-survey'}),/not ready/);
});
test('native trainer challenges initialize opponents, persist an outcome, and enforce daily limits',()=>{
  const before=permitted(),after=applyMobileCommand(before,{kind:'trainer-challenge',trainerId:'friend-tessa'});
  assert.ok(after.trainers['friend-tessa']);
  assert.ok(['Victory','Defeat'].includes(String(after.world.dynamicState['arena:lastResult'])));
  assert.equal(after.world.nextRandomOffset,before.world.nextRandomOffset+1);
  assert.throws(()=>applyMobileCommand(after,{kind:'trainer-challenge',trainerId:'friend-tessa'}),/already battled/);
  assert.deepEqual(applyMobileCommand(before,{kind:'trainer-challenge',trainerId:'friend-tessa'}),after);
});
test('native nickname and skill loadout commands validate and replay roster changes',()=>{
  const before=permitted(),monsterId=before.player.monsterIds[0]!,known=before.monsters[monsterId]!.knownSkillIds.slice(0,2);
  let after=applyMobileCommand(before,{kind:'rename',monsterId,nickname:'  Trail   Star  '});
  after=applyMobileCommand(after,{kind:'skills',monsterId,skillIds:[...known]});
  assert.equal(after.monsters[monsterId]?.nickname,'Trail Star');
  assert.deepEqual(after.monsters[monsterId]?.equippedSkillIds,known);
  assert.throws(()=>applyMobileCommand(after,{kind:'skills',monsterId,skillIds:['not-a-skill']}),/known skills/);
});
test('expedition members cannot change skills mid-route',()=>{
  const state=permitted(),monsterId=state.player.activeTeamIds[0]!;
  const away={...state,activeExpedition:{startedOnDay:state.world.day,rewards:{},route:{id:'route',zoneId:'greenreach-meadow',teamIds:[monsterId],stamina:100,currentNode:0,nodes:[{id:'one',type:'rest' as const,resolved:false}],status:'active' as const}}};
  assert.throws(()=>applyMobileCommand(away,{kind:'skills',monsterId,skillIds:[]}),/during an expedition/);
});
test('native Crest Guardian bonding enforces sanctuary region and progression once',()=>{
  const base=permitted();
  const eligible={...base,player:{...base.player,reputation:20,researchBySpecies:{mossveil:{level:5,points:65},canopyre:{level:4,points:65},sprigbara:{level:3,points:65}}}};
  const bonded=applyMobileCommand(eligible,{kind:'guardian-bond',speciesId:'aurevine'});
  const guardianId=bonded.player.monsterIds.find(id=>bonded.monsters[id]?.speciesId==='aurevine');
  assert.ok(guardianId);
  assert.equal(bonded.monsters[guardianId!]?.variantId,'crest');
  assert.equal(bonded.world.nextRandomOffset,eligible.world.nextRandomOffset+1);
  assert.throws(()=>applyMobileCommand(bonded,{kind:'guardian-bond',speciesId:'aurevine'}),/already bonded/);
  assert.throws(()=>applyMobileCommand(eligible,{kind:'guardian-bond',speciesId:'tempestyr'}),/stormpeak/);
});
test('native save replay resumes exact campaign state', async () => {
  let saved = '';
  const storage = { getItem: async () => saved, setItem: async (key: string, value: string) => { assert.equal(key, CAMPAIGN_KEY); saved = value; } };
  const store = new MobileCampaignStore(newCampaignRecord(setup), stock(), storage);
  await store.dispatch({ kind: 'travel', routeId: 'greenreach-stonehollow-road' });
  await store.dispatch({ kind: 'rest' });
  const restored = restoreCampaign(saved);
  assert.deepEqual(restored.state, store.state);
  assert.deepEqual(restored.record, store.record);
  assert.throws(() => restoreCampaign('{'));
  assert.throws(() => restoreCampaign(JSON.stringify({ ...store.record, rules: 'old' })));
});
test('failed device writes do not commit and concurrent taps cannot duplicate actions', async () => {
  const before = stock();
  const fail = new MobileCampaignStore(newCampaignRecord(setup), before, { getItem: async () => null, setItem: async () => { throw new Error('disk full'); } });
  await assert.rejects(fail.dispatch({ kind: 'rest' }), /disk full/);
  assert.equal(fail.state, before);
  assert.equal(fail.record.commands.length, 0);
  let finish!: () => void;
  const store = new MobileCampaignStore(newCampaignRecord(setup), before, { getItem: async () => null, setItem: () => new Promise<void>(resolve => { finish = resolve; }) });
  const pending = store.dispatch({ kind: 'rest' });
  await assert.rejects(store.dispatch({ kind: 'rest' }), /Please wait/);
  assert.equal(store.state, before);
  finish(); await pending;
  assert.equal(store.state.world.day, 2);
});
