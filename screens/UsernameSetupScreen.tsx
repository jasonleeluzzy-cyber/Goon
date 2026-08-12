import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import GButton from '../components/GButton';
import Avatar from '../components/Avatar';
import { ApiError } from '../lib/api';

const AVATARS = ['orbit', 'nebula', 'comet', 'rocket', 'moon', 'star', 'ufo', 'sat'];
const COLORS = ['#8B6CFF', '#2EE6C7', '#FF5BA8', '#FFD166', '#5B8CFF', '#FF7A59'];

export default function UsernameSetupScreen() {
  const { palette: t } = useTheme();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('orbit');
  const [color, setColor] = useState(COLORS[0]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr('');
    setLoading(true);
    try {
      await register(username, displayName || username, avatar, color);
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : 'Could not claim that name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <Text style={[styles.kicker, { color: t.accent2 }]}>CLAIM YOUR ORBIT</Text>
          <Text style={[styles.h, { color: t.text }]}>Pick a unique username</Text>
          <Text style={[styles.p, { color: t.muted }]}>No email. No password. No phone. This name is your identity — impersonation is blocked.</Text>

          <View style={{ alignItems: 'center', marginVertical: 18 }}>
            <Avatar name={displayName || username} avatar={avatar} color={color} size={92} ring />
          </View>

          <Text style={[styles.label, { color: t.faint }]}>USERNAME</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="e.g. nova_kid"
            placeholderTextColor={t.faint}
            style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
            maxLength={20}
          />
          <Text style={[styles.label, { color: t.faint }]}>DISPLAY NAME</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How people see you"
            placeholderTextColor={t.faint}
            style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
            maxLength={32}
          />

          <Text style={[styles.label, { color: t.faint }]}>AVATAR</Text>
          <View style={styles.row}>
            {AVATARS.map((a) => (
              <Pressable key={a} onPress={() => setAvatar(a)} style={[styles.av, { borderColor: avatar === a ? t.accent2 : t.line, backgroundColor: t.card }]}>
                <Avatar avatar={a} color={color} size={40} />
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            {COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[styles.swatch, { backgroundColor: c, borderColor: color === c ? t.text : 'transparent' }]} />
            ))}
          </View>

          {!!err && <Text style={{ color: t.danger, marginTop: 10 }}>{err}</Text>}
          <View style={{ height: 16 }} />
          <GButton title="Create my identity" onPress={go} loading={loading} disabled={username.length < 3} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 24, paddingBottom: 48 },
  kicker: { fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  h: { fontSize: 30, fontWeight: '900', marginTop: 8 },
  p: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  av: { padding: 6, borderRadius: 14, borderWidth: 1 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
});
