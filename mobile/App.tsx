import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Modal, Pressable, ScrollView, StatusBar, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAMPAIGN_KEY, MOBILE_STORY, MobileCampaignStore, createMobileCampaign, newCampaignRecord, restoreCampaign, type MobileCommand } from '../src/game/mobile-campaign.ts';
import { STARTER_SPECIES_IDS } from '../src/game/commands.ts';
import type { GameState } from '../src/game/state.ts';
import { MarketScreen, TeamScreen, speciesName, regionName } from './screens';
import { Button, Panel, colors, s } from './ui';
import { maps } from './assets';
import { CardArt } from './CardArt';
import { MonsterdexScreen } from './MonsterdexScreen';
import { WorldScreen } from './WorldScreen';
import { BaseScreen, QuestScreen } from './ProgressionScreens';
import { ExpeditionScreen } from './ExpeditionScreen';
import { BaseServices } from './BaseServices';
import { NurseryScreen } from './NurseryScreen';
import { ArenaScreen, ContractsScreen, SanctuaryScreen } from './GameplayBoards';

type Page = { tab: 'map'; mapId: string } | { tab: 'market' | 'team' | 'dex' | 'quest' | 'base' | 'expedition' | 'services' | 'nursery' | 'contracts' | 'arena' | 'sanctuary' };
type Question = { title: string; detail: string; command: MobileCommand };
const intro = [
  ['A world of possibilities', 'Every great journey begins with a bond.', 'Across Ardenfall, monsters shape the land and the lives of those who call it home. Some race through the forests. Others sleep beneath stone or follow the gathering storms.', 'continent-ardenfall'],
  ['Your first destination · Greenreach', 'All roads start somewhere.', 'Yours leads to Greenreach: a land of fields, woodland paths, and new beginnings. Beyond its borders lie unfamiliar cities and monsters you have yet to meet.', 'region-greenreach'],
  ['Arrival · Willowmere', 'Welcome to Willowmere.', 'Traders gather at the Exchange, researchers prepare for the field, and challengers make their way to the arena. You arrive with a simple ambition: build a team you believe in.', 'city-willowmere'],
  ['The beginning of your story', 'A partner. A team. A name of your own.', 'Learn what makes each monster different. Discover where it belongs. Decide what kind of manager you want to become. Your first chapter begins in Willowmere.', 'city-willowmere'],
];
function BottomAction({label,icon,selected,alert,onPress}:{label:string;icon:string;selected:boolean;alert?:boolean;onPress():void}) {
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress} style={({pressed})=>({flex:1,minHeight:64,alignItems:'center',justifyContent:'center',paddingHorizontal:3,backgroundColor:selected?'#153d2c':pressed?'#385445':'transparent',borderTopWidth:selected?3:0,borderTopColor:colors.gold})}><View><Text style={{color:selected?colors.gold:colors.text,fontSize:20,textAlign:'center'}}>{icon}</Text>{alert&&<View accessibilityLabel="New activity" style={{position:'absolute',right:-7,top:-2,width:9,height:9,backgroundColor:'#df765f',borderWidth:1,borderColor:'#f4edda'}}/>}</View><Text numberOfLines={1} style={{color:colors.text,fontSize:11,fontWeight:'700'}}>{label}</Text></Pressable>;
}
export default function App() { return <SafeAreaProvider><Game /></SafeAreaProvider>; }
function Game() {
  const { width } = useWindowDimensions();
  const store = useRef<MobileCampaignStore | null>(null);
  const working = useRef(false);
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [name, setName] = useState('');
  const [starter, setStarter] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([{ tab: 'base' }]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [reload, setReload] = useState(0);
  const page = pages[pages.length - 1];
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError('');
    AsyncStorage.getItem(CAMPAIGN_KEY).then(saved => {
      if (cancelled) return;
      if (saved !== null) {
        const restored = restoreCampaign(saved);
        store.current = new MobileCampaignStore(restored.record, restored.state, AsyncStorage);
        setState(restored.state);
        setPages([{ tab: 'base' }]);
      }
    }).catch(() => { if (!cancelled) setLoadError('Your saved game could not be loaded. It has not been replaced. Retry after checking device storage, or keep the save for recovery.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (working.current) return true;
      if (!state && chapter > 0) { setChapter(chapter - 1); return true; }
      if (pages.length > 1) { setPages(previous => previous.slice(0, -1)); return true; }
      return false;
    });
    return () => listener.remove();
  }, [state, chapter, pages.length]);
  const open = (mapId: string) => setPages(previous => {
    const index = previous.findIndex(p=>p.tab==='map'&&p.mapId===mapId);
    return index>=0 ? previous.slice(0,index+1) : [...previous,{tab:'map',mapId}];
  });
  const tab = (target: Page['tab']) => setPages(previous => {
    if(target==='base') return [{tab:'base'}];
    const destination:Page=target==='map'?{tab:'map',mapId:state!.player.location.cityId?`city-${state!.player.location.cityId}`:`region-${state!.player.location.regionId}`}:{tab:target};
    return [{tab:'base'},destination];
  });
  const confirm = (title: string, detail: string, command: MobileCommand) => setQuestion({ title, detail, command });
  async function commit() {
    if (working.current || !question || !store.current) return;
    working.current = true; setBusy(true); setError('');
    try {
      const next = await store.current.dispatch(question.command);
      setState(next); setQuestion(null);
      if (question.command.kind === 'travel') setPages([{tab:'base'},{ tab: 'map', mapId: `city-${next.player.location.cityId}` }]);
    } catch (failure) { setQuestion(null); setError(failure instanceof Error ? failure.message : 'Could not save. Your previous progress is unchanged.'); }
    finally { working.current = false; setBusy(false); }
  }
  async function begin() {
    if (working.current || !starter || !name.trim()) return;
    working.current = true; setBusy(true); setError('');
    try {
      const setup = { name: name.trim(), seed: Date.now() >>> 0, starter };
      const record = newCampaignRecord(setup);
      const initial = createMobileCampaign(setup);
      await AsyncStorage.setItem(CAMPAIGN_KEY, JSON.stringify(record));
      store.current = new MobileCampaignStore(record, initial, AsyncStorage);
      setState(initial);
    } catch { setError('Unable to save your profile. Free some device storage and try again.'); }
    finally { working.current = false; setBusy(false); }
  }
  return <SafeAreaView style={s.screen}><StatusBar barStyle="light-content" />
    {loading ? <View style={s.content}><ActivityIndicator color={colors.gold} /><Text style={s.text}>Loading your journey…</Text></View> : loadError ? <View style={s.content}><Text style={s.text}>{loadError}</Text><Button title="Retry loading" onPress={() => setReload(reload + 1)} /></View> : !state ? <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.subtitle}>THE MONSTER EXCHANGE</Text>
      {chapter < intro.length ? <><Image source={maps[intro[chapter][3]]} style={{ width: '100%', height: 230 }} resizeMode="contain" /><Text style={s.muted}>{intro[chapter][0]} · {chapter + 1}/4</Text><Text style={s.title}>{intro[chapter][1]}</Text><Text style={s.text}>{intro[chapter][2]}</Text><Button title={chapter === 3 ? 'Choose your first partner' : 'Continue story'} onPress={() => setChapter(chapter + 1)} /><Button title="Skip to starter selection" onPress={() => setChapter(4)} /></> : <>
        <Text style={s.title}>Your first partner</Text><Text style={s.text}>Choose one level-5 monster. The other starters become seen in your Monsterdex, allowing you to buy them at the Exchange later.</Text><TextInput value={name} onChangeText={setName} maxLength={40} accessibilityLabel="Manager name" placeholder="Your manager name" placeholderTextColor={colors.muted} style={s.input} />
        <ScrollView horizontal pagingEnabled decelerationRate="fast" snapToInterval={width-32} showsHorizontalScrollIndicator={false} contentContainerStyle={{alignItems:'stretch'}}>{STARTER_SPECIES_IDS.map((id,index) => <View key={id} style={{width:width-32,paddingHorizontal:5}}><Panel style={starter===id?{borderColor:colors.gold,borderWidth:2}:undefined}><Text style={s.eyebrow}>PARTNER {index+1} / {STARTER_SPECIES_IDS.length}</Text><Text style={s.subtitle}>{speciesName(id)}</Text><View style={{ alignItems: 'center' }}><CardArt speciesId={id} width={Math.min(width - 76, 300)} /></View><Button title={starter === id ? '✓ Selected partner' : `Choose ${speciesName(id)}`} selected={starter === id} onPress={() => setStarter(id)} /></Panel></View>)}</ScrollView><Text style={[s.muted,{textAlign:'center'}]}>Swipe cards to compare partners</Text>
        <Text style={s.muted}>Your choice becomes permanent when you begin. Starting funds: 750 Crowns.</Text><Button title="Confirm partner & begin" disabled={!starter || !name.trim() || busy} onPress={begin} />
      </>}
      {chapter > 0 && <Button title="Back" disabled={busy} onPress={() => setChapter(chapter - 1)} />}
    </ScrollView> : <>
      <View style={[s.header,s.row]}>{pages.length>1&&<Button title="‹" disabled={busy} onPress={()=>setPages(previous=>previous.slice(0,-1))}/>}<View style={{flex:1}}><Text style={s.eyebrow}>{state.player.name} · DAY {state.world.day}</Text><Text style={s.muted}>{regionName(state.player.location.regionId)}</Text></View><View><Text style={s.subtitle}>{state.player.crowns} C</Text><Text style={s.muted}>{busy?'Saving…':'Offline save'}</Text></View></View>
      {page.tab === 'map' ? <WorldScreen key={page.mapId} state={state} mapId={page.mapId} open={open} service={tab} confirm={confirm} /> : page.tab === 'market' ? <MarketScreen state={state} confirm={confirm} openStory={()=>tab('quest')} openTeam={()=>tab('team')} /> : page.tab === 'dex' ? <MonsterdexScreen state={state} /> : page.tab==='quest'?<QuestScreen state={state} confirm={confirm}/>:page.tab==='base'?<BaseScreen state={state} confirm={confirm} onOpen={tab}/>:page.tab==='expedition'?<ExpeditionScreen state={state} confirm={confirm}/>:page.tab==='nursery'?<NurseryScreen state={state} confirm={confirm}/>:page.tab==='services'?<ScrollView contentContainerStyle={s.content}><BaseServices state={state} confirm={confirm}/></ScrollView>:page.tab==='contracts'?<ContractsScreen state={state} confirm={confirm}/>:page.tab==='arena'?<ArenaScreen state={state} confirm={confirm}/>:page.tab==='sanctuary'?<SanctuaryScreen state={state} confirm={confirm}/>:<TeamScreen state={state} confirm={confirm} />}
      <View style={s.tabs}><BottomAction label="Home" icon="⌂" selected={page.tab==='base'} onPress={()=>tab('base')}/><BottomAction label="World" icon="◇" selected={page.tab==='map'} onPress={()=>tab('map')}/><BottomAction label="Expedition" icon="⚑" selected={page.tab==='expedition'} alert={!!state.activeExpedition} onPress={()=>tab('expedition')}/><BottomAction label="Story" icon="✦" selected={page.tab==='quest'} alert={!state.world.storyFlags.includes(MOBILE_STORY.firstCapture)} onPress={()=>tab('quest')}/></View>
    </>}
    <Modal visible={!!question || !!error || busy} transparent animationType="none" onRequestClose={() => { if (!working.current) { setQuestion(null); setError(''); } }}>
      <SafeAreaView style={s.modalShade}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}><Panel>
        <Text accessibilityRole="header" style={s.subtitle}>{error ? 'Action not completed' : question?.title ?? 'Saving your journey'}</Text><Text style={s.text}>{error || question?.detail || 'Keep the app open while your profile is saved.'}</Text>
        {busy ? <ActivityIndicator accessibilityLabel="Saving" color={colors.gold} /> : error ? <Button title="Close" onPress={() => setError('')} /> : <><Button title="Confirm" onPress={commit} /><Button title="Cancel" onPress={() => setQuestion(null)} /></>}
      </Panel></ScrollView></SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
