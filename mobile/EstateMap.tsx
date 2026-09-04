import React,{useRef,useState,useEffect} from 'react';
import { Image,Pressable,ScrollView,Text,View,useWindowDimensions } from 'react-native';
import { GAME_TYPES,type GameType } from '../src/core/types.ts';
import type { GameState } from '../src/game/state.ts';
import { habitat,habitatCost,landParcels,type EstateSide } from '../src/game/habitats.ts';
import { Button,Panel,StatusChip,s } from './ui';
import type { Confirm } from './screens';
import { HomeBuildings,type HomeDestination } from './HomeBuildings';
const atlas=require('../assets/pixel/homebase/habitat-atlas-v1.png');
function HabitatArt({type,level}:{type:GameType;level:number}) {
 const index=GAME_TYPES.indexOf(type),col=(index%2)*3+Math.max(0,level-1),row=Math.floor(index/2);
 return <View accessibilityLabel={`${type} habitat level ${level}`} style={{width:100,height:100,overflow:'hidden'}}><Image source={atlas} fadeDuration={0} style={{position:'absolute',width:600,height:900,left:-col*100,top:-row*100}}/></View>;
}
export function EstateMap({state,confirm,onOpen}:{state:GameState;confirm:Confirm;onOpen(destination:HomeDestination):void}) {
 const width=Math.max(240,useWindowDimensions().width-32),scroll=useRef<ScrollView>(null);
 const [page,setPage]=useState(3),[side,setSide]=useState<EstateSide|null>(null),[selectedType,setSelectedType]=useState<GameType|null>(null);
 useEffect(()=>{scroll.current?.scrollTo({x:3*width,animated:false});setPage(3)},[width]);
 const go=(p:number)=>{const next=Math.max(0,Math.min(6,p));scroll.current?.scrollTo({x:next*width,animated:!state.uiPreferences.reducedMotion});setPage(next);setSide(null);setSelectedType(null)};
 const pageName=page===3?'Central estate':`${page<3?'West':'East'} grounds · parcel ${Math.abs(page-3)}`;
 const west=landParcels(state,'left'),east=landParcels(state,'right'),allHabitats=GAME_TYPES.map(type=>habitat(state,type)).filter(item=>item.side);
 return <>
 <View style={[s.row,{justifyContent:'space-between'}]}><Button title="← West" disabled={page===0} onPress={()=>go(page-1)}/><Button title="⌂ Center" selected={page===3} onPress={()=>go(3)}/><Button title="East →" disabled={page===6} onPress={()=>go(page+1)}/></View>
 <Panel><Text style={s.eyebrow}>ESTATE MAP · {page+1}/7</Text><Text style={s.subtitle}>{pageName}</Text><View style={s.row}><StatusChip label={`West ${west}/3 parcels`} tone={west===3?'good':'neutral'}/><StatusChip label={`${allHabitats.length} habitats`} tone={allHabitats.length?'good':'neutral'}/><StatusChip label={`East ${east}/3 parcels`} tone={east===3?'good':'neutral'}/></View><View style={[s.row,{justifyContent:'center'}]}>{[0,1,2,3,4,5,6].map(index=>{const parcel=Math.abs(index-3),owned=index===3||(index<3?west:east)>=parcel;return <Pressable key={index} accessibilityRole="button" accessibilityLabel={`${index===3?'Central estate':`${index<3?'West':'East'} parcel ${parcel}`}, ${owned?'open':'locked'}`} accessibilityState={{selected:index===page}} onPress={()=>go(index)} style={{width:48,height:48,alignItems:'center',justifyContent:'center'}}><View style={{width:index===page?16:10,height:index===page?16:10,backgroundColor:index===page?'#d4af59':owned?'#75a978':'#493b46',borderWidth:1,borderColor:owned?'#d4af59':'#866c7f'}}/></Pressable>})}</View><Text style={s.muted}>Swipe between the expandable grounds. Green parcels are owned; each adds three habitat plots.</Text></Panel>
 <ScrollView ref={scroll} horizontal pagingEnabled nestedScrollEnabled contentOffset={{x:3*width,y:0}} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={e=>{setPage(Math.round(e.nativeEvent.contentOffset.x/width));setSide(null);setSelectedType(null)}}>
 {[0,1,2,3,4,5,6].map(index=>{
  if(index===3)return <HomeBuildings key="home" width={width} state={state} onOpen={onOpen}/>;
  const wing:EstateSide=index<3?'left':'right',parcel=Math.abs(index-3),owned=landParcels(state,wing),built=GAME_TYPES.map(type=>habitat(state,type)).filter(h=>h.side===wing),next=owned+1;
  return <View key={index} style={{width,padding:8,gap:8,backgroundColor:'#10232a',minHeight:530}}><Text style={s.subtitle}>{wing==='left'?'West':'East'} grounds · parcel {parcel}</Text>
   {parcel>owned?<Panel><Text style={s.text}>Unclaimed woodland</Text><Text style={s.muted}>Preserve the central estate; open this adjoining land for typed habitats.</Text><Button title={parcel===next?`Buy land · ${300*parcel} C`:'Unlock the adjoining parcel first'} disabled={parcel!==next||state.player.crowns<300*parcel} onPress={()=>confirm('Expand the grounds?',`Spend ${300*parcel} Crowns for three ${wing} habitat plots. This is separate from central facility slots.`,{kind:'expand-land',side:wing})}/></Panel>:[0,1,2].map(offset=>{
    const slot=(parcel-1)*3+offset,h=built.find(h=>h.slot===slot);
    if(!h)return <Panel key={slot}><Text style={s.muted}>Habitat plot {slot+1} · empty</Text><Button title={slot===built.length?'Choose habitat type':'Build on the first empty plot'} disabled={slot!==built.length} onPress={()=>{setSide(wing);setSelectedType(null)}}/></Panel>;
    const cost=habitatCost(h.level+1),poor=state.player.crowns<cost.crowns||(state.homebase.resources.timber??0)<cost.timber||(state.homebase.resources.stone??0)<cost.stone;
    return <Panel key={slot}><View style={{flexDirection:'row',gap:8}}><HabitatArt type={h.type} level={Math.max(1,h.level)}/><View style={{flex:1}}><Text style={s.subtitle}>{h.type}</Text><View style={s.row}><StatusChip label={h.building?`Ready day ${h.completesOnDay}`:`Level ${h.level}/3`} tone={h.building?'warn':'good'}/><StatusChip label={`${Math.max(1,h.level)} assignment place${h.level===1?'':'s'}`}/></View><Button title={h.building?'Under construction':h.level===3?'Sanctuary complete':poor?'Need materials':`Upgrade · ${cost.crowns} C`} disabled={h.building||h.level===3||poor} onPress={()=>confirm('Upgrade habitat?',`${cost.crowns} Crowns · ${cost.timber} timber · ${cost.stone} stone · ${cost.days} days.`,{kind:'upgrade-habitat',type:h.type})}/></View></View></Panel>;
   })}
  </View>;
 })}</ScrollView>
 {side&&<Panel><Text style={s.eyebrow}>NEW HABITAT</Text><Text style={s.subtitle}>Choose a {side==='left'?'western':'eastern'} habitat</Text><ItemStrip items={{crowns:100,timber:20,stone:10}} available={{...state.homebase.resources,crowns:state.player.crowns}}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{GAME_TYPES.filter(type=>!habitat(state,type).side).map(type=><Button key={type} title={type} selected={selectedType===type} onPress={()=>setSelectedType(type)}/>)}</ScrollView>{selectedType?<><View style={{alignItems:'center'}}><HabitatArt type={selectedType} level={1}/></View><Text style={s.muted}>Level 1 adds one breeding assignment place. Upgrades reach three places and use distinct habitat artwork.</Text><Button title={`Build ${selectedType} habitat`} disabled={state.player.crowns<100||(state.homebase.resources.timber??0)<20||(state.homebase.resources.stone??0)<10} onPress={()=>{confirm(`Build ${selectedType} habitat?`,'100 Crowns · 20 timber · 10 stone · 1 day.',{kind:'build-habitat',side,type:selectedType});setSide(null);setSelectedType(null)}}/></>:<Text style={s.muted}>Select a type to preview its level-one habitat.</Text>}<Button title="Close selection" onPress={()=>{setSide(null);setSelectedType(null)}}/></Panel>}
 </>;
}
import { ItemStrip } from './ItemVisuals';
