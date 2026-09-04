import React from 'react';
import {Image,Text,View} from 'react-native';
import {ITEM_VISUALS,itemName} from '../src/ui/item-visuals.ts';
import {s,colors} from './ui';
const atlas=require('../assets/pixel/homebase/item-atlas-v1.png');
export function ItemIcon({id,size=40}:{id:string;size?:number}){
 const cell=id==='nursery-egg'?15:ITEM_VISUALS[id]?.cell??12;
 return <View accessible={false} style={{width:size,height:size,overflow:'hidden'}}><Image source={atlas} fadeDuration={0} style={{position:'absolute',width:size*4,height:size*4,left:-(cell%4)*size,top:-Math.floor(cell/4)*size}}/></View>;
}
export function ItemStrip({items,available}:{items:Readonly<Record<string,number>>;available?:Readonly<Record<string,number>>}){
 return <View style={[s.row,{gap:8}]}>{Object.entries(items).map(([id,n])=><View key={id} accessible accessibilityLabel={`${itemName(id)}: ${n}${available?`, available ${available[id]??0}`:''}`} style={{flexDirection:'row',alignItems:'center',gap:5,padding:6,backgroundColor:'#0b202b',borderWidth:1,borderColor:'#34483e'}}><ItemIcon id={id}/><View><Text style={s.muted}>{itemName(id)}</Text><Text style={[s.text,available&&(available[id]??0)<n?{color:'#f2a29b'}:{color:colors.gold}]}>{available?`${available[id]??0} / ${n}`:n}</Text></View></View>)}</View>;
}
export function FacilityIcon({id}:{id:string}){
 const x:Record<string,number>={'breeding-nest':851,'field-clinic':931,'expedition-lodge':1289,'research-lab':1165,'field-workshop':1083};
 return <View accessible={false} style={{width:56,height:56,overflow:'hidden'}}><Image source={require('../assets/pixel/ui/imported-2026-09-02/Monstermarket_UI_Graphics_For_Codex/07_monstermarket_homebase_facility_ui_source_pack.png')} fadeDuration={0} style={{position:'absolute',width:1448,height:1086,left:-(x[id]??1010),top:-103}}/></View>;
}
