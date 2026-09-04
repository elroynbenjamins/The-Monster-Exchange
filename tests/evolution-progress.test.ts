import test from 'node:test';
import assert from 'node:assert/strict';
import {createMobileCampaign} from '../src/game/mobile-campaign.ts';
import {recordBattleEvolutionProgress,recordCampEvolutionProgress,recordEncounterEvolutionProgress} from '../src/game/evolution-progress.ts';
const setup={name:'Milestones',seed:42,starter:'sprigbara'};
function active(speciesId:string){
 const s=createMobileCampaign(setup),id=s.player.monsterIds[0];
 return [{...s,monsters:{...s.monsters,[id]:{...s.monsters[id],speciesId}},activeExpedition:{startedOnDay:1,rewards:{},route:{id:'test',zoneId:'greenreach-meadow',teamIds:[id],nodes:[],currentNode:0,stamina:100,status:'active' as const}}},id] as const;
}
test('battle evolution counters are earned only by qualifying completions',()=>{
 let [s,id]=active('hushhare');let next=recordBattleEvolutionProgress(s,s,'player-victory');
 assert.equal(next.player.specialEvolutionProgress[`${id}:healthyBattleFinishes`],1);
 next=recordBattleEvolutionProgress({...s,conditions:{...s.conditions,[id]:{hpRatio:.4,stamina:50}}},{...s,conditions:{...s.conditions,[id]:{hpRatio:.4,stamina:50}}},'player-victory');
 assert.equal(next.player.specialEvolutionProgress[`${id}:healthyBattleFinishes`],undefined);
 [s,id]=active('gloamkit');next=recordBattleEvolutionProgress(s,s,'player-victory');assert.equal(next.player.specialEvolutionProgress[`${id}:noFaintStreak`],1);
 const fainted={...next,conditions:{...next.conditions,[id]:{hpRatio:0,stamina:50}}};next=recordBattleEvolutionProgress(fainted,fainted,'enemy-victory');assert.equal(next.player.specialEvolutionProgress[`${id}:noFaintStreak`],0);
});
test('camp comfort is current-day and limited to a healthy active Hushhare',()=>{
 let [s,id]=active('hushhare');let next=recordCampEvolutionProgress(s,'rest');assert.equal(next.player.specialEvolutionProgress[`${id}:campComfortDay`],s.world.day);
 assert.equal(recordCampEvolutionProgress(s,'resource').player.specialEvolutionProgress[`${id}:campComfortDay`],undefined);
});
test('storm encounter exposure is recorded once on search, not again on capture',()=>{
 let [s,id]=active('voltgrazer');s={...s,player:{...s.player,location:{regionId:'stormpeak'}},world:{...s.world,weatherByRegion:{...s.world.weatherByRegion,stormpeak:'Thunderstorm'}}};
 let next=recordEncounterEvolutionProgress(s);assert.equal(next.player.specialEvolutionProgress[`${id}:stormEncounters`],1);
 next=recordEncounterEvolutionProgress(next,'sprigbara');assert.equal(next.player.specialEvolutionProgress[`${id}:stormEncounters`],1);
});
