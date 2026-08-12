import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function Composer({
  value, onChange, onSend, onAttach, onSticker, onGif, onMic, recording, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onSticker?: () => void;
  onGif?: () => void;
  onMic?: () => void;
  recording?: boolean;
  placeholder?: string;
}) {
  const { palette: t } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={[styles.bar, { backgroundColor: t.tab, borderTopColor: t.line }]}>
      <Pressable onPress={onAttach} style={styles.icon}><Ionicons name="add-circle" size={26} color={t.accent} /></Pressable>
      <Pressable onPress={onSticker} style={styles.icon}><Ionicons name="happy-outline" size={24} color={t.muted} /></Pressable>
      <Pressable onPress={onGif} style={styles.icon}><Ionicons name="film-outline" size={22} color={t.muted} /></Pressable>
      <View style={[styles.inputWrap, { backgroundColor: t.card, borderColor: focus ? t.accent : t.line }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || 'Signal the campus…'}
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.text }]}
          multiline
          maxLength={4000}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          returnKeyType="default"
        />
      </View>
      {value.trim() ? (
        <Pressable onPress={onSend} style={[styles.send, { backgroundColor: t.accent }]}>
          <Ionicons name="send" size={16} color="#fff" />
        </Pressable>
      ) : (
        <Pressable onPress={onMic} style={[styles.send, { backgroundColor: recording ? t.danger : t.card2 }]}>
          <Ionicons name={recording ? 'stop' : 'mic'} size={18} color={recording ? '#fff' : t.accent} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 1, gap: 4, paddingBottom: Platform.OS === 'ios' ? 18 : 8 },
  icon: { width: 34, height: 44, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, minHeight: 42, maxHeight: 120, justifyContent: 'center' },
  input: { fontSize: 16, paddingVertical: 8, maxHeight: 110 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
});
