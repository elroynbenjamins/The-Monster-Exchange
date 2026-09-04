import test from 'node:test';
import assert from 'node:assert/strict';
import {content} from '../src/content/index.ts';
import {fieldBattle} from '../src/game/field-battle.ts';
import {nextActor,validActions} from '../src/systems/battle-engine.ts';
import {applyMobileCommand,createMobileCampaign,newCampaignRecord,restoreCampaign,type MobileCommand} from '../src/game/mobile-campaign.ts';
test('native wild battle replays turns, persists wounds, rejects shortcuts and ends safely',()=>{
 const setup={name:'Battle keeper',seed:42,starter:'sprigbara'},commands:MobileCommand[]=[];
 let state=createMobileCampaign(setup);
 const act=(c:MobileCommand)=>{state=applyMobileCommand(state,c);commands.push(c);};
 for(const step of ['meet-guide','field-lesson','tutorial-capture'] as const)act({kind:'story',step});
 act({kind:'expedition-start',zoneId:'greenreach-meadow'});
 for(let i=0;i<6&&state.activeExpedition?.route.nodes[state.activeExpedition.route.currentNode]?.type!=='encounter';i++)act({kind:'expedition-step',approach:'cautious'});
 act({kind:'field-search'});act({kind:'field-battle-start'});
 assert.throws(()=>applyMobileCommand(state,{kind:'field-battle-start'}),/already/);
 assert.throws(()=>applyMobileCommand(state,{kind:'field-weaken'}),/battle/);
 for(let i=0;i<150&&fieldBattle(state)?.result==='ongoing';i++){
  const b=fieldBattle(state)!,actor=nextActor(b)!;
  act({kind:'field-battle-turn',...(actor.side==='player'?{action:validActions(b,actor.id,content).find(a=>a.kind==='basic')!}:{})});
  if(i===3)assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands})).state,state);
 }
 assert.notEqual(fieldBattle(state)?.result,'ongoing');
 assert.throws(()=>applyMobileCommand(state,{kind:'field-throw'}),/ended/);
 assert.throws(()=>applyMobileCommand(state,{kind:'field-battle-turn'}),/ongoing/);
 assert.deepEqual(restoreCampaign(JSON.stringify({...newCampaignRecord(setup),commands})).state,state);
 act({kind:'field-release'});assert.equal(fieldBattle(state),null);
});
