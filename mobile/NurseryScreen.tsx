import React,{useState} from 'react';
import {ScrollView,Text,View} from 'react-native';
import type {GameState} from '../src/game/state.ts';
import {content} from '../src/content/index.ts';
import {GAME_TYPES,type GameType} from '../src/core/types.ts';
import {canBreed} from '../src/systems/breeding.ts';
import {habitat} from '../src/game/habitats.ts';
import {Button,Panel,s} from './ui';
import {CardArt} from './CardArt';
import {ItemIcon} from './ItemVisuals';
import {speciesName,type Confirm} from './screens';

export function NurseryScreen({state,confirm}:{state:GameState;confirm:Confirm}){
 const [parents,setParents]=useState<string[]>([]);
 const [place,setPlace]=useState<GameType|undefined>();
 const nest=state.homebase.buildings.find(b=>b.buildingId==='breeding-nest'&&b.status==='active');
 const fee=Math.max(40,100-(nest?.level??1)*10),days=Math.max(1,3-Math.floor((nest?.level??1)/2));
 const selected=parents.filter(id=>state.player.monsterIds.includes(id));
 const pair=selected.map(id=>state.monsters[id]);
 const species=pair.map(m=>content.species.find(s=>s.id===m.speciesId)!);
 const compatible=pair.length===2?canBreed(pair[0],pair[1],species[0],species[1]):{ok:false,reason:'Choose two different parents below.'};
 const occupied=state.breedingJobs.some(j=>j.parentIds.some(id=>selected.includes(id)));
 const away=state.activeExpedition?.route.teamIds.some(id=>selected.includes(id));
 const locations=GAME_TYPES.filter(type=>{const h=habitat(state,type);return h.side&&h.level>0&&!h.building&&species.length===2&&species.every(s=>s.types.includes(type));});
 const used=(type:string)=>state.breedingJobs.filter(j=>(state.world.dynamicState[`breeding:habitat:${j.id}`]??'central')===type).length;
 const problem=!nest?'Build or finish upgrading a Breeding Nest from Home.':!compatible.ok?compatible.reason:occupied?'One of these parents is already caring for an egg.':away?'Return from the expedition before assigning these parents.':state.breedingJobs.length>=nest.level?'All nest places are occupied. Hatch an egg or upgrade the nest.':state.player.crowns<fee?'Not enough Crowns.':place&&(!locations.includes(place)||used(place)>=habitat(state,place).level)?'Choose a matching habitat with a free place, or use the central nursery.':undefined;
 const name=(id:string)=>state.monsters[id]?speciesName(state.monsters[id].speciesId):'Unknown parent';
 const lastId=state.world.dynamicState['breeding:lastHatch'];
 const last=typeof lastId==='string'?state.monsters[lastId]:undefined;
 return <ScrollView contentContainerStyle={s.content}>
  <Text style={s.eyebrow}>HOME / NURSERY</Text><Text style={s.title}>A new generation</Text>
  <Panel><Text style={s.subtitle}>{nest?`Nest level ${nest.level} · ${state.breedingJobs.length}/${nest.level} places`:'Breeding Nest required'}</Text><Text style={s.text}>{fee} Crowns per egg · {days} world days</Text><Text style={s.muted}>Parents stay in your roster but cannot depart or be listed until their egg hatches. Remove them from the active team to send other monsters on expeditions.</Text></Panel>
  <Text style={s.subtitle}>1 · Choose two parents</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>{state.player.monsterIds.map(id=>{const m=state.monsters[id],chosen=selected.includes(id);return <View key={id} style={{width:184,paddingRight:12}}><CardArt speciesId={m.speciesId} width={168}/><Text style={s.text}>{name(id)}</Text><Text style={s.muted}>{m.sex} · Lv {m.level} · Generation {m.lineage.generation}</Text><Text style={s.muted}>{m.lineage.parentIds.length?`Parents: ${m.lineage.parentIds.map(name).join(' + ')}`:'Founder · no recorded parents'}</Text><Button title={chosen?'✓ Remove parent':'Select parent'} selected={chosen} onPress={()=>{setParents(chosen?selected.filter(p=>p!==id):[...selected.slice(-1),id]);setPlace(undefined);}}/></View>;})}</ScrollView>
  <Panel><Text style={s.subtitle}>{selected.map(name).join(' + ')||'Your parent pair'}</Text><Text style={s.text}>{compatible.ok?'Compatible breeding groups':compatible.reason}</Text><Text style={s.muted}>Close relatives cannot breed. The hatchling is a hatchable species from this pair, with inherited genes and possible traits and skills.</Text></Panel>
  <Text style={s.subtitle}>2 · Choose a nursery place</Text>
  <Button title="Central nursery" selected={!place} onPress={()=>setPlace(undefined)}/>
  {locations.map(type=><Button key={type} title={`${type} habitat · ${used(type)}/${habitat(state,type).level} places`} selected={place===type} onPress={()=>setPlace(type)}/>)}
  <Text style={s.muted}>Completed matching habitats offer 1–3 assignment places by level. All eggs also use the central nest capacity. Build habitats on the western or eastern grounds; both parents must share their type.</Text>
  {problem&&<Text accessibilityLiveRegion="polite" style={s.text}>{problem}</Text>}
  <Button title={`Begin breeding · ${fee} C`} disabled={!!problem} onPress={()=>confirm('Begin breeding?',`${selected.map(name).join(' + ')}\n${fee} Crowns · ${days} world days · ${place??'central nursery'}.`,{kind:'breed',parentIds:[selected[0],selected[1]],habitatType:place})}/>
  <Text style={s.subtitle}>3 · Care for your eggs</Text>
  {!state.breedingJobs.length&&<Text style={s.muted}>No eggs yet. Your first compatible pair starts the nursery.</Text>}
  {state.breedingJobs.map(job=><Panel key={job.id}><ItemIcon id="nursery-egg"/><Text style={s.subtitle}>{job.status==='ready'?'Ready to hatch':`${Math.max(0,job.completesOnDay-state.world.day)} world days remaining`}</Text><Text style={s.text}>{job.parentIds.map(name).join(' + ')}</Text><Text style={s.muted}>{String(state.world.dynamicState[`breeding:habitat:${job.id}`]??'central')} · Hatches day {job.completesOnDay}</Text><Button title="Hatch egg" disabled={job.status!=='ready'} onPress={()=>confirm('Welcome your hatchling?','Add a level-1 offspring to your roster and release its parents from nursery duty.',{kind:'hatch',jobId:job.id})}/></Panel>)}
  <Button title="Rest one world day" disabled={!!state.activeExpedition} onPress={()=>confirm('Advance one day?','Eggs and construction progress. The world and market also advance.',{kind:'rest'})}/>
  {last&&<Panel><Text style={s.eyebrow}>LATEST HATCHLING</Text><CardArt speciesId={last.speciesId} width={240}/><Text style={s.subtitle}>{speciesName(last.speciesId)}</Text><Text style={s.text}>Level {last.level} · Generation {last.lineage.generation}</Text><Text style={s.muted}>Parents: {last.lineage.parentIds.map(name).join(' + ')}. Manage your new partner in the Monster Yard.</Text></Panel>}
 </ScrollView>;
}
