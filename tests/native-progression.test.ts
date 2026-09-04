import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMobileCommand,createMobileCampaign,newCampaignRecord,MobileCampaignStore} from '../src/game/mobile-campaign.ts';
import {specialEvolutionReady} from '../src/game/native-progression.ts';
const setup={name:'Growth',seed:42,starter:'sprigbara'};
function fixture(speciesId='mucklet'){
 const s=createMobileCampaign(setup),id=s.player.monsterIds[0];
 return {...s,monsters:{...s.monsters,[id]:{...s.monsters[id],speciesId,level:50,wins:50}},homebase:{...s.homebase,buildings:[{buildingId:'research-lab',level:1,status:'active' as const}]}};
}
test('native evolution preserves individual identity and grants caught discovery only on success',()=>{
 const s=fixture(),id=s.player.monsterIds[0],next=applyMobileCommand(s,{kind:'evolve',monsterId:id,evolutionId:'mucklet-to-bogrumbler'});
 assert.equal(next.monsters[id].speciesId,'bogrumbler');assert.deepEqual(next.monsters[id].genes,s.monsters[id].genes);
 assert.deepEqual(next.monsters[id].lineage,s.monsters[id].lineage);assert.equal(next.player.discoveryBySpecies.bogrumbler,'CAUGHT');
 assert.throws(()=>applyMobileCommand(next,{kind:'evolve',monsterId:id,evolutionId:'mucklet-to-bogrumbler'}),/Unknown/);
 assert.throws(()=>applyMobileCommand({...s,player:{...s.player,monsterIds:[]}},{kind:'evolve',monsterId:id,evolutionId:'mucklet-to-bogrumbler'}),/roster/);
});
test('species study consumes actual notes without granting discovery or ownership',()=>{
 let s=fixture('sprigbara');s={...s,player:{...s.player,inventory:{...s.player.inventory,'research-notes':2}}};
 const next=applyMobileCommand(s,{kind:'study',speciesId:'sprigbara',notes:1});
 assert.equal(next.player.inventory['research-notes'],1);assert.equal(next.player.researchBySpecies.sprigbara.points,12);
 assert.deepEqual(next.player.discoveryBySpecies,s.player.discoveryBySpecies);assert.deepEqual(next.player.monsterIds,s.player.monsterIds);
 assert.throws(()=>applyMobileCommand(s,{kind:'study',speciesId:'riftwarden',notes:1}),/Discover/);
 assert.throws(()=>applyMobileCommand(s,{kind:'study',speciesId:'sprigbara',notes:1.5}),/whole/);
});
const cases=[
 ['gloamkit',{bondScore:70,noFaintStreak:5,nightHomeRestDay:1},'greenreach','Clear'],
 ['hushhare',{bondScore:60,healthyBattleFinishes:3,campComfortDay:1},'greenreach','Clear'],
 ['voltgrazer',{stormEncounters:3},'stormpeak','Thunderstorm'],
 ['duneskip',{chargedTraversalStreak:3},'aurelia','Dry Lightning'],
 ['tidepup',{coastalDiscoveries:4,reefCatches:2,reefVisitDay:1},'mistwater-coast','Clear'],
 ['burrowseer',{hiddenNodes:5,alphaWitnessed:1,sunriseDay:1},'aurelia','Clear'],
] as const;
for(const [species,values,region,weather] of cases)test(`v47 special evolution gate: ${species}`,()=>{
 const s=fixture(species),id=s.player.monsterIds[0];assert.equal(specialEvolutionReady(s,id),false);
 const next={...s,player:{...s.player,location:{regionId:region},specialEvolutionProgress:Object.fromEntries(Object.entries(values).map(([k,v])=>[`${id}:${k}`,v]))},world:{...s.world,day:1,weatherByRegion:{...s.world.weatherByRegion,[region]:weather}}};
 assert.equal(specialEvolutionReady(next,id),true);
 for(const key of Object.keys(values))assert.equal(specialEvolutionReady({...next,player:{...next.player,specialEvolutionProgress:{...next.player.specialEvolutionProgress,[`${id}:${key}`]:0}}},id),false);
});
test('failed evolution storage write leaves the original individual unchanged',async()=>{
 const s=fixture(),store=new MobileCampaignStore(newCampaignRecord(setup),s,{getItem:async()=>null,setItem:async()=>{throw Error('disk full')}});
 await assert.rejects(store.dispatch({kind:'evolve',monsterId:s.player.monsterIds[0],evolutionId:'mucklet-to-bogrumbler'}),/disk full/);assert.equal(store.state,s);
});
