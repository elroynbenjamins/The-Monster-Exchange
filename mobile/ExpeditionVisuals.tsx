import React from 'react';
import {Image,ScrollView,Text,View} from 'react-native';
import type {GameState} from '../src/game/state.ts';
import {maps} from './assets';
import {s,Portrait,StatusChip} from './ui';
import {ItemStrip} from './ItemVisuals';
export function ExpeditionVisuals({state}:{state:GameState}){
 const run=state.activeExpedition;
 return <View style={{gap:10}}><Image source={maps[`region-${state.player.location.regionId}`]} resizeMode="cover" style={{width:'100%',height:170}} accessibilityLabel="Current expedition region"/><Text style={s.eyebrow}>YOUR FIELD TEAM</Text><ScrollView horizontal contentContainerStyle={{gap:8}} showsHorizontalScrollIndicator={false}>{state.player.activeTeamIds.map(id=>{const monster=state.monsters[id],condition=state.conditions[id]??{hpRatio:1,stamina:100};return <View key={id} style={{width:140,padding:6,alignItems:'center',backgroundColor:'#122936',borderWidth:1,borderColor:condition.hpRatio<=0||condition.stamina<20?'#986a6a':'#41534e'}}><Portrait speciesId={monster.speciesId}/><Text numberOfLines={1} style={s.text}>{monster.nickname??monster.speciesId}</Text><Text style={s.muted}>HP {Math.round(condition.hpRatio*100)}% · STA {condition.stamina}</Text></View>})}</ScrollView>{run&&<><Text style={s.eyebrow}>ROUTE · NODE {Math.min(run.route.currentNode+1,run.route.nodes.length)}/{run.route.nodes.length}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}>{run.route.nodes.map((node,index)=><StatusChip key={node.id} label={`${index+1} · ${node.type}`} tone={index<run.route.currentNode?'good':index===run.route.currentNode?'warn':'neutral'}/>)}</ScrollView><Text style={s.eyebrow}>COLLECTED · BANK ON RETURN</Text><ItemStrip items={run.rewards}/></>}</View>;
}
