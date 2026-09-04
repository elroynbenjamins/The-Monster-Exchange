import React from 'react';
import { Image,Pressable,Text,View } from 'react-native';
import type { GameState } from '../src/game/state.ts';
import { MOBILE_STORY } from '../src/game/mobile-campaign.ts';
import { colors } from './ui';
export type HomeDestination='market'|'team'|'dex'|'quest'|'expedition'|'map'|'services'|'nursery'|'contracts'|'arena'|'sanctuary';
const buildings=[
 {id:'nursery',name:'Nursery',detail:'Eggs & lineage',x:.5,y:.85},
 {id:'quest',name:'Keeper Hall',detail:'Story',x:.5,y:.20},
 {id:'team',name:'Monster Yard',detail:'Team',x:.25,y:.38},
 {id:'market',name:'Exchange',detail:'Market',x:.75,y:.38},
 {id:'dex',name:'Archive',detail:'Monsterdex',x:.25,y:.55},
 {id:'expedition',name:'Expedition Post',detail:'Field journeys',x:.75,y:.55},
 {id:'services',name:'Workshop & Clinic',detail:'Base services',x:.25,y:.72},
 {id:'map',name:'Travel Gate',detail:'World map',x:.75,y:.72},
] as const;
const buildingStatus=(state:GameState,id:HomeDestination):string=>{
 const discovery=Object.values(state.player.discoveryBySpecies);
 if(id==='market')return state.world.storyFlags.includes(MOBILE_STORY.market)?`${state.market.listings.length} offers`:'Story locked';
 if(id==='team')return `${state.player.activeTeamIds.length}/5 active`;
 if(id==='dex')return `${discovery.filter(value=>value==='CAUGHT').length} caught`;
 if(id==='quest')return state.world.storyFlags.includes(MOBILE_STORY.firstCapture)?'Field board':'New objective';
 if(id==='expedition')return state.activeExpedition?`Node ${state.activeExpedition.route.currentNode+1}`:'Ready';
 if(id==='nursery'){const ready=state.breedingJobs.filter(job=>job.status==='ready').length;return ready?`${ready} ready`:`${state.breedingJobs.length} eggs`;}
 if(id==='services'){const work=state.homebase.buildings.filter(item=>item.status!=='active').length;return work?`${work} building`:'Care & craft';}
 return state.player.location.cityId?'City map':'Region map';
};
export function HomeBuildings({width,state,onOpen}:{width:number;state:GameState;onOpen(destination:HomeDestination):void}){
 const height=width*1672/941;
 return <View accessibilityLabel="Keeper Estate interactive map" style={{width,height,backgroundColor:'#10232a'}}><Image source={require('../assets/pixel/homebase/homebase-overview-v1.png')} fadeDuration={0} style={{position:'absolute',width,height}}/>{buildings.map(b=>{const status=buildingStatus(state,b.id);return <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`${b.name}: ${b.detail}. ${status}`} onPress={()=>onOpen(b.id)} style={({pressed})=>({position:'absolute',left:width*b.x-58,top:height*b.y-28,width:116,minHeight:56,padding:5,backgroundColor:pressed?'#345348':'#0b202bf2',borderWidth:1,borderBottomWidth:3,borderColor:status.includes('locked')?'#7c6474':colors.gold,justifyContent:'center'})}><Text style={{color:colors.gold,fontSize:12,fontWeight:'800',textAlign:'center'}}>{b.name}</Text><Text style={{color:colors.text,fontSize:11,textAlign:'center'}}>{b.detail}</Text><Text style={{color:status.includes('locked')?'#c9a7b5':'#75d49d',fontSize:10,fontWeight:'700',textAlign:'center'}}>{status}</Text></Pressable>})}</View>;
}
