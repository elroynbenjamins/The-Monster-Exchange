import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMobileCommand,createMobileCampaign,newCampaignRecord,restoreCampaign,type MobileCommand} from '../src/game/mobile-campaign.ts';
import {pendingCapture} from '../src/game/field-capture.ts';
const setup={name:'Field test',seed:42,starter:'sprigbara'};
const start:MobileCommand[]=[{kind:'story',step:'meet-guide'},{kind:'story',step:'field-lesson'},{kind:'story',step:'tutorial-capture'},{kind:'expedition-start',zoneId:'greenreach-meadow'}];
test('field encounters persist, consume stamina and capsules, and cannot be rerolled',()=>{
 const commands=[...start];let state=commands.reduce(applyMobileCommand,createMobileCampaign(setup));
 assert.equal(new Set(state.player.monsterIds).size,state.player.monsterIds.length);
 assert.equal(state.monsters[state.player.monsterIds[0]].speciesId,'sprigbara');
 while(state.activeExpedition?.route.nodes[state.activeExpedition.route.currentNode]?.type!=='encounter'){
  const command:MobileCommand={kind:'expedition-step',approach:'cautious'};commands.push(command);state=applyMobileCommand(state,command);
 }
 const act=(command:MobileCommand)=>{state=applyMobileCommand(state,command);commands.push(command)};
 act({kind:'field-search'});assert.ok(pendingCapture(state));
 assert.throws(()=>applyMobileCommand(state,{kind:'field-search'}),/already/);
 assert.throws(()=>applyMobileCommand(state,{kind:'expedition-step',approach:'bold'}),/release/);
 const stamina=state.conditions[state.player.activeTeamIds[0]].stamina;
 act({kind:'field-weaken'});assert.equal(state.conditions[state.player.activeTeamIds[0]].stamina,stamina-5);
 assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands})).state,state);
 const capsules=state.player.inventory['field-capsule'];act({kind:'field-throw'});
 assert.equal(state.player.inventory['field-capsule'],capsules-1);
 if(pendingCapture(state))act({kind:'field-release'});
 assert.throws(()=>applyMobileCommand(state,{kind:'field-search'}),/already/);
 assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands})).state,state);
});
test('field certificate checks both objectives and pays once',()=>{
 let state=createMobileCampaign(setup);assert.throws(()=>applyMobileCommand(state,{kind:'claim-field-quest'}));
 state={...state,world:{...state.world,storyFlags:['STORY_FIELD_CAPTURE','STORY_EXPEDITION_COMPLETE']}};
 state=applyMobileCommand(state,{kind:'claim-field-quest'});assert.equal(state.player.crowns,900);assert.equal(state.player.inventory['field-capsule'],8);
 assert.throws(()=>applyMobileCommand(state,{kind:'claim-field-quest'}),/already/);
});
