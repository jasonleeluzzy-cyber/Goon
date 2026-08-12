import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import SpaceField from '../components/SpaceField';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const { width } = Dimensions.get('window');

function Planet({ label, emoji, onPress, x, delay }: { label: string; emoji: string; onPress: () => void; x: number; delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(-10, { duration: 1800 + delay, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[st, { width: (width - 56) / 2 }]}>
      <Pressable onPress={onPress} style={styles.planet}>
        <Text style={{ fontSize: 36 }}>{emoji}</Text>
        <Text style={styles.planetT}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ChillOutScreen() {
  const nav = useNavigation<any>();
  const { token, user } = useAuth();
  const [wish, setWish] = useState('');
  const [wishes, setWishes] = useState<{ id: string; name: string; text: string }[]>([]);
  const [breath, setBreath] = useState('In');
  const scale = useSharedValue(0.85);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    const id = setInterval(() => setBreath((b) => (b === 'In' ? 'Out' : 'In')), 4000);
    return () => clearInterval(id);
  }, []);

  const load = async () => {
    if (!token) return;
    try {
      const d = await api<{ wishes: any[] }>('wishes', { token });
      setWishes(d.wishes || []);
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [token]);

  const sendWish = async () => {
    if (!wish.trim() || !token) return;
    try {
      await api('wish', { method: 'POST', token, body: { text: wish.trim() } });
      setWish('');
      load();
    } catch { /* ignore */ }
  };

  const orb = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <SpaceField>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
          <Text style={styles.kicker}>AFTER HOURS</Text>
          <Text style={styles.title}>Chill Out</Text>
          <Text style={styles.sub}>Deep space lounge · wishes drift between students</Text>
        </View>

        <View style={{ alignItems: 'center', marginVertical: 18 }}>
          <Animated.View style={[styles.breath, orb]} />
          <Text style={styles.breathT}>{breath}</Text>
        </View>

        <View style={styles.grid}>
          <Planet emoji="✨" label="Talk to Gooni" x={0} delay={0} onPress={() => nav.navigate('AIModal')} />
          <Planet emoji="🪩" label="Cosmic Lounge" x={1} delay={200} onPress={() => nav.navigate('Chat', { convId: 'clounge01campus00', title: 'Cosmic Lounge', type: 'group' })} />
          <Planet emoji="🪐" label="Your orbit" x={0} delay={400} onPress={() => nav.navigate('EditProfile')} />
          <Planet emoji="📡" label="Find a signal" x={1} delay={600} onPress={() => nav.navigate('NewChat')} />
        </View>

        <View style={styles.wishBox}>
          <Text style={styles.wishL}>Cast a wish into the nebula</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={wish} onChangeText={setWish} placeholder={`A note from ${user?.displayName || 'you'}…`} placeholderTextColor="#8B86A3" style={styles.wishIn} />
            <Pressable onPress={sendWish} style={styles.cast}><Text style={{ color: '#041014', fontWeight: '900' }}>Cast</Text></Pressable>
          </View>
        </View>

        <FlatList
          data={wishes}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.wish}>
              <Text style={{ color: '#2EE6C7', fontWeight: '800', fontSize: 12 }}>{item.name}</Text>
              <Text style={{ color: '#F4F1FF' }}>{item.text}</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </SpaceField>
  );
}

const styles = StyleSheet.create({
  kicker: { color: '#2EE6C7', letterSpacing: 3, fontWeight: '800', fontSize: 11 },
  title: { color: '#fff', fontSize: 34, fontWeight: '900' },
  sub: { color: '#C9C0E8', marginTop: 4 },
  breath: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(46,230,199,0.18)', borderWidth: 2, borderColor: '#2EE6C7' },
  breathT: { color: '#2EE6C7', marginTop: 8, letterSpacing: 4, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 22 },
  planet: { backgroundColor: 'rgba(16,10,40,0.72)', borderColor: 'rgba(139,108,255,0.35)', borderWidth: 1, borderRadius: 20, padding: 16, alignItems: 'center', gap: 6 },
  planetT: { color: '#fff', fontWeight: '800' },
  wishBox: { margin: 22, marginBottom: 8 },
  wishL: { color: '#A39BC4', marginBottom: 8, fontWeight: '700' },
  wishIn: { flex: 1, backgroundColor: 'rgba(10,8,24,0.7)', borderColor: 'rgba(139,108,255,0.3)', borderWidth: 1, borderRadius: 14, color: '#fff', paddingHorizontal: 12, paddingVertical: 10 },
  cast: { backgroundColor: '#2EE6C7', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center' },
  wish: { backgroundColor: 'rgba(16,10,40,0.65)', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(139,108,255,0.2)' },
});
