import React,{useState} from 'react';
import {Text,View} from 'react-native';
import type {GameState} from '../src/game/state.ts';
import {content} from '../src/content/index.ts';
import {AbilityIcon} from './AbilityIcon';
import {Button,StatusChip,s} from './ui';
import type {Confirm} from './screens';

export function SkillLoadout({state,monsterId,confirm}:{state:GameState;monsterId:string;confirm:Confirm}) {
 const [expanded,setExpanded]=useState(false),monster=state.monsters[monsterId],equipped=monster.equippedSkillIds;
 const away=!!state.activeExpedition?.route.teamIds.includes(monsterId);
 const toggle=(id:string)=>{const next=equipped.includes(id)?equipped.filter(skill=>skill!==id):[...equipped,id];confirm('Change skill loadout?',`${next.length?next.map(skill=>content.skills.find(item=>item.id===skill)?.name??skill).join(', '):'No special skills equipped.'}\nYou can equip up to three.`,{kind:'skills',monsterId,skillIds:next})};
 return <View style={{gap:8}}><View style={[s.row,{justifyContent:'space-between'}]}><Text style={s.eyebrow}>BATTLE SKILLS · {equipped.length}/3</Text><Button title={expanded?'Close':'Manage'} onPress={()=>setExpanded(!expanded)}/></View><View style={s.row}>{equipped.map(id=>{const skill=content.skills.find(item=>item.id===id);return <View key={id} style={{alignItems:'center',width:72,gap:3}}><AbilityIcon id={id}/><Text numberOfLines={2} style={[s.muted,{fontSize:11,textAlign:'center'}]}>{skill?.name??id}</Text></View>})}{!equipped.length&&<Text style={s.muted}>No special skills equipped.</Text>}</View>{expanded&&<>{away&&<StatusChip label="Locked during expedition" tone="locked"/>}{monster.knownSkillIds.map(id=>{const skill=content.skills.find(item=>item.id===id);if(!skill)return null;const selected=equipped.includes(id),full=!selected&&equipped.length>=3;return <View key={id} style={{paddingVertical:8,gap:6,borderBottomWidth:1,borderBottomColor:'#34483e'}}><View style={s.row}><AbilityIcon id={id}/><View style={{flex:1}}><Text style={s.text}>{skill.name}</Text><Text style={s.muted}>{skill.type} · Power {skill.power} · Energy {skill.energyCost} · Cooldown {skill.cooldown}</Text></View></View><Button title={selected?'Unequip':full?'Three skills equipped':'Equip skill'} selected={selected} disabled={away||full} onPress={()=>toggle(id)}/></View>})}</>}</View>;
}
