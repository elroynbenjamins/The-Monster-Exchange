import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { sprites } from './assets';
export const colors = { background: '#0b1721', panel: '#122936', gold: '#d4af59', text: '#f4edda', muted: '#afc4c7', green: '#153d2c' };
export function Button({ title, onPress, disabled = false, selected = false }: { title: string; onPress(): void; disabled?: boolean; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, selected && s.selected, disabled && s.disabled, pressed && s.pressed]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
export function Panel({ children, ...props }: ViewProps) { return <View {...props} style={[s.panel, props.style]}>{children}</View>; }
export function StatusChip({label,tone='neutral'}:{label:string;tone?:'neutral'|'good'|'warn'|'locked'}) {
  const palette={neutral:{backgroundColor:'#183542',borderColor:'#607a7b'},good:{backgroundColor:'#153d2c',borderColor:'#75a978'},warn:{backgroundColor:'#49381d',borderColor:colors.gold},locked:{backgroundColor:'#332733',borderColor:'#866c7f'}}[tone];
  return <View accessibilityLabel={label} style={[s.chip,palette]}><Text style={s.chipText}>{label}</Text></View>;
}
export function Portrait({ speciesId }: { speciesId: string }) {
  return sprites[speciesId] ? <Image accessible={false} source={sprites[speciesId]} style={{ width: 128, height: 128 }} resizeMode="contain" fadeDuration={0} /> : <View style={{ width: 128, height: 80, justifyContent: 'center' }}><Text style={s.muted}>Art pending</Text></View>;
}
// Render only the icon window from the provided atlas; labels stay real, scalable native text.
export function NavIcon({ kind }: { kind: 'map' | 'market' | 'team' | 'dex' }) {
  const x = kind === 'map' ? 281 : kind === 'market' ? 199 : kind === 'dex' ? 447 : 120;
  return <View accessible={false} style={{ width: 48, height: 48, overflow: 'hidden' }}><Image source={require('../assets/pixel/ui/imported-2026-09-02/Monstermarket_UI_Graphics_For_Codex/03_monstermarket_core_ui_hud_atlas.png')} fadeDuration={0} style={{ position: 'absolute', left: -x, top: -371, width: 1448, height: 1086 }} /></View>;
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, lineHeight: 18 },
  subtitle: { color: colors.gold, fontSize: 19, fontWeight: '700' },
  text: { color: colors.text, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  panel: { backgroundColor: colors.panel, borderWidth: 1, borderColor: '#41534e', borderTopColor: '#8a7748', padding: 14, gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  chip: { minHeight: 32, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, justifyContent: 'center' },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  button: { minHeight: 48, minWidth:48, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderBottomWidth:3, borderColor: '#736540', backgroundColor: '#1b3541', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  selected: { backgroundColor: colors.green, borderColor: colors.gold },
  disabled: { opacity: .45 }, pressed: { backgroundColor: '#385445' },
  input: { color: colors.text, backgroundColor: '#091a25', borderColor: '#788c86', borderWidth: 1, minHeight: 48, padding: 12, fontSize: 16 },
  header: { paddingHorizontal: 16, paddingVertical: 10, gap: 4, borderBottomWidth: 2, borderBottomColor: '#826e3c' },
  tabs: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#826e3c', backgroundColor: colors.panel },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, minHeight: 72 },
  modalShade: { flex: 1, backgroundColor: '#000b', justifyContent: 'center', padding: 20 },
});
