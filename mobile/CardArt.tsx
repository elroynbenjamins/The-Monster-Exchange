import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { cards } from './cards';
import { cardLayout } from '../src/ui/card-layout.ts';
import { s } from './ui';

export function CardArt({ speciesId, width, hidden = false }: { speciesId: string; width: number; hidden?: boolean }) {
  const frame = cards[speciesId];
  const [failed, setFailed] = useState<string | null>(null);
  const height = width * 1.25;
  const layout = frame && cardLayout(frame.bounds, frame.sheetSize, width, height);
  return <View style={{ width, height, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070e16' }}>
    {hidden ? <Text style={s.subtitle}>Undiscovered</Text> : !layout || failed === speciesId ? <Text style={s.muted}>Card unavailable</Text> : <View style={{ width: layout.width, height: layout.height, overflow: 'hidden' }}>
      <Image key={speciesId} accessible={false} source={frame.source} resizeMode="stretch" resizeMethod="scale" fadeDuration={0} onError={() => setFailed(speciesId)} style={{ position: 'absolute', width: layout.imageWidth, height: layout.imageHeight, left: layout.left, top: layout.top }} />
    </View>}
  </View>;
}
