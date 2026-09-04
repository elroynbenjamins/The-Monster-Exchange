import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {evolutionOptions,SPECIAL_EVOLUTION_HINTS,specialEvolutionProgress} from '../src/game/native-progression.ts';
import {researchLabLevel} from '../src/game/commands.ts';
import type {GameState} from '../src/game/state.ts';
import {Button,s} from './ui';
import {CardArt} from './CardArt';
import {ItemIcon} from './ItemVisuals';
import {speciesName,type Confirm} from './screens';
export function MonsterProgression({state,monsterId,confirm}:{state:GameState;monsterId:string;confirm:Confirm}){
 const [open,setOpen]=useState(false),monster=state.monsters[monsterId];
 const research=state.player.researchBySpecies[monster.speciesId]??{level:0,points:0};
 const lab=researchLabLevel(state),notes=state.player.inventory['research-notes']??0;
 const options=evolutionOptions(state,monsterId),nursery=state.breedingJobs.some(j=>j.parentIds.includes(monsterId));
 return <View style={{gap:10}}><Button title={open?'Close growth & research':'Growth & research'} selected={open} onPress={()=>setOpen(!open)}/>{open&&<>
  <Text style={s.subtitle}>Species research · Level {research.level}</Text><Text style={s.muted}>{research.points} points · {notes} notes in pack · Lab level {lab}</Text>
  <View style={s.row}><ItemIcon id="research-notes"/><Text style={[s.muted,{flex:1}]}>One note adds {Math.ceil(10*(1+lab*.15))} research points. Studies never grant ownership or bypass evolution milestones.</Text></View>
  <Button title={lab?'Study · spend 1 research note':'Build a Research Lab at Home'} disabled={!lab||notes<1||!!state.activeExpedition} onPress={()=>confirm('Study this species?','Consume one research note. This advances species research, not a named research project.',{kind:'study',speciesId:monster.speciesId,notes:1})}/>
  <Text style={s.subtitle}>Evolution paths</Text>{!options.length&&<Text style={s.muted}>No further evolution is recorded.</Text>}
  {options.map(({e,check,specialReady})=>{const discovered=state.player.discoveryBySpecies[e.toSpeciesId],progress=specialEvolutionProgress(state,monsterId);return <View key={e.id} style={{gap:8,borderTopWidth:1,borderColor:'#52614c',paddingTop:10}}>{discovered&&discovered!=='UNKNOWN'?<><CardArt speciesId={e.toSpeciesId} width={160}/><Text style={s.text}>{speciesName(e.toSpeciesId)}</Text></>:<Text style={s.text}>Undiscovered evolution</Text>}<Text style={s.muted}>{Object.entries(e.requirements).map(([key,value])=>`${key.replace(/([A-Z])/g,' $1')}: ${String(value).replace(/-/g,' ')}`).join('\n')}</Text>{SPECIAL_EVOLUTION_HINTS[monster.speciesId]&&<><Text style={s.muted}>{SPECIAL_EVOLUTION_HINTS[monster.speciesId]}</Text>{progress.map(p=><View key={p.key}><View style={{height:8,backgroundColor:'#402c32'}}><View style={{height:8,width:`${p.value/p.target*100}%`,backgroundColor:'#71ba87'}}/></View><Text style={s.muted}>{p.label}: {p.value}/{p.target}</Text></View>)}<Text style={s.muted}>Milestones that lack a world event stay locked.</Text></>}<Text style={s.text}>{check.eligible&&specialReady?'Requirements met':`Still needed: ${[...check.unmet,...(!specialReady?['special milestones']:[])].join(', ')}`}</Text>{nursery&&<Text style={s.muted}>Finish nursery duty first.</Text>}<Button title="Review evolution" disabled={!check.eligible||!specialReady||nursery||!!state.activeExpedition} onPress={()=>confirm('Evolve this monster?','This permanently changes its species and consumes the listed material. Identity, genes, lineage and equipment are preserved.',{kind:'evolve',monsterId,evolutionId:e.id})}/></View>})}
 </>}</View>;
}
