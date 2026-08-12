import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(-5, { duration: 320 }), -1, true));
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const { palette: t } = useTheme();
  return <Animated.View style={[st, styles.dot, { backgroundColor: t.accent2 }]} />;
}

export default function TypingDots() {
  return (
    <View style={styles.row}>
      <Dot delay={0} /><Dot delay={120} /><Dot delay={240} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 4, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
