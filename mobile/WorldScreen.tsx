import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { mapById, type CityPlaceCapability, type MapHotspotDefinition } from '../src/content/maps.ts';
import { availablePlayerRoutes } from '../src/game/location.ts';
import { routeDestination } from '../src/systems/travel.ts';
import type { GameState } from '../src/game/state.ts';
import { maps } from './assets';
import { Button, Panel, StatusChip, s, colors } from './ui';
import { regionName, type Confirm } from './screens';
import type { HomeDestination } from './HomeBuildings';

const worldPins: Record<string, [number, number]> = {
  frostmarch: [.2955,.205], stormpeak: [.4916,.231], greenreach: [.2333,.440], stonehollow: [.362,.478],
  'iron-dominion': [.519,.539], aurelia: [.394,.707], 'mistwater-coast': [.257,.803], mirefen: [.534,.806],
  dragonspine: [.81,.257], 'crystal-depths': [.732,.444], 'the-deep': [.908,.485], rift: [.803,.785],
};
const serviceFor=(capability?:CityPlaceCapability):HomeDestination|undefined=>capability ? ({government:'contracts',market:'market',arena:'arena','monster-storage':'team',clinic:'services',workshop:'services',research:'services',breeding:'nursery',expedition:'expedition',unique:'sanctuary'} as Partial<Record<CityPlaceCapability,HomeDestination>>)[capability] : undefined;
const targetRegion=(point?:MapHotspotDefinition)=>point?.destinationMapId?.replace('region-','');

