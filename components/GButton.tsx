import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../lib/theme';

export default function GButton({
  title, onPress, disabled, loading, variant = 'primary', style, icon,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const { palette: t } = useTheme();
  const inner = (
    <>
      {loading ? <ActivityIndicator color="#fff" /> : (
        <>
          {icon}
          <Text style={[styles.txt, variant === 'ghost' && { color: t.text }, variant === 'soft' && { color: t.accent }]}>{title}</Text>
        </>
      )}
    </>
  );
  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.press, { opacity: disabled ? 0.5 : 1 }, style]}>
        <LinearGradient colors={['#8B6CFF', '#5B3FE8', '#2EE6C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.grad}>
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }
  const bg = variant === 'danger' ? t.danger : variant === 'soft' ? t.card2 : 'transparent';
  const border = variant === 'ghost' ? t.line : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.press, styles.flat, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: radii.lg, overflow: 'hidden' },
  grad: { minHeight: 52, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  flat: { minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18, borderWidth: 1, borderRadius: radii.lg },
  txt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
