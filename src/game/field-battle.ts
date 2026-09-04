import {content} from '../content/index.ts';
import {SeededRandom} from '../core/random.ts';
import {createBattle,applyBattleAction,chooseAiAction,nextActor,validActions,type BattleState,type BattleAction} from '../systems/battle-engine.ts';
import {pendingCapture} from './field-capture.ts';
import type {GameState} from './state.ts';
import {recordBattleEvolutionProgress} from './evolution-progress.ts';
export type FieldBattleCommand={kind:'field-battle-start'}|{kind:'field-battle-turn';action?:BattleAction};
export function fieldBattle(state:GameState):BattleState|null {const raw=state.world.dynamicState['field:battle'];return typeof raw==='string'&&raw?JSON.parse(raw):null;}
export function applyFieldBattle(state:GameState,command:FieldBattleCommand):GameState{
 const pending=pendingCapture(state),run=state.activeExpedition;
 if(!pending||!run)throw Error('No wild encounter is active.');
 let battle=fieldBattle(state),lastActor='';
 if(command.kind==='field-battle-start'){
  if(battle)throw Error('Battle already started.');
  const id=run.route.teamIds.find(id=>(state.conditions[id]?.hpRatio??0)>0);
  if(!id)throw Error('Your team needs recovery.');
  battle=createBattle([state.monsters[id]],[{...pending.encounter.monster,id:`wild-${pending.encounter.monster.id}`}],content,{[id]:state.conditions[id].hpRatio,[`wild-${pending.encounter.monster.id}`]:pending.hp});
 }else{
  if(!battle||battle.result!=='ongoing')throw Error('No ongoing battle.');
  const actor=nextActor(battle)!;
  const action=actor.side==='enemy'?chooseAiAction(battle,actor.id,content):command.action;
  if(!action||!validActions(battle,actor.id,content).some(a=>JSON.stringify(a)===JSON.stringify(action)))throw Error('Choose a legal battle action.');
  lastActor=actor.side;
  battle=applyBattleAction(battle,action,content,new SeededRandom(state.world.seed+state.world.nextRandomOffset),state.world.day);
 }
 const enemy=battle.units.find(u=>u.side==='enemy')!,conditions={...state.conditions};
 for(const u of battle.units.filter(u=>u.side==='player'))conditions[u.id]={...conditions[u.id],hpRatio:u.hp/u.maxHp};
 const next={...state,conditions,world:{...state.world,nextRandomOffset:state.world.nextRandomOffset+1,dynamicState:{...state.world.dynamicState,'field:lastActor':lastActor,'field:battle':JSON.stringify(battle),'field:pending':JSON.stringify({...pending,hp:enemy.hp/enemy.maxHp}),'field:message':battle.result==='ongoing'?'Choose your next move.':battle.result==='player-victory'?'Wild monster defeated. Leave to continue the expedition.':'Your partner is defeated. Leave and return for recovery.'}}};
 return battle.result!=='ongoing'&&fieldBattle(state)?.result==='ongoing'?recordBattleEvolutionProgress(state,next,battle.result):next;
}
