import React from 'react';
import {Text} from 'react-native';
import {pendingCapture} from '../src/game/field-capture.ts';
import {captureChance} from '../src/systems/encounters.ts';
import {activeTeamCaptureBonus} from '../src/game/commands.ts';
import {content} from '../src/content/index.ts';
import type {GameState} from '../src/game/state.ts';
import {Button,Panel,s} from './ui';
import {EncounterBattle} from './EncounterBattle';
import {speciesName,type Confirm} from './screens';
export function FieldCapturePanel({state,confirm}:{state:GameState;confirm:Confirm}){
 const pending=pendingCapture(state),node=state.activeExpedition?.route.nodes[state.activeExpedition.route.currentNode];
 if(!pending&&node?.type!=='encounter')return null;
 return <Panel><Text style={s.subtitle}>Wild encounter</Text><ItemStrip items={{"field-capsule":state.player.inventory["field-capsule"]??0}}/><Text style={s.muted}>{String(state.world.dynamicState['field:message']??'Look for a wild monster before resolving this route node.')}</Text>{pending?<><EncounterBattle state={state} confirm={confirm}/><Text style={s.text}>{speciesName(pending.encounter.species.id)} · level {pending.encounter.monster.level}</Text><Text style={s.muted}>Health {Math.round(pending.hp*100)}% · capture chance {Math.round(captureChance(pending.encounter,pending.hp,activeTeamCaptureBonus(state,content))*100)}% · capsules {state.player.inventory['field-capsule']??0}</Text><Button title="Throw Field Capsule" disabled={(state.player.inventory['field-capsule']??0)<1} onPress={()=>confirm('Attempt capture?','One capsule is consumed whether the attempt succeeds or fails.',{kind:'field-throw'})}/><Button title="Leave monster" onPress={()=>confirm('Leave this monster?','You can continue the route, but cannot search this node again.',{kind:'field-release'})}/></>:<Button title="Search for a wild monster" disabled={state.world.dynamicState['field:lastNode']===node?.id} onPress={()=>confirm('Search this encounter?','Discover a wild species from this zone. You can attempt capture or leave.',{kind:'field-search'})}/>}</Panel>;
}
export function FieldQuest({state,confirm}:{state:GameState;confirm:Confirm}){
 const caught=state.world.storyFlags.includes('STORY_FIELD_CAPTURE'),complete=state.world.storyFlags.includes('STORY_EXPEDITION_COMPLETE'),claimed=state.world.storyFlags.includes('STORY_FIELD_QUEST_CLAIMED');
 return <Panel><Text style={s.subtitle}>Chapter 2 · Beyond the training ground</Text><Text style={s.muted}>Tessa asks you to prove your skills without her help. Use the Expedition Post in your Home to enter the meadow.</Text><Text style={s.text}>{caught?'✓':'○'} Capture a wild monster outside the tutorial</Text><Text style={s.text}>{complete?'✓':'○'} Finish an expedition and return</Text><ItemStrip items={{crowns:150,"field-capsule":3}}/><Button title={claimed?'Reward claimed':'Claim field certificate'} disabled={claimed||!caught||!complete} onPress={()=>confirm('Claim field certificate?','Receive 150 Crowns and 3 capsules once.',{kind:'claim-field-quest'})}/></Panel>;
}
import { ItemStrip } from './ItemVisuals';
