import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMobileCommand,createMobileCampaign,MobileCampaignStore,newCampaignRecord} from '../src/game/mobile-campaign.ts';
const setup={name:'Nursery keeper',seed:42,starter:'sprigbara'};
function fixture(){
 const state=createMobileCampaign(setup),id=state.player.monsterIds[0],a={...state.monsters[id],sex:'female' as const},b={...a,id:'second-parent',sex:'male' as const};
 return {...state,monsters:{...state.monsters,[id]:a,[b.id]:b},player:{...state.player,monsterIds:[id,b.id]},homebase:{...state.homebase,buildings:[{buildingId:'breeding-nest',level:1,status:'active' as const}]}};
}
test('native nursery charges once, locks parents and hatches an inherited offspring',()=>{
 let state=fixture();const parents=state.player.monsterIds as [string,string],crowns=state.player.crowns;
 state=applyMobileCommand(state,{kind:'breed',parentIds:parents});const job=state.breedingJobs[0];
 assert.equal(state.player.crowns,crowns-90);
 assert.throws(()=>applyMobileCommand(state,{kind:'breed',parentIds:parents}),/already/);
 assert.throws(()=>applyMobileCommand(state,{kind:'hatch',jobId:job.id}),/not ready/);
 assert.throws(()=>applyMobileCommand(state,{kind:'expedition-start',zoneId:'greenreach-meadow'}),/nursery/);
 for(let i=0;i<3;i++)state=applyMobileCommand(state,{kind:'rest'});
 state=applyMobileCommand(state,{kind:'hatch',jobId:job.id});
 const child=state.monsters[String(state.world.dynamicState['breeding:lastHatch'])];
 assert.equal(child.level,1);assert.equal(child.lineage.generation,1);assert.deepEqual(child.lineage.parentIds,parents);
 assert.equal(state.breedingJobs.length,0);assert.equal(state.player.monsterIds.length,3);
 assert.throws(()=>applyMobileCommand(state,{kind:'hatch',jobId:job.id}),/not ready/);
});
test('native nursery rejects incompatible, missing and unbuilt-habitat assignments',()=>{
 const state=fixture(),parents=state.player.monsterIds as [string,string];
 assert.throws(()=>applyMobileCommand(state,{kind:'breed',parentIds:[parents[0],parents[0]]}),/itself/);
 assert.throws(()=>applyMobileCommand(state,{kind:'breed',parentIds:[parents[0],'absent']}),/roster/);
 assert.throws(()=>applyMobileCommand(state,{kind:'breed',parentIds:parents,habitatType:'grass'}),/Complete/);
 assert.throws(()=>applyMobileCommand({...state,player:{...state.player,crowns:0}},{kind:'breed',parentIds:parents}),/Crowns/);
});
test('failed nursery save does not consume currency or reserve parents',async()=>{
 const state=fixture(),store=new MobileCampaignStore(newCampaignRecord(setup),state,{getItem:async()=>null,setItem:async()=>{throw Error('disk full')}});
 await assert.rejects(store.dispatch({kind:'breed',parentIds:state.player.monsterIds as [string,string]}),/disk full/);
 assert.equal(store.state,state);assert.equal(store.record.commands.length,0);
});
