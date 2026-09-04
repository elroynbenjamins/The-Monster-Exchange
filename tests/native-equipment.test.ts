import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMobileCommand,createMobileCampaign,newCampaignRecord,restoreCampaign,MobileCampaignStore,type MobileCommand} from '../src/game/mobile-campaign.ts';
const setup={name:'Gear keeper',seed:42,starter:'sprigbara'};
test('native gear equips, restores to pack and replays exactly',()=>{
 let state=createMobileCampaign(setup);const id=state.player.monsterIds[0];
 const commands:MobileCommand[]=[{kind:'equip',monsterId:id,equipmentIds:['training-band','trail-harness']}];
 state=applyMobileCommand(state,commands[0]);assert.equal(state.player.inventory['training-band'],0);
 assert.deepEqual(state.monsters[id].equipmentIds,['training-band','trail-harness']);
 assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands})).state,state);
 state=applyMobileCommand(state,{kind:'equip',monsterId:id,equipmentIds:[]});assert.equal(state.player.inventory['training-band'],1);assert.equal(state.player.inventory['trail-harness'],1);
});
test('native gear rejects duplicates, unavailable items and non-roster ownership',()=>{
 const state=createMobileCampaign(setup),id=state.player.monsterIds[0];
 for(const equipmentIds of [['training-band','training-band'],['capture-lens'],['not-an-item'],['training-band','trail-harness','guard-plate']])assert.throws(()=>applyMobileCommand(state,{kind:'equip',monsterId:id,equipmentIds}));
 assert.throws(()=>applyMobileCommand(state,{kind:'equip',monsterId:'absent',equipmentIds:[]}));
 const outside={...state,player:{...state.player,monsterIds:[]}};assert.throws(()=>applyMobileCommand(outside,{kind:'equip',monsterId:id,equipmentIds:[]}));
});
test('gear cannot change mid-expedition and failed saves preserve the pack',async()=>{
 let state=createMobileCampaign(setup);const id=state.player.monsterIds[0];
 for(const step of ['meet-guide','field-lesson','tutorial-capture'] as const)state=applyMobileCommand(state,{kind:'story',step});
 const away=applyMobileCommand(state,{kind:'expedition-start',zoneId:'greenreach-meadow'});
 assert.throws(()=>applyMobileCommand(away,{kind:'equip',monsterId:id,equipmentIds:['training-band']}),/expedition/);
 const initial=createMobileCampaign(setup),store=new MobileCampaignStore(newCampaignRecord(setup),initial,{getItem:async()=>null,setItem:async()=>{throw new Error('disk full')}});
 await assert.rejects(store.dispatch({kind:'equip',monsterId:id,equipmentIds:['training-band']}),/disk full/);
 assert.equal(store.state,initial);assert.equal(store.record.commands.length,0);
});
