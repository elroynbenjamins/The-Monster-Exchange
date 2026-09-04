import test from 'node:test';
import assert from 'node:assert/strict';
import { createMobileCampaign,applyMobileCommand,newCampaignRecord,restoreCampaign,type MobileCommand } from '../src/game/mobile-campaign.ts';
import { habitat,landParcels } from '../src/game/habitats.ts';
const setup={name:'Habitat keeper',seed:42,starter:'sprigbara'};
test('land sides are independent, cost Crowns and replay without save changes',()=>{
 const command:MobileCommand={kind:'expand-land',side:'left'};
 const state=applyMobileCommand(createMobileCampaign(setup),command);
 assert.equal(landParcels(state,'left'),1);assert.equal(landParcels(state,'right'),0);
 assert.equal(state.player.crowns,450);
 assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands:[command]})).state,state);
});
test('habitats require land and materials; construction persists and caps at level three',()=>{
 let state=createMobileCampaign(setup);
 state={...state,player:{...state.player,crowns:10000},homebase:{...state.homebase,resources:{timber:1000,stone:1000}}};
 assert.throws(()=>applyMobileCommand(state,{kind:'build-habitat',side:'left',type:'grass'}),/Expand/);
 state=applyMobileCommand(state,{kind:'expand-land',side:'left'});
 state=applyMobileCommand(state,{kind:'build-habitat',side:'left',type:'grass'});
 assert.equal(habitat(state,'grass').building,true);
 assert.throws(()=>applyMobileCommand(state,{kind:'upgrade-habitat',type:'grass'}),/completed/);
 assert.throws(()=>applyMobileCommand(state,{kind:'build-habitat',side:'left',type:'grass'}),/already/);
 for(let level=1;level<=3;level++){
  for(let day=0;day<level;day++)state=applyMobileCommand(state,{kind:'rest'});
  assert.equal(habitat(state,'grass').level,level);
  if(level<3)state=applyMobileCommand(state,{kind:'upgrade-habitat',type:'grass'});
 }
 assert.throws(()=>applyMobileCommand(state,{kind:'upgrade-habitat',type:'grass'}),/three/);
 assert.equal(state.homebase.resources.timber,880);
});
test('land capacity and malformed types are enforced',()=>{
 let state=createMobileCampaign(setup);
 state={...state,player:{...state.player,crowns:10000},homebase:{...state.homebase,resources:{timber:1000,stone:1000}}};
 state=applyMobileCommand(state,{kind:'expand-land',side:'right'});
 for(const type of ['water','fire','ice'] as const)state=applyMobileCommand(state,{kind:'build-habitat',side:'right',type});
 assert.throws(()=>applyMobileCommand(state,{kind:'build-habitat',side:'right',type:'grass'}),/Expand/);
 assert.throws(()=>applyMobileCommand(state,{kind:'build-habitat',side:'right',type:'invalid'} as unknown as MobileCommand),/Unknown/);
});
