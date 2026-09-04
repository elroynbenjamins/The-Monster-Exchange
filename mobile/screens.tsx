import {MonsterProgression} from './MonsterProgression';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, View, Pressable, Switch } from 'react-native';
import type { GameState } from '../src/game/state.ts';
import { content } from './displayContent';
import { interactiveMaps, mapById } from '../src/content/maps.ts';
import { availablePlayerRoutes } from '../src/game/location.ts';
import { routeDestination } from '../src/systems/travel.ts';
import { browseMarketListings, listingValueLabel } from '../src/systems/transactions.ts';
import { appraiseMonster } from '../src/systems/market.ts';
import type { MobileCommand } from '../src/game/mobile-campaign.ts';
import { maps } from './assets';
import { Button, Panel, Portrait, StatusChip, colors, s } from './ui';
import { CardArt } from './CardArt';
import { EquipmentPanel } from './EquipmentPanel';
import { SkillLoadout } from './SkillLoadout';
import { MarketBoard } from './MarketBoard';
import { MOBILE_STORY } from '../src/game/mobile-campaign.ts';
import { STARTER_SPECIES_IDS } from '../src/game/commands.ts';
import { evaluateTeamSynergies } from '../src/systems/team-effects.ts';
export type Confirm = (title: string, detail: string, command: MobileCommand) => void;
export const speciesName = (id: string) => content.species.find(item => item.id === id)?.name ?? id;
export const regionName = (id: string) => mapById(`region-${id}`).name;

export function MapScreen({ state, mapId, open, exchange, confirm }: { state: GameState; mapId: string; open(id: string): void; exchange(): void; confirm: Confirm }) {
  const map = mapById(mapId);
  const access = new Set([...state.world.unlockedMapIds, ...state.world.storyFlags]);
  const atCity = map.id === `city-${state.player.location.cityId}`;
  const source = maps[map.id];
  const imageSize = source ? Image.resolveAssetSource(source) : undefined;
  return <ScrollView contentContainerStyle={s.content}>
    <Text style={s.title}>{map.name}</Text>
    <Text style={s.muted}>You are in {regionName(state.player.location.regionId)}. Viewing a map does not move your team.</Text>
    <View style={s.row}><Button title="World" onPress={() => open('continent-ardenfall')} /><Button title="My location" onPress={() => open(`city-${state.player.location.cityId}`)} /></View>
    {map.parentMapId && <Button title={`Up to ${mapById(map.parentMapId).name}`} onPress={() => open(map.parentMapId!)} />}
    {map.level === 'continent' && <View style={s.row}>{interactiveMaps.filter(item => item.level === 'continent').map(item => <Button key={item.id} title={item.unlockId && !access.has(item.unlockId) ? `${item.name} · locked` : item.name} selected={item.id === map.id} disabled={!!item.unlockId && !access.has(item.unlockId)} onPress={() => open(item.id)} />)}</View>}
    {source && <Image source={source} accessibilityLabel={`${map.name} map`} resizeMode="contain" style={{ width: '100%', aspectRatio: imageSize!.width / imageSize!.height }} />}
    <Text style={s.subtitle}>Destinations & services</Text>
    {map.hotspots.map(hotspot => {
      const target = hotspot.destinationMapId && interactiveMaps.find(item => item.id === hotspot.destinationMapId);
      const locked = target && target.unlockId && !access.has(target.unlockId);
      return <Panel key={hotspot.id}><Text style={s.text}>{hotspot.label}</Text>
        {target ? <Button title={locked ? 'Story locked' : 'View map'} disabled={!!locked} onPress={() => open(target.id)} /> : hotspot.capability === 'market' ? <Button title={atCity ? 'Enter Exchange' : 'Travel here to visit'} disabled={!atCity} onPress={exchange} /> : <Text style={s.muted}>{hotspot.capability === 'transport' ? 'Use the travel routes below.' : 'This facility is not connected in the native build yet.'}</Text>}
      </Panel>;
    })}
    <Text style={s.subtitle}>Travel from {regionName(state.player.location.regionId)}</Text>
    <Text style={s.muted}>Routes follow the authored world connections. Confirming travel also advances markets and recovery.</Text>
    {availablePlayerRoutes(state).map(route => {
      const destination = regionName(routeDestination(route, state.player.location.regionId)!);
      const locked = !!route.requiredUnlockId && !access.has(route.requiredUnlockId);
      const poor = state.player.crowns < route.costCrowns;
      return <Panel key={route.id}><Text style={s.text}>{destination} · {route.mode}</Text><Text style={s.muted}>{route.costCrowns} Crowns · {route.durationDays} day(s)</Text><Button disabled={locked || poor} title={locked ? 'Story locked' : poor ? 'Not enough Crowns' : `Travel to ${destination}`} onPress={() => confirm('Confirm journey', `${destination}\n${route.costCrowns} Crowns · ${route.durationDays} day(s)\nArrive in the regional city. World time and the market advance.`, { kind: 'travel', routeId: route.id })} /></Panel>;
    })}
  </ScrollView>;
}

