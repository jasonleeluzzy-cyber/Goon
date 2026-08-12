import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpaceField from '../components/SpaceField';
import GButton from '../components/GButton';

export default function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <SpaceField>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Text style={styles.kicker}>A CAMPUS IN THE VOID</Text>
          <Text style={styles.title}>GOONI{`\n`}VERSITY</Text>
          <Text style={styles.sub}>
            Real chats. Real groups. Real time.{`\n`}No email. No phone. Just a name that is yours.
          </Text>
        </View>
        <View style={styles.cards}>
          {[ ['💬', 'Private signals'], ['🪐', 'Crew groups'], ['✨', 'Gooni AI'], ['🌌', 'Chill Out nebula'] ].map(([i, l]) => (
            <View key={l} style={styles.chip}><Text style={styles.chipI}>{i}</Text><Text style={styles.chipT}>{l}</Text></View>
          ))}
        </View>
        <View style={{ padding: 22 }}>
          <GButton title="Enter campus" onPress={onEnter} />
          <Text style={styles.own}>Owned and created by Luzzi</Text>
        </View>
      </SafeAreaView>
    </SpaceField>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  top: { paddingHorizontal: 28, paddingTop: 48 },
  kicker: { color: '#2EE6C7', letterSpacing: 3, fontWeight: '800', fontSize: 12 },
  title: { color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 50, marginTop: 10, letterSpacing: -1 },
  sub: { color: '#C9C0E8', fontSize: 16, lineHeight: 24, marginTop: 16 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 28 },
  chip: { backgroundColor: 'rgba(20,16,48,0.7)', borderColor: 'rgba(139,108,255,0.3)', borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipI: { fontSize: 16 },
  chipT: { color: '#F4F1FF', fontWeight: '700' },
  own: { color: '#8B86A3', textAlign: 'center', marginTop: 14, letterSpacing: 1, fontSize: 12 },
});
