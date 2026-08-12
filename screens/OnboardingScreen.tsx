import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import GButton from '../components/GButton';
import { storeSet } from '../lib/storage';

const SLIDES = [
  { e: '🛰️', t: 'Find anyone by username', d: 'Search the campus, open a private line, and messages stay after you reboot.' },
  { e: '🪩', t: 'Build a crew', d: 'Create groups, promote admins, invite members, and keep the lounge humming.' },
  { e: '✨', t: 'Talk to Gooni', d: 'A funny space AI that never pretends to be human. History stays in the thread.' },
  { e: '🌌', t: 'Chill Out', d: 'A nebula lounge with wishes, orbits, and slow stars. The campus after hours.' },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { palette: t } = useTheme();
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const next = async () => {
    if (i < SLIDES.length - 1) setI(i + 1);
    else { await storeSet('gv.onboarded', true); onDone(); }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.mid}>
        <Text style={{ fontSize: 72 }}>{s.e}</Text>
        <Text style={[styles.h, { color: t.text }]}>{s.t}</Text>
        <Text style={[styles.d, { color: t.muted }]}>{s.d}</Text>
        <View style={styles.dots}>
          {SLIDES.map((_, n) => <View key={n} style={[styles.dot, { backgroundColor: n === i ? t.accent : t.line }]} />)}
        </View>
      </View>
      <View style={{ padding: 24 }}>
        <GButton title={i === SLIDES.length - 1 ? 'Enter Gooniversity' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mid: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  h: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  d: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
