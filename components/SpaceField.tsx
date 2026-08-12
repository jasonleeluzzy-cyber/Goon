import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

function Star({ x, y, s, d }: { x: number; y: number; s: number; d: number }) {
  const o = useSharedValue(0.2);
  useEffect(() => {
    o.value = withDelay(d, withRepeat(withTiming(1, { duration: 1400 + d, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[st, { position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, backgroundColor: '#EDE8FF' }]} />;
}

function Particle({ i }: { i: number }) {
  const y = useSharedValue(-20 - (i % 7) * 40);
  const x = ((i * 97) % width);
  useEffect(() => {
    y.value = withDelay(i * 180, withRepeat(withTiming(height + 40, { duration: 9000 + i * 220, easing: Easing.linear }), -1, false));
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[st, {
      position: 'absolute', left: x, width: 2, height: 10, borderRadius: 2,
      backgroundColor: i % 3 === 0 ? '#2EE6C7' : i % 3 === 1 ? '#8B6CFF' : '#FF5BA8',
      opacity: 0.55,
    }]} />
  );
}

export default function SpaceField({ children, compact }: { children?: React.ReactNode; compact?: boolean }) {
  const stars = useMemo(() => Array.from({ length: compact ? 28 : 56 }).map((_, i) => ({
    x: (i * 73 + 17) % width,
    y: (i * 131 + 9) % (compact ? 280 : height),
    s: i % 7 === 0 ? 2.6 : 1.4,
    d: (i * 90) % 1600,
  })), [compact]);

  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const neb = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 30 - 15 }, { translateY: drift.value * 18 - 9 }],
    opacity: 0.55 + drift.value * 0.2,
  }));

  return (
    <View style={[styles.root, compact && { minHeight: 220 }]}>
      <LinearGradient colors={['#04010D', '#12082A', '#1A0B3A', '#070712']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.blob, neb, { backgroundColor: '#5B3FE833', top: 40, left: -40 }]} />
      <Animated.View style={[styles.blob, neb, { backgroundColor: '#2EE6C722', top: 180, right: -60, width: 260, height: 260 }]} />
      <Animated.View style={[styles.blob, { backgroundColor: '#FF5BA818', bottom: 80, left: 40, width: 180, height: 180 }]} />
      {stars.map((s, i) => <Star key={i} {...s} />)}
      {!compact && Array.from({ length: 10 }).map((_, i) => <Particle key={'p' + i} i={i} />)}
      <View style={styles.fg}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#04010D' },
  blob: { position: 'absolute', width: 320, height: 320, borderRadius: 200 },
  fg: { flex: 1 },
});
