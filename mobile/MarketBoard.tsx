import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { GameState } from '../src/game/state.ts';
import { Panel, NavIcon, StatusChip, s, colors } from './ui';
import { content } from './displayContent';
import { MOBILE_STORY } from '../src/game/mobile-campaign.ts';
import { STARTER_SPECIES_IDS } from '../src/game/commands.ts';
const speciesName = (id:string) => content.species.find(species=>species.id===id)?.name ?? id;

export function MarketBoard({state}: {state:GameState}) {
  const starterTrading=state.world.storyFlags.includes(MOBILE_STORY.starters);
  const offers = state.market.listings.filter(l=>l.sellerId!==state.player.id&&l.expiresOnDay>state.world.day&&(starterTrading||!STARTER_SPECIES_IDS.includes(l.monster.speciesId as typeof STARTER_SPECIES_IDS[number])));
  const quotes = [...new Set(offers.map(l=>l.monster.speciesId))].map(id=>{
    const prices=offers.filter(l=>l.monster.speciesId===id).map(l=>l.askingPrice),index=state.market.indices[id];
    const floor=Math.min(...prices),ceiling=Math.max(...prices),average=Math.round(prices.reduce((sum,price)=>sum+price,0)/prices.length),pressure=index?index.demand/Math.max(1,index.supply):1;
    return {id,floor,ceiling,average,count:prices.length,pressure};
  }).sort((a,b)=>a.floor-b.floor);
  const ceiling = Math.max(1,...quotes.map(q=>q.floor));
  return <>
    <Panel style={{borderTopWidth:3,borderTopColor:colors.gold}}>
      <View style={s.row}><NavIcon kind="market"/><View style={{flex:1}}><Text style={s.eyebrow}>EXCHANGE BOARD · DAY {state.world.day}</Text><Text style={s.subtitle}>The trading floor</Text></View></View>
      <View style={[s.row,{justifyContent:'space-between'}]}><View><Text style={s.title}>{offers.length}</Text><Text style={s.muted}>Open offers</Text></View><View><Text style={s.title}>{quotes.length}</Text><Text style={s.muted}>Species listed</Text></View><View><Text style={s.subtitle}>{state.player.crowns}</Text><Text style={s.muted}>Your Crowns</Text></View></View>
    </Panel>
    <Text style={s.eyebrow}>PRICE TICKER / LOWEST ACTIVE ASK</Text>
    <ScrollView horizontal contentContainerStyle={{gap:8}} showsHorizontalScrollIndicator={false}>{quotes.map(q=><Panel key={q.id} style={{minWidth:170,borderLeftColor:q.pressure>1.1?'#d4af59':q.pressure<.9?'#72c7ae':'#607a7b',borderLeftWidth:3}}><Text style={s.text}>{speciesName(q.id)}</Text><Text style={s.subtitle}>{q.floor} C</Text><View style={s.row}><StatusChip label={q.pressure>1.1?'↑ High demand':q.pressure<.9?'↓ Buyer market':'→ Balanced'} tone={q.pressure>1.1?'warn':q.pressure<.9?'good':'neutral'}/><StatusChip label={`${q.count} offer${q.count===1?'':'s'}`}/></View><Text style={s.muted}>Average {q.average} C{q.ceiling!==q.floor?` · High ${q.ceiling} C`:''}</Text></Panel>)}</ScrollView>
    <Panel><Text style={s.subtitle}>Floor-price comparison</Text><Text style={s.muted}>Lowest asking price per species · Crowns</Text>{quotes.slice(0,6).map(q=><View key={q.id} accessible accessibilityLabel={`${speciesName(q.id)}, ${q.floor} Crowns`} style={{gap:4}}><View style={[s.row,{justifyContent:'space-between'}]}><Text style={s.muted}>{speciesName(q.id)}</Text><Text style={s.text}>{q.floor}</Text></View><View style={{height:6,backgroundColor:'#071923'}}><View style={{height:6,width:`${Math.max(1,q.floor/ceiling*100)}%`,backgroundColor:'#72c7ae'}}/></View></View>)}{!quotes.length&&<Text style={s.muted}>No active public offers.</Text>}<Text style={s.muted}>Offline market. Quotes update after game actions, not in real time. Asking prices are not completed sales.</Text></Panel>
  </>;
}
