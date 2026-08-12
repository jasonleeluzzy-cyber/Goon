import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({ icon, title, body }: { icon: any; title: string; body: string }) {
  const { palette: t } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.orb, { backgroundColor: t.card, borderColor: t.line }]}>
        <Ionicons name={icon} size={34} color={t.accent} />
      </View>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      <Text style={[styles.body, { color: t.muted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 36, gap: 10 },
  orb: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800' },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