export function MarketScreen({ state, confirm, openStory, openTeam }: { state: GameState; confirm: Confirm; openStory():void; openTeam():void }) {
  const [query, setQuery] = useState('');
  const [affordable, setAffordable] = useState(false);
  const [sort, setSort] = useState<'price' | 'level' | 'potential'>('price');
  const [mine, setMine] = useState(false);
  const unlocked=state.world.storyFlags.includes(MOBILE_STORY.market);
  const starters=state.world.storyFlags.includes(MOBILE_STORY.starters);
  const publicListings = browseMarketListings(state, { affordableOnly: affordable, sortBy: sort }).filter(item => (starters||!STARTER_SPECIES_IDS.includes(item.monster.speciesId as typeof STARTER_SPECIES_IDS[number]))&&speciesName(item.monster.speciesId).toLowerCase().includes(query.toLowerCase().trim()));
  const own = state.market.listings.filter(item => item.sellerId === state.player.id);
  const atExchange=!!state.player.location.cityId;
  const visible=mine?own:publicListings,filtersActive=!!query.trim()||affordable||sort!=='price';
  if(!unlocked) return <ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>WILLOWMERE EXCHANGE</Text><Text style={s.title}>Trading permit required</Text><Panel><Text style={s.subtitle}>The shutters are closed</Text><Text style={s.text}>Complete Tessa’s first field lesson and catch your first wild monster. The Exchange opens after you prove you can care for a team.</Text><Text style={s.muted}>Starter species are not sold during the opening chapter.</Text><Button title="Open story objective" onPress={openStory}/></Panel></ScrollView>;
  return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>MARKET / MONSTER EXCHANGE</Text><Text style={s.title}>Trade. Collect. Grow.</Text>
    <MarketBoard state={state}/>
    <Panel><Text style={s.eyebrow}>TRADING STATUS</Text><View style={s.row}><StatusChip label={atExchange?`Open in ${state.player.location.cityId}`:'Browsing remotely'} tone={atExchange?'good':'warn'}/><StatusChip label={`${state.player.crowns} Crowns`} tone="warn"/><StatusChip label={`Day ${state.world.day}`}/></View>{!atExchange&&<Text style={s.muted}>You may inspect prices from anywhere, but buying, selling and cancelling require visiting a city Exchange.</Text>}</Panel>
    <View style={s.row}><Button title="Buy monsters" selected={!mine} onPress={() => setMine(false)} /><Button title={`My listings (${own.length})`} selected={mine} onPress={() => setMine(true)} /></View>
    {!mine && <><TextInput accessibilityLabel="Search monsters" placeholder="Search monsters…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={s.input} /><View style={s.row}><Switch accessibilityLabel="Affordable only" value={affordable} onValueChange={setAffordable} /><Text style={s.text}>Affordable only</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{([['price','Lowest price'],['level','Highest level'],['potential','Best potential']] as const).map(([option,label]) => <Button key={option} title={label} selected={sort === option} onPress={() => setSort(option)} />)}</ScrollView><View style={[s.row,{justifyContent:'space-between'}]}><Text style={s.muted}>{visible.length} matching offer{visible.length===1?'':'s'}</Text>{filtersActive&&<Button title="Clear filters" onPress={()=>{setQuery('');setAffordable(false);setSort('price')}}/>}</View></>}
    {visible.length === 0 && <Panel><Text style={s.text}>{mine ? 'No active listings.' : 'No offers match these filters.'}</Text><Text style={s.muted}>{mine?'Choose a monster from your roster to create an offer.':'Clear the filters or advance one day to refresh market activity.'}</Text>{mine&&<Button title="Open my roster" onPress={openTeam}/>}</Panel>}
    {visible.map(listing => {
      const species = content.species.find(item => item.id === listing.monster.speciesId)!;
      const appraisal = appraiseMonster(listing.monster, species, content.traits, state.market.indices[species.id]);
      const unseen = !['SEEN', 'CAUGHT'].includes(state.player.discoveryBySpecies[species.id] ?? 'UNKNOWN');
      const poor = state.player.crowns < listing.askingPrice;
      const value=listingValueLabel(listing.askingPrice,appraisal),daysLeft=Math.max(0,listing.expiresOnDay-state.world.day);
      return <Panel key={listing.id}><View style={s.row}><CardArt speciesId={species.id} width={132} /><View style={{ flex: 1, minWidth: 130 }}><Text style={s.subtitle}>{species.name}</Text><Text style={s.muted}>{species.types.join(' / ')} · {species.rarity}</Text><Text style={s.text}>Lv. {listing.monster.level} · Potential {listing.monster.potential}</Text></View></View>
        <View style={s.row}><StatusChip label={`${listing.askingPrice} Crowns`} tone="warn"/><StatusChip label={value} tone={listing.askingPrice<=appraisal?'good':'neutral'}/><StatusChip label={`${daysLeft} day${daysLeft===1?'':'s'} left`} tone={daysLeft<=1?'warn':'neutral'}/></View><Text style={s.muted}>Appraisal {appraisal} Crowns · Seller: {mine ? 'You' : listing.sellerId}{!mine&&!poor?`\nBalance after purchase: ${state.player.crowns-listing.askingPrice} Crowns`:''}</Text>
        <Button title={!atExchange?'Visit a city Exchange':mine?'Cancel listing':unseen?'Discover this species first':poor?'Not enough Crowns':'Review purchase'} disabled={!atExchange||(!mine&&(unseen||poor))} onPress={() => mine ? confirm('Cancel listing?', `${species.name} returns to your roster. No Crowns are awarded.`, { kind: 'cancel', listingId: listing.id }) : confirm(`Buy ${species.name}?`, `${listing.askingPrice} Crowns\nBalance after purchase: ${state.player.crowns - listing.askingPrice}\nThe monster joins your roster, not your active team automatically.`, { kind: 'buy', listingId: listing.id })} />
      </Panel>;
    })}
    <Button title={state.activeExpedition?'Return from expedition to rest':'Rest 1 day · refresh market'} disabled={!!state.activeExpedition} onPress={() => confirm('Advance one day?', 'Existing listings may sell or expire. New NPC stock arrives, and your monsters recover. This is not a free stock reroll.', { kind: 'rest' })} />
  </ScrollView>;
}

function MonsterDetail({state,monsterId,confirm}:{state:GameState;monsterId:string;confirm:Confirm}) {
  const monster=state.monsters[monsterId],species=content.species.find(item=>item.id===monster.speciesId)!,condition=state.conditions[monsterId]??{hpRatio:1,stamina:100};
  const [nickname,setNickname]=useState(monster.nickname??''),[priceText,setPriceText]=useState('');
  const activeIndex=state.player.activeTeamIds.indexOf(monsterId),active=activeIndex>=0,price=Number(priceText),away=!!state.activeExpedition?.route.teamIds.includes(monsterId),breeding=state.breedingJobs.some(job=>job.parentIds.includes(monsterId));
  const passive=content.passives.find(item=>item.id===species.passiveId),traits=monster.traitIds.map(id=>content.traits.find(item=>item.id===id)?.name??id);
  const marketReady=state.world.storyFlags.includes(MOBILE_STORY.market)&&!!state.player.location.cityId;
  const move=(offset:number)=>{const next=[...state.player.activeTeamIds],target=activeIndex+offset;if(target<0||target>=next.length)return;[next[activeIndex],next[target]]=[next[target]!,next[activeIndex]!];confirm('Reorder active team?',`${monster.nickname??species.name} moves to slot ${target+1}.`,{kind:'team',monsterIds:next})};
  return <Panel><View style={s.row}><Portrait speciesId={species.id}/><View style={{flex:1,minWidth:130}}><Text style={s.subtitle}>{monster.nickname??species.name}</Text>{monster.nickname&&<Text style={s.muted}>{species.name}</Text>}<View style={s.row}><StatusChip label={`Lv ${monster.level}`}/><StatusChip label={`${monster.potential} potential`} tone="warn"/><StatusChip label={active?`Team slot ${activeIndex+1}`:'Reserve'} tone={active?'good':'neutral'}/></View></View></View>
    <Text style={s.eyebrow}>CONDITION</Text><View accessibilityLabel={`${Math.round(condition.hpRatio*100)} percent health`} style={{height:9,backgroundColor:'#402c32'}}><View style={{height:9,width:`${condition.hpRatio*100}%`,backgroundColor:condition.hpRatio>.25?'#71ba87':'#e79b6a'}}/></View><Text style={s.muted}>Health {Math.round(condition.hpRatio*100)}% · Stamina {condition.stamina}/100</Text>
    <View style={s.row}><StatusChip label={species.types.join(' / ')}/><StatusChip label={species.battleRole}/><StatusChip label={`${monster.wins}W · ${monster.losses}L`}/>{away&&<StatusChip label="On expedition" tone="locked"/>}{breeding&&<StatusChip label="Nursery parent" tone="warn"/>}</View>
    <Text style={s.eyebrow}>IDENTITY</Text><Text style={s.muted}>Passive: {passive?.name??species.passiveId}{passive?.effectText?` · ${passive.effectText}`:''}\nTraits: {traits.join(', ')||'None'} · Fame {monster.fame}</Text>
    <TextInput style={s.input} accessibilityLabel={`Nickname for ${species.name}`} placeholder={species.name} placeholderTextColor={colors.muted} maxLength={24} value={nickname} onChangeText={setNickname}/><View style={s.row}><Button title="Save nickname" disabled={nickname.trim()===(monster.nickname??'')} onPress={()=>confirm('Save nickname?',nickname.trim()?`${species.name} will be known as ${nickname.trim()}.`:`Restore the species name ${species.name}.`,{kind:'rename',monsterId,nickname})}/>{monster.nickname&&<Button title="Reset name" onPress={()=>confirm('Reset nickname?',`Restore ${species.name} as this monster’s display name.`,{kind:'rename',monsterId,nickname:''})}/>}</View>
    <Text style={s.eyebrow}>ACTIVE TEAM</Text><View style={s.row}><Button title={active?'Remove':'Add to team'} disabled={away||(active?state.player.activeTeamIds.length===1:state.player.activeTeamIds.length>=5)} onPress={()=>confirm('Update active team?',monster.nickname??species.name,{kind:'team',monsterIds:active?state.player.activeTeamIds.filter(id=>id!==monsterId):[...state.player.activeTeamIds,monsterId]})}/>{active&&<Button title="Move earlier" disabled={activeIndex===0||away} onPress={()=>move(-1)}/>} {active&&<Button title="Move later" disabled={activeIndex===state.player.activeTeamIds.length-1||away} onPress={()=>move(1)}/>}</View>
    <SkillLoadout state={state} monsterId={monsterId} confirm={confirm}/><EquipmentPanel state={state} monsterId={monsterId} confirm={confirm}/><MonsterProgression state={state} monsterId={monsterId} confirm={confirm}/>
    <Text style={s.eyebrow}>EXCHANGE LISTING</Text>{!marketReady&&<Text style={s.muted}>Complete the trading lesson and visit a city Exchange before listing.</Text>}<TextInput style={s.input} accessibilityLabel={`Listing price for ${species.name}`} placeholder="Asking price in Crowns" placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={9} value={priceText} onChangeText={value=>setPriceText(value.replace(/[^0-9]/g,''))}/><Button title="Review 3-day listing" disabled={!marketReady||away||breeding||state.player.monsterIds.length<=1||!Number.isSafeInteger(price)||price<=0} onPress={()=>confirm('List this monster?',`${monster.nickname??species.name} · ${price} Crowns · 3 days\nRemoved from your roster and active team until sold, cancelled, or expired.`,{kind:'list',monsterId,price})}/>
  </Panel>;
}

export function TeamScreen({ state, confirm }: { state: GameState; confirm: Confirm }) {
  const [query,setQuery]=useState(''),[filter,setFilter]=useState<'all'|'active'|'recovery'>('all'),[chosen,setChosen]=useState(state.player.monsterIds[0]??'');
  const ids=state.player.monsterIds.filter(id=>{const monster=state.monsters[id],name=(monster.nickname??speciesName(monster.speciesId)).toLowerCase();return name.includes(query.trim().toLowerCase())&&(filter==='all'||filter==='active'&&state.player.activeTeamIds.includes(id)||filter==='recovery'&&(state.conditions[id]?.hpRatio??1)<1)});
  const selected=ids.includes(chosen)?chosen:ids[0];
  const effects=evaluateTeamSynergies(state.player.activeTeamIds.map(id=>state.monsters[id]).filter(Boolean),content.species,content.synergies);
  return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.eyebrow}>MONSTER YARD / ROSTER</Text><Text accessibilityRole="header" style={s.title}>My team</Text><Panel><View style={s.row}><StatusChip label={`${state.player.activeTeamIds.length}/5 active`} tone="good"/><StatusChip label={`${state.player.monsterIds.length} owned`}/><StatusChip label={`${effects.synergyIds.length} synergies`} tone={effects.synergyIds.length?'warn':'neutral'}/></View>{effects.synergyIds.map(id=><Text key={id} style={s.muted}>{content.synergies.find(item=>item.id===id)?.name}: {content.synergies.find(item=>item.id===id)?.displayText}</Text>)}{!effects.synergyIds.length&&<Text style={s.muted}>Combine compatible types and tags in the first three team slots to activate battle synergies.</Text>}</Panel>
    <TextInput accessibilityLabel="Search roster" placeholder="Search names…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={s.input}/><View style={s.row}>{(['all','active','recovery'] as const).map(option=><Button key={option} title={option==='recovery'?'Needs care':option} selected={filter===option} onPress={()=>setFilter(option)}/>)}</View><Text style={s.muted}>{ids.length} monster{ids.length===1?'':'s'} shown</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{ids.map(id=>{const monster=state.monsters[id],isActive=state.player.activeTeamIds.includes(id);return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Open ${monster.nickname??speciesName(monster.speciesId)}`} accessibilityState={{selected:selected===id}} onPress={()=>setChosen(id)} style={{width:150,minHeight:190,padding:8,alignItems:'center',backgroundColor:selected===id?'#153d2c':'#122936',borderWidth:selected===id?2:1,borderColor:selected===id?colors.gold:'#41534e'}}><Portrait speciesId={monster.speciesId}/><Text numberOfLines={1} style={s.text}>{monster.nickname??speciesName(monster.speciesId)}</Text><Text style={s.muted}>{isActive?`Team ${state.player.activeTeamIds.indexOf(id)+1}`:'Reserve'} · Lv {monster.level}</Text></Pressable>})}</ScrollView>
    {!selected?<Panel><Text style={s.text}>No monsters match this filter.</Text><Button title="Show full roster" onPress={()=>{setQuery('');setFilter('all')}}/></Panel>:<MonsterDetail key={selected} state={state} monsterId={selected} confirm={confirm}/>}</ScrollView>;
}
