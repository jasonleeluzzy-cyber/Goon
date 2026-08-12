import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import SpaceField from '../components/SpaceField';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const s = useSharedValue(0.6);
  const o = useSharedValue(0);
  const ring = useSharedValue(0.7);

  useEffect(() => {
    s.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.4)) });
    o.value = withTiming(1, { duration: 700 });
    ring.value = withRepeat(withSequence(withTiming(1.08, { duration: 900 }), withTiming(0.92, { duration: 900 })), -1, true);
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  const logo = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: o.value }));
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }], opacity: 0.55 }));

  return (
    <SpaceField>
      <View style={styles.center}>
        <Animated.View style={[styles.halo, halo]} />
        <Animated.View style={logo}>
          <Text style={styles.g}>G</Text>
        </Animated.View>
        <Animated.Text style={[styles.word, { opacity: o }]}>GOONIVERSITY</Animated.Text>
        <Text style={styles.by}>by Luzzi</Text>
      </View>
    </SpaceField>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 2, borderColor: '#2EE6C7' },
  g: { fontSize: 108, fontWeight: '900', color: '#F4F1FF', textShadowColor: '#8B6CFF', textShadowRadius: 24, letterSpacing: -4 },
  word: { marginTop: 10, fontSize: 22, fontWeight: '800', letterSpacing: 6, color: '#EDE8FF' },
  by: { marginTop: 8, color: '#2EE6C7', letterSpacing: 3, fontSize: 12, fontWeight: '700' },
});
