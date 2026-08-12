import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { initials } from '../lib/format';
import { useTheme } from '../context/ThemeContext';

const EMOJI: Record<string, string> = {
  orbit: '🪐', nebula: '🌌', comet: '☄️', rocket: '🚀', moon: '🌙',
  star: '🌟', ufo: '🛸', sat: '🛰️', ai: '✨', lounge: '🪩', gone: '◌',
};

export default function Avatar({
  name, avatar, color, size = 44, online, ring,
}: {
  name?: string; avatar?: string; color?: string; size?: number; online?: boolean; ring?: boolean;
}) {
  const { palette: t } = useTheme();
  const r = size / 2;
  const isData = avatar && avatar.startsWith('data:');
  const glyph = (avatar && EMOJI[avatar]) || '';
  return (
    <View style={{ width: size, height: size }}>
      <View style={[
        styles.wrap,
        {
          width: size, height: size, borderRadius: r,
          backgroundColor: color || t.accent,
          borderWidth: ring ? 2 : 0,
          borderColor: t.accent2,
        },
      ]}>
        {isData ? (
          <Image source={{ uri: avatar }} style={{ width: size, height: size, borderRadius: r }} />
        ) : glyph ? (
          <Text style={{ fontSize: size * 0.46 }}>{glyph}</Text>
        ) : (
          <Text style={[styles.ini, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
        )}
      </View>
      {online !== undefined && (
        <View style={[
          styles.dot,
          {
            width: Math.max(8, size * 0.22),
            height: Math.max(8, size * 0.22),
            borderRadius: 99,
            backgroundColor: online ? t.ok : t.faint,
            borderColor: t.bg,
          },
        ]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ini: { color: '#fff', fontWeight: '800', letterSpacing: 0.4 },
  dot: { position: 'absolute', right: -1, bottom: -1, borderWidth: 2 },
});
