import React,{useEffect,useRef,useState} from 'react';
import {Animated,Text,View} from 'react-native';
import {fieldBattle} from '../src/game/field-battle.ts';
import {nextActor,validActions} from '../src/systems/battle-engine.ts';
import {content} from '../src/content/index.ts';
import type {GameState} from '../src/game/state.ts';
import {battlePoses} from './battlePoses';
import {CardArt} from './CardArt';
import {Button,s} from './ui';
import {AbilityIcon} from './AbilityIcon';
import {speciesName,type Confirm} from './screens';
function Fighter({id,player,hp,tick,acting}:{id:string;player:boolean;hp:number;tick:number;acting:boolean}){
 const [pose,setPose]=useState<'idle'|'attack'|'hit'|'defeated'>('idle');
 const previous=useRef(hp),motion=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const hurt=hp<previous.current;previous.current=hp;setPose(hp<=0?'defeated':hurt?'hit':acting?'attack':'idle');const animation=Animated.sequence([Animated.timing(motion,{toValue:acting?12:hurt?-5:0,duration:160,useNativeDriver:true}),Animated.timing(motion,{toValue:0,duration:220,useNativeDriver:true})]);animation.start();const timer=setTimeout(()=>setPose(hp<=0?'defeated':'idle'),420);return()=>{clearTimeout(timer);animation.stop();};},[hp,tick,acting,motion]);
 return <Animated.View style={{transform:[{translateX:motion}],opacity:hp<=0?.5:1}}>{battlePoses[id]?<Animated.Image source={battlePoses[id][pose]} fadeDuration={0} resizeMode="contain" style={{width:144,height:144,transform:[{scaleX:player?-1:1}]}}/>:<CardArt speciesId={id} width={112}/>}</Animated.View>;
}
export function EncounterBattle({state,confirm}:{state:GameState;confirm:Confirm}){
 const battle=fieldBattle(state);
 if(!battle)return <Button title="Fight · enter battle" onPress={()=>confirm('Face this wild monster?','Your first healthy expedition partner enters a one-on-one battle. Damage persists. Defeated wild monsters cannot be captured.',{kind:'field-battle-start'})}/>;
 const actor=nextActor(battle),player=battle.units.find(u=>u.side==='player')!,enemy=battle.units.find(u=>u.side==='enemy')!;
 const health=(u:typeof player)=><View style={{padding:8,backgroundColor:'#102731',borderWidth:1,borderColor:'#716343'}}><Text style={s.text}>{speciesName(u.species.id)} · Lv {u.monster.level}</Text><View style={{height:8,backgroundColor:'#402c32'}}><View style={{height:8,width:`${100*u.hp/u.maxHp}%`,backgroundColor:u.hp/u.maxHp>.25?'#71ba87':'#e79b6a'}}/></View><Text style={s.muted}>HP {u.hp}/{u.maxHp} · Energy {u.energy}/{u.maxEnergy}</Text><View style={s.row}><AbilityIcon id="passive" size={28}/><Text style={[s.muted,{flex:1}]}>{content.passives.find(p=>p.id===u.species.passiveId)?.name}</Text></View>{u.shield>0&&<View style={s.row}><AbilityIcon id="shield" size={28}/><Text style={s.muted}>Shield {u.shield}</Text></View>}{u.statuses.map(x=><View key={x.id} style={s.row}><AbilityIcon id={x.id} size={28}/><Text style={s.muted}>{content.statuses.find(s=>s.id===x.id)?.name??x.id} · {x.remainingActions} turns</Text></View>)}</View>;
 return <View style={{gap:10}}><View accessibilityLabel="Wild opponent above right; your partner below left" style={{backgroundColor:'#173b38',padding:8,gap:4,borderWidth:1,borderColor:'#52614c'}}>{health(enemy)}<View style={{alignItems:'flex-end'}}><Fighter id={enemy.species.id} player={false} hp={enemy.hp} tick={battle.tick} acting={state.world.dynamicState['field:lastActor']==='enemy'}/></View><View style={{alignItems:'flex-start',marginTop:-40}}><Fighter id={player.species.id} player hp={player.hp} tick={battle.tick} acting={state.world.dynamicState['field:lastActor']==='player'}/></View>{health(player)}</View><Text accessibilityLiveRegion="polite" style={s.text}>{battle.result==='ongoing'?`${actor?.side==='player'?'Your':'Opponent’s'} turn`:battle.result==='player-victory'?'Wild monster defeated':'Your partner was defeated'}</Text>{battle.result==='ongoing'&&(actor?.side==='enemy'?<Button title="Continue · opponent turn" onPress={()=>confirm('Opponent turn','Resolve the opponent’s move.',{kind:'field-battle-turn'})}/>:validActions(battle,actor!.id,content).filter(a=>a.kind!=='switch').map((action,i)=><View key={i} style={{flexDirection:'row',alignItems:'center',gap:8}}><AbilityIcon id={action.kind==='skill'?action.skillId:action.kind==='wait'?'recovery':'type-normal-basic'}/><View style={{flex:1}}><Button title={action.kind==='basic'?'Fight · basic attack':action.kind==='wait'?'Recover Energy':action.kind==='skill'?content.skills.find(s=>s.id===action.skillId)!.name:'Switch'} onPress={()=>confirm('Use this move?','Resolve one combat action and save the result.',{kind:'field-battle-turn',action})}/></View></View>))}</View>;
}
