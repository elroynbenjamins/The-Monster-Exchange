import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GameState } from '../src/game/state.ts';
import { content } from './displayContent';
import { GAME_TYPES } from '../src/core/types.ts';
import { adjacentMonsterdexEntry, buildMonsterdexEntries, filterMonsterdex, monsterdexEvolutionFamily, monsterdexProgress, sortMonsterdex, type MonsterdexSort, type MonsterdexStatus } from '../src/systems/monsterdex.ts';
import { CardArt } from './CardArt';
import { cards } from './cards';
import { Button, colors, Panel, s } from './ui';

export function MonsterdexScreen({ state }: { state: GameState }) {
  const { width, fontScale } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<MonsterdexStatus | undefined>();
  const [sort, setSort] = useState<MonsterdexSort>('number');
  const [gallery, setGallery] = useState(true);
  const [filters, setFilters] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const detail = useRef<ScrollView>(null);
  const entries = useMemo(() => buildMonsterdexEntries(content.species, state), [state]);
  const visible = useMemo(() => sortMonsterdex(filterMonsterdex(entries, { query, type, status }), sort), [entries, query, type, status, sort]);
  const progress = monsterdexProgress(entries);
  const columns = width < 360 || fontScale > 1.2 ? 1 : 2;
  const tileWidth = (width - 32 - (columns - 1) * 12) / columns;
  const entry = selected === null ? undefined : entries.find(item => item.catalogNumber === selected);
  const revealed = !!entry && (gallery || entry.status !== 'UNKNOWN');
  const select = (number: number) => { setSelected(number); detail.current?.scrollTo({ y: 0, animated: false }); };
  return <>
    <FlatList key={columns} data={visible} numColumns={columns} keyExtractor={item => item.species.id} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} removeClippedSubviews={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12 }} columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      ListHeaderComponent={<View style={{ gap: 12, marginBottom: 4 }}><Text style={s.title}>Monsterdex</Text><Text style={s.muted}>{progress.caught}/{progress.total} caught · {progress.seen} seen</Text>
        <View style={s.row}><Button title="Card gallery" selected={gallery} onPress={() => setGallery(true)} /><Button title="My discoveries" selected={!gallery} onPress={() => setGallery(false)} /></View>
        <Text style={s.muted}>{gallery ? 'View all artwork. Browsing does not unlock species or change your collection.' : 'Unknown monsters stay hidden until discovered.'}</Text>
        <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="Search name or Dex number" placeholderTextColor={colors.muted} accessibilityLabel="Search Monsterdex" />
        <Button title={filters ? 'Hide filters' : 'Types, status & sorting'} onPress={() => setFilters(!filters)} />
        {filters && <Panel><Text style={s.text}>Type</Text><ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={s.row}>{['', ...GAME_TYPES].map(value => <Button key={value} title={value || 'All types'} selected={type === value} onPress={() => setType(value)} />)}</ScrollView><Text style={s.text}>Collection status</Text><View style={s.row}>{[undefined, 'UNKNOWN', 'SEEN', 'CAUGHT'].map(value => <Button key={value ?? 'all'} title={value ?? 'All'} selected={status === value} onPress={() => setStatus(value as MonsterdexStatus | undefined)} />)}</View><View style={s.row}>{(['number','name','rarity','research'] as const).map(value => <Button key={value} title={value} selected={sort === value} onPress={() => setSort(value)} />)}</View><Button title="Clear filters" onPress={() => { setType(''); setStatus(undefined); setQuery(''); setSort('number'); }} /></Panel>}
        <Text accessibilityLiveRegion="polite" style={s.muted}>{visible.length} cards</Text>
      </View>}
      ListEmptyComponent={<Panel><Text style={s.text}>No monsters match these filters.</Text><Button title="Show all" onPress={() => { setQuery(''); setType(''); setStatus(undefined); }} /></Panel>}
      renderItem={({ item }) => {
        const show = gallery || item.status !== 'UNKNOWN';
        return <Pressable onPress={() => select(item.catalogNumber)} accessibilityRole="button" accessibilityLabel={`Number ${item.catalogNumber}, ${show ? item.species.name : 'undiscovered'}, ${item.status}. Open card.`} style={({ pressed }) => ({ width: tileWidth, padding: 8, gap: 6, borderWidth: 2, borderColor: pressed ? colors.text : colors.gold, backgroundColor: colors.panel })}>
          <CardArt speciesId={item.species.id} width={tileWidth - 20} hidden={!show} /><Text style={s.subtitle}>#{String(item.catalogNumber).padStart(3,'0')} {show ? item.species.name : '???'}</Text><Text style={s.muted}>{show ? item.species.types.join(' / ') : 'Not discovered'} · {item.status.toLowerCase()}</Text>
        </Pressable>;
      }} />
    <Modal visible={!!entry} animationType="none" onRequestClose={() => setSelected(null)}>
      <SafeAreaView style={s.screen}><View style={s.header}><Button title="Back to Monsterdex" onPress={() => setSelected(null)} /></View>
        {entry && <ScrollView ref={detail} contentContainerStyle={s.content}><Text style={s.title}>#{String(entry.catalogNumber).padStart(3,'0')} {revealed ? entry.species.name : '???'}</Text>
          <View style={{ alignItems: 'center' }}><CardArt speciesId={entry.species.id} width={Math.min(width - 32, 384)} hidden={!revealed} /></View>
          <Text style={s.muted}>{entry.status.toLowerCase()} · Owned: {entry.ownedCount} · Research: {entry.researchLevel}</Text>
          {revealed && <><Text style={s.subtitle}>{entry.species.types.join(' / ')} · {entry.species.rarity}</Text>{gallery || entry.status === 'CAUGHT' ? <><Text style={s.text}>{entry.species.description}</Text><Text style={s.muted}>Role: {entry.species.battleRole} · Evolution stage {entry.species.evolutionStage}/{entry.species.evolutionLineLength}</Text></> : <Text style={s.muted}>Catch this species to unlock its full discovery entry.</Text>}
            {cards[entry.species.id]?.printedName !== entry.species.name && <Text style={s.muted}>Original artwork label: {cards[entry.species.id]?.printedName}. {entry.species.name} is the current database name.</Text>}
            <Text style={s.subtitle}>Evolution family</Text>{monsterdexEvolutionFamily(entries, entry.catalogNumber).map(relative => <Button key={relative.species.id} title={`#${relative.catalogNumber} ${gallery || relative.status !== 'UNKNOWN' ? relative.species.name : '???'}`} selected={relative.catalogNumber === entry.catalogNumber} onPress={() => select(relative.catalogNumber)} />)}
          </>}
          <View style={s.row}>{([-1,1] as const).map(direction => <Button key={direction} title={direction < 0 ? 'Previous card' : 'Next card'} disabled={!visible.some(item => item.catalogNumber === entry.catalogNumber)} onPress={() => { const next = adjacentMonsterdexEntry(visible, entry.catalogNumber, direction); if (next) select(next.catalogNumber); }} />)}</View>
        </ScrollView>}
      </SafeAreaView>
    </Modal>
  </>;
}
