import React,{useState} from 'react';
import {Text,View} from 'react-native';
import type {GameState} from '../src/game/state.ts';
import {content} from '../src/content/index.ts';
import {ItemIcon} from './ItemVisuals';
import {Button,s} from './ui';
import type {Confirm} from './screens';
export function EquipmentPanel({state,monsterId,confirm}:{state:GameState;monsterId:string;confirm:Confirm}){
 const [expanded,setExpanded]=useState(false);
 const equipped=state.monsters[monsterId].equipmentIds??[];
 const away=!!state.activeExpedition?.route.teamIds.includes(monsterId);
 return <View style={{gap:8}}><Text style={s.eyebrow}>EQUIPMENT · {equipped.length}/2 SLOTS</Text><View style={s.row}>{[0,1].map(slot=>{const id=equipped[slot];return <View key={slot} style={{minHeight:56,padding:8,borderWidth:1,borderColor:'#6b6145',flex:1}}>{id?<View style={s.row}><ItemIcon id={id}/><Text style={s.muted}>{content.equipment.find(item=>item.id===id)?.name??id}</Text></View>:<Text style={s.muted}>Empty slot</Text>}</View>})}</View><Button title={expanded?'Close equipment':'Manage equipment'} onPress={()=>setExpanded(!expanded)}/>{expanded&&<>{away&&<Text style={s.muted}>This monster is on expedition. Return before changing its gear.</Text>}{content.equipment.map(item=>{
 const wearing=equipped.includes(item.id),count=state.player.inventory[item.id]??0;
 const modifiers=Object.entries(item.statModifiers??{}).map(([stat,n])=>`${n>=0?'+':''}${Math.round(n*100)}% ${stat.toUpperCase()}`);
 if(item.captureBonus)modifiers.push(`+${Math.round(item.captureBonus*100)} percentage points capture chance`);
 if(item.expeditionStaminaModifier)modifiers.push(`${Math.round(item.expeditionStaminaModifier*100)}% expedition stamina use`);
 return <View key={item.id} style={{gap:6,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#34483e'}}><View style={s.row}><ItemIcon id={item.id}/><Text style={s.text}>{item.name}</Text></View><Text style={s.muted}>{modifiers.join(' · ')}{modifiers.length?'\n':''}{item.description}</Text><Text style={s.muted}>{count} in pack{wearing?' · equipped':''}</Text><Button title={wearing?'Remove to pack':equipped.length>=2?'Both slots occupied':count<1?'Not in pack':'Equip'} disabled={away||(!wearing&&(count<1||equipped.length>=2))} onPress={()=>confirm(wearing?'Remove equipment?':'Equip item?',wearing?`${item.name} returns to your pack.`:`Move one ${item.name} from your pack into a slot. ${modifiers.join(' · ')}`,{kind:'equip',monsterId,equipmentIds:wearing?equipped.filter(id=>id!==item.id):[...equipped,item.id]})}/></View>})}</>}</View>;
}