export function WorldScreen({state,mapId,open,service,confirm}: {state:GameState;mapId:string;open(id:string):void;service(id:HomeDestination):void;confirm:Confirm}) {
  const map=mapById(mapId), {width:screenWidth}=useWindowDimensions();
  const [selected,setSelected]=useState<string|null>(null), [zoom,setZoom]=useState(1);
  const world=map.level==='continent', points=map.hotspots, active=points.find(point=>point.id===selected)??points[0];
  const access=new Set([...state.world.storyFlags,...state.world.unlockedMapIds]);
  const target=active?.destinationMapId?mapById(active.destinationMapId):undefined;
  const locked=!!target?.unlockId&&!access.has(target.unlockId), source=maps[mapId], natural=Image.resolveAssetSource(source);
  const crop=world?{x:.155,y:.06,w:.835,h:.84}:{x:0,y:0,w:1,h:1}, viewportWidth=Math.max(240,screenWidth-32), viewportHeight=Math.max(280,Math.min(400,screenWidth*.9));
  const canvasWidth=Math.max(viewportWidth,world?620:520)*zoom, imageWidth=canvasWidth/crop.w, imageHeight=imageWidth*natural.height/natural.width, canvasHeight=imageHeight*crop.h;
  const currentCityMap=state.player.location.cityId?`city-${state.player.location.cityId}`:undefined, currentRegionMap=`region-${state.player.location.regionId}`;
  const here=mapId===currentCityMap, viewingCurrentArea=mapId===currentRegionMap||mapId===currentCityMap;
  const routes=useMemo(()=>availablePlayerRoutes(state),[state]);
  const currentPoint=(point:MapHotspotDefinition)=>point.destinationMapId===currentCityMap||targetRegion(point)===state.player.location.regionId;
  const parent=map.parentMapId?mapById(map.parentMapId):undefined, weather=state.world.weatherByRegion[state.player.location.regionId]??'unknown';
  const availablePoints=points.filter(point=>{const destination=point.destinationMapId?mapById(point.destinationMapId):undefined;return !destination?.unlockId||access.has(destination.unlockId)}).length;
  return <ScrollView contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>ATLAS / {map.level.toUpperCase()}</Text><Text accessibilityRole="header" style={s.title}>{map.name}</Text>
    <View style={s.row}>{parent&&<Button title={`← ${parent.name}`} onPress={()=>open(parent.id)}/>}<Button title="Ardenfall" selected={mapId==='continent-ardenfall'} onPress={()=>open('continent-ardenfall')}/><Button title="Veydris" selected={mapId==='continent-veydris'} disabled={!access.has('STORY_VEYDRIS_ACCESS')} onPress={()=>open('continent-veydris')}/></View>
    <Panel><Text style={s.eyebrow}>YOUR LOCATION</Text><Text style={s.text}>{regionName(state.player.location.regionId)}{state.player.location.cityId?` · ${mapById(currentCityMap!).name}`:' · travelling region'}</Text><View style={s.row}><StatusChip label={`Day ${state.world.day}`}/><StatusChip label={state.world.season}/><StatusChip label={weather}/><StatusChip label={`${state.player.crowns} Crowns`} tone="warn"/></View><Button title={viewingCurrentArea?'You are viewing this area':'Locate me'} selected={viewingCurrentArea} onPress={()=>open(currentCityMap??currentRegionMap)}/></Panel>
    <View style={{borderWidth:1,borderColor:colors.gold,backgroundColor:'#06131d'}}>
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}><ScrollView nestedScrollEnabled style={{width:canvasWidth,height:viewportHeight}}><View style={{width:canvasWidth,height:canvasHeight,overflow:'hidden'}}><Image accessible accessibilityLabel={`${map.name} illustrated map`} source={source} fadeDuration={0} style={{position:'absolute',width:imageWidth,height:imageHeight,left:-crop.x*imageWidth,top:-crop.y*imageHeight}}/>
        {points.map((point,index)=>{const position=world?worldPins[point.destinationMapId!.slice(7)]:[point.bounds.x+point.bounds.width/2,point.bounds.y+point.bounds.height/2];if(!position)return null;const destination=point.destinationMapId?mapById(point.destinationMapId):undefined,isLocked=!!destination?.unlockId&&!access.has(destination.unlockId),isCurrent=currentPoint(point),isSelected=active?.id===point.id;return <Pressable key={point.id} accessibilityRole="button" accessibilityLabel={`${point.label}${isCurrent?', current location':''}${isLocked?', locked':''}`} accessibilityState={{selected:isSelected,disabled:isLocked}} onPress={()=>setSelected(point.id)} style={({pressed})=>({position:'absolute',left:(position[0]-crop.x)*imageWidth-24,top:(position[1]-crop.y)*imageHeight-24,width:48,height:48,alignItems:'center',justifyContent:'center',backgroundColor:isLocked?'#332b35ed':pressed||isSelected?'#b38d38':isCurrent?'#175943ed':'#102734ed',borderWidth:isCurrent?3:2,borderColor:isLocked?'#8c788e':isCurrent?'#75d49d':colors.gold})}><Text style={{color:colors.text,fontWeight:'900',fontSize:16}}>{isLocked?'×':isCurrent?'⌂':index+1}</Text></Pressable>})}
      </View></ScrollView></ScrollView>
      <View style={[s.row,{padding:8,justifyContent:'space-between'}]}><Text style={s.muted}>Drag map · {zoom}×</Text><View style={s.row}><Button title="1×" selected={zoom===1} onPress={()=>setZoom(1)}/><Button title="2×" selected={zoom===2} onPress={()=>setZoom(2)}/></View></View>
    </View>
    <View style={s.row}><StatusChip label="⌂ Current" tone="good"/><StatusChip label="Gold: selected" tone="warn"/><StatusChip label="× Story locked" tone="locked"/><StatusChip label={`${availablePoints}/${points.length} open`}/></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{points.map((point,index)=><Button key={point.id} title={`${currentPoint(point)?'⌂ ':''}${index+1} · ${point.label}`} selected={active?.id===point.id} onPress={()=>setSelected(point.id)}/>)}</ScrollView>
    {active&&<Panel><Text style={s.eyebrow}>{active.kind==='city-place'?'CITY FACILITY':'SELECTED DESTINATION'}</Text><Text style={s.subtitle}>{active.label}</Text>{active.capability&&<StatusChip label={active.capability.replace(/-/g,' ')} tone={serviceFor(active.capability)||active.capability==='inn'||active.capability==='transport'?'good':'neutral'}/>} 
      {target?<><Text style={s.muted}>{locked?'Complete the required story chapter to enter.':target.level==='region'?'Open the regional map to inspect its city and routes.':'Open the city map to inspect its facilities.'}</Text><Button title={locked?'Story locked':`Explore ${target.name}`} disabled={locked} onPress={()=>open(target.id)}/></>
      :active.capability==='inn'?<Button title={here?'Rest for one day':'Visit this city before using the inn'} disabled={!here} onPress={()=>confirm('Rest here?','Advance the world and market by one day.',{kind:'rest'})}/>
      :active.capability==='transport'?<><Text style={s.muted}>{here?'Choose a regional departure below.':'Travel to this city before using its terminal.'}</Text><Button title={here?'Departures below':'Not at this terminal'} disabled onPress={()=>{}}/></>
      :active.capability&&serviceFor(active.capability)?<Button title={here?`Enter ${active.label}`:'Visit this city to enter'} disabled={!here} onPress={()=>service(serviceFor(active.capability)!)} />
      :<Text style={s.muted}>This landmark is reserved for a later story or competition update.</Text>}
    </Panel>}
    <Panel><Text style={s.eyebrow}>REGIONAL TRAVEL</Text><Text style={s.subtitle}>Departures from {regionName(state.player.location.regionId)}</Text><Text style={s.muted}>{viewingCurrentArea?'Routes follow the authored borders.':'You are browsing remotely; these routes still start from your current region.'} Travel advances the world, market, recovery and construction.</Text></Panel>
    {routes.length===0&&<Panel><Text style={s.text}>No departures are currently available.</Text><Text style={s.muted}>Continue the story or return to your current region.</Text></Panel>}
    {routes.map(route=>{const destination=regionName(routeDestination(route,state.player.location.regionId)!);const unavailable=!!route.requiredUnlockId&&!access.has(route.requiredUnlockId),poor=state.player.crowns<route.costCrowns;return <Panel key={route.id}><Text style={s.subtitle}>{destination}</Text><View style={s.row}><StatusChip label={route.mode}/><StatusChip label={`${route.durationDays} day${route.durationDays===1?'':'s'}`}/><StatusChip label={`${route.costCrowns} Crowns`} tone={poor?'locked':'warn'}/></View><Button title={unavailable?'Story locked':poor?'Insufficient Crowns':state.activeExpedition?'Return from expedition first':'Review journey →'} disabled={unavailable||poor||!!state.activeExpedition} onPress={()=>confirm('Confirm journey',`${destination} · ${route.costCrowns} Crowns\nTravel takes ${route.durationDays} day(s), advancing markets and recovery.`,{kind:'travel',routeId:route.id})}/></Panel>})}
  </ScrollView>;
}
