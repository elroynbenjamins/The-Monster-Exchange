import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import type { GameState } from '../src/game/state.ts';
import { content } from '../src/content/index.ts';
import { MOBILE_STORY } from '../src/game/mobile-campaign.ts';
import { Button, Panel, s } from './ui';
import { regionName, type Confirm } from './screens';
import { BaseServices } from './BaseServices';
import { EstateMap } from './EstateMap';
import type { HomeDestination } from './HomeBuildings';
const has=(state:GameState,flag:string)=>state.world.storyFlags.includes(flag);
export function QuestScreen({state,confirm}: {state:GameState;confirm:Confirm}) {
  const captured=has(state,MOBILE_STORY.firstCapture), lesson=has(state,MOBILE_STORY.fieldLesson), met=has(state,MOBILE_STORY.metGuide);
  const steps=[
    {done:met,title:'1 · Meet Tessa at Willowmere Gate',body:'Your field guide explains tracks, habitats and why wild monsters must be weakened before capture.',action:'Talk to Tessa',command:{kind:'story',step:'meet-guide'} as const,enabled:true},
    {done:lesson,title:'2 · Learn the capture cycle',body:'Find a wild monster → battle carefully → lower its stamina → choose a Field Capsule → wait for the result.',action:'Begin field lesson',command:{kind:'story',step:'field-lesson'} as const,enabled:met},
    {done:captured,title:'3 · Guided Mossveil encounter',body:'Tessa weakens a young Mossveil. This safe tutorial guarantees your first capture and consumes one Field Capsule.',action:'Throw Field Capsule',command:{kind:'story',step:'tutorial-capture'} as const,enabled:lesson},
  ];
  return <ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>STORY QUEST / THE FIRST TRAIL</Text><Text style={s.title}>A keeper’s first promise</Text><Text style={s.text}>Learn to encounter and catch monsters before Willowmere grants access to its Exchange.</Text>{steps.map(step=><Panel key={step.title} style={step.done?{opacity:.62}:undefined}><Text style={s.subtitle}>{step.done?'✓ ':''}{step.title}</Text><Text style={s.muted}>{step.body}</Text>{!step.done&&<Button title={step.enabled?step.action:'Complete the previous step'} disabled={!step.enabled} onPress={()=>confirm(step.title,step.body,step.command)}/>}</Panel>)}<Panel><Text style={s.eyebrow}>QUEST REWARD</Text><Text style={s.subtitle}>{captured?'Exchange permit granted':'Willowmere Exchange permit'}</Text><Text style={s.muted}>Starter species remain protected. Their offers unlock only after reaching Stonehollow in the next chapter.</Text></Panel><FieldQuest state={state} confirm={confirm}/></ScrollView>;
}
const effect:Record<string,string>={'breeding-nest':'Unlocks breeding; higher levels increase capacity.','field-clinic':'Improves recovery between expeditions.','expedition-lodge':'Unlocks longer expeditions and field support.','research-lab':'Adds 15% species research per level.','field-workshop':'Unlocks capture gear and equipment recipes.'};
function HomeStatus({state,onOpen}:{state:GameState;onOpen(destination:HomeDestination):void}) {
  const discoveries=Object.values(state.player.discoveryBySpecies);
  const caught=discoveries.filter(value=>value==='CAUGHT').length;
  const seen=discoveries.filter(value=>value==='SEEN').length+caught;
  const construction=state.homebase.buildings.filter(building=>building.status!=='active');
  const readyEggs=state.breedingJobs.filter(job=>job.status==='ready').length;
  const expedition=state.activeExpedition?.route;
  const met=has(state,MOBILE_STORY.metGuide), lesson=has(state,MOBILE_STORY.fieldLesson), captured=has(state,MOBILE_STORY.firstCapture);
  const nextQuest=!met?'Meet Tessa':!lesson?'Learn the capture cycle':!captured?'Complete the guided capture':'Continue field quests';
  return <Panel><Text style={s.eyebrow}>ESTATE STATUS · DAY {state.world.day}</Text><Text style={s.subtitle}>{regionName(state.player.location.regionId)} command board</Text>
    <View style={s.row}><Button title={expedition?`Expedition ${expedition.currentNode}/${expedition.nodes.length}`:'Plan expedition'} onPress={()=>onOpen('expedition')}/><Button title={readyEggs?`${readyEggs} egg${readyEggs===1?'':'s'} ready`:`Nursery · ${state.breedingJobs.length} active`} onPress={()=>onOpen('nursery')}/></View>
    <View style={s.row}><Button title={`${caught} caught · ${seen} seen`} onPress={()=>onOpen('dex')}/><Button title={nextQuest} onPress={()=>onOpen('quest')}/></View>
    <Text style={s.muted}>{construction.length?`${construction.length} facility project${construction.length===1?'':'s'} underway. Construction completes as world days advance.`:'All current facility projects are complete.'}</Text>
  </Panel>;
}
export function BaseScreen({state,confirm,onOpen}: {state:GameState;confirm:Confirm;onOpen(destination:HomeDestination):void}) {
  return <ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>KEEPER HOME / WILLOWMERE</Text><Text style={s.title}>Home · Keeper Estate</Text><Text style={s.muted}>Tap a central building to play. Swipe to the outer grounds for habitats.</Text><HomeStatus state={state} onOpen={onOpen}/><EstateMap state={state} confirm={confirm} onOpen={onOpen}/><Panel><Text style={s.subtitle}>Stores</Text><ItemStrip items={state.homebase.resources}/><Text style={s.text}>Timber {state.homebase.resources.timber??0} · Stone {state.homebase.resources.stone??0} · Herbs {state.homebase.resources.herbs??0}</Text><Text style={s.muted}>Plots used: {state.homebase.buildings.length}/{state.homebase.slotCount}</Text></Panel>{content.buildings.map(def=>{const built=state.homebase.buildings.find(item=>item.buildingId===def.id);const cost=Object.entries(def.baseCost).map(([key,value])=>`${value*(built?built.level+1:1)} ${key}`).join(' · ');const busy=built&&built.status!=='active';return <Panel key={def.id}><FacilityIcon id={def.id}/><ItemStrip items={Object.fromEntries(Object.entries(def.baseCost).map(([id,n])=>[id,n*(built?built.level+1:1)]))} available={state.homebase.resources}/><Text style={s.eyebrow}>{def.capability.toUpperCase()}</Text><Text style={s.subtitle}>{def.name} {built?`· Lv ${built.level}`:''}</Text><Text style={s.muted}>{effect[def.id]}{busy?`\n${built.status} · completes day ${built.completesOnDay}`:`\n${cost}`}</Text><Button title={!built?'Build facility':busy?'Construction underway':built.level>=def.maxLevel?'Maximum level':'Upgrade facility'} disabled={Object.entries(def.baseCost).some(([id,n])=>(state.homebase.resources[id]??0)<n*(built?built.level+1:1))||!!busy||built?.level===def.maxLevel||(!built&&state.homebase.buildings.length>=state.homebase.slotCount)} onPress={()=>confirm(!built?`Build ${def.name}?`:`Upgrade ${def.name}?`,`${cost}\nConstruction advances with world days.`,{kind:!built?'build':'upgrade',buildingId:def.id})}/></Panel>})}<BaseServices state={state} confirm={confirm}/></ScrollView>;
}
import { FieldQuest } from './FieldCapturePanel';
import { ItemStrip, FacilityIcon } from './ItemVisuals';
