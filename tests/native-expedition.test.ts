import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMobileCommand,createMobileCampaign,newCampaignRecord,restoreCampaign,type MobileCommand} from '../src/game/mobile-campaign.ts';
test('native expedition completes, banks rewards once and replays exactly',()=>{
 const setup={name:'Explorer',seed:42,starter:'sprigbara'};
 const commands:MobileCommand[]=[{kind:'story',step:'meet-guide'},{kind:'story',step:'field-lesson'},{kind:'story',step:'tutorial-capture'},{kind:'expedition-start',zoneId:'greenreach-meadow'}];
 let state=commands.reduce(applyMobileCommand,createMobileCampaign(setup));
 assert.throws(()=>applyMobileCommand(state,{kind:'expedition-start',zoneId:'greenreach-meadow'}));
 for(let i=0;i<6&&state.activeExpedition?.route.status==='active';i++){const command:MobileCommand={kind:'expedition-step',approach:'cautious'};commands.push(command);state=applyMobileCommand(state,command)}
 const end:MobileCommand={kind:'expedition-return',retreat:state.activeExpedition!.route.status!=='completed'};commands.push(end);state=applyMobileCommand(state,end);
 assert.equal(state.activeExpedition,undefined);
 assert.throws(()=>applyMobileCommand(state,end));
 assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands})).state,state);
});
test('native expeditions enforce tutorial and regional access',()=>{
 const state=createMobileCampaign({name:'Explorer',seed:42,starter:'sprigbara'});
 assert.throws(()=>applyMobileCommand(state,{kind:'expedition-start',zoneId:'greenreach-meadow'}),/tutorial/);
 assert.throws(()=>applyMobileCommand(state,{kind:'expedition-start',zoneId:'stormpeak-foothills'}),/current region/);
});
