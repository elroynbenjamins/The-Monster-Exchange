import test from 'node:test';
import assert from 'node:assert/strict';
import {createMobileCampaign,applyMobileCommand,newCampaignRecord,restoreCampaign,MOBILE_STORY,type MobileCommand} from '../src/game/mobile-campaign.ts';
const setup={name:'Refinement',seed:42,starter:'sprigbara'};
const initial=()=>createMobileCampaign(setup);
const tutorial:MobileCommand[]=[{kind:'story',step:'meet-guide'},{kind:'story',step:'field-lesson'},{kind:'story',step:'tutorial-capture'}];
test('new tutorial purchases replay exactly without granting protected starter access',()=>{
 let state=tutorial.reduce(applyMobileCommand,initial());
 const offer=state.market.listings.find(l=>l.askingPrice<=state.player.crowns)!;
 const buy:MobileCommand={kind:'buy',listingId:offer.id};
 state=applyMobileCommand(state,buy);
 const restored=restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands:[...tutorial,buy]})).state;
 assert.deepEqual(restored,state);
 assert.equal(restored.world.storyFlags.includes(MOBILE_STORY.starters),false);
});
test('malformed story steps cannot trigger captures',()=>{
 const state=tutorial.slice(0,2).reduce(applyMobileCommand,initial());
 assert.throws(()=>applyMobileCommand(state,{kind:'story',step:'bad'} as unknown as MobileCommand),/Unknown story/);
});
test('deposits transfer rather than duplicate resources',()=>{
 const before=initial(),after=applyMobileCommand(before,{kind:'deposit',resourceId:'timber',amount:5});
 assert.equal(after.player.inventory.timber,before.player.inventory.timber-5);
 assert.equal(after.homebase.resources.timber,before.homebase.resources.timber+5);
 assert.throws(()=>applyMobileCommand(before,{kind:'deposit',resourceId:'timber',amount:-5}));
});
test('expansion charges increasing prices and stops at five plots',()=>{
 let state=applyMobileCommand(initial(),{kind:'expand-base'});
 assert.equal(state.player.crowns,550);
 state=applyMobileCommand(state,{kind:'expand-base'});
 assert.equal(state.player.crowns,150);
 assert.equal(state.homebase.slotCount,5);
 assert.throws(()=>applyMobileCommand(state,{kind:'expand-base'}),/five/);
});
test('foundation reward requires a completed facility and pays only once',()=>{
 let state=tutorial.reduce(applyMobileCommand,initial());
 assert.throws(()=>applyMobileCommand(state,{kind:'claim-foundation'}));
 state=applyMobileCommand(state,{kind:'build',buildingId:'breeding-nest'});
 state=applyMobileCommand(applyMobileCommand(state,{kind:'rest'}),{kind:'rest'});
 const before=state.homebase.resources.timber;
 state=applyMobileCommand(state,{kind:'claim-foundation'});
 assert.equal(state.homebase.resources.timber,before+40);
 assert.throws(()=>applyMobileCommand(state,{kind:'claim-foundation'}),/already/);
});
test('crafting needs an active workshop and care cannot waste herbs on healthy monsters',()=>{
 const state=initial();
 assert.throws(()=>applyMobileCommand(state,{kind:'craft',recipeId:'craft-field-capsule'}),/requires/);
 assert.throws(()=>applyMobileCommand(state,{kind:'care',monsterId:state.player.monsterIds[0]}),/does not need/);
 let workshop=applyMobileCommand(state,{kind:'build',buildingId:'field-workshop'});
 workshop=applyMobileCommand(applyMobileCommand(workshop,{kind:'rest'}),{kind:'rest'});
 const crafted=applyMobileCommand(workshop,{kind:'craft',recipeId:'craft-field-capsule'});
 assert.equal(crafted.player.inventory['field-capsule'],6);
 assert.equal(crafted.player.inventory.herbs,3);
});
