import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User } from '../lib/types';
import Avatar from '../components/Avatar';

export default function NewChatScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const search = async (v: string) => {
    setQ(v);
    if (!token) return;
    setLoading(true);
    try {
      const data = await api<{ users: User[] }>('search', { token, query: { q: v } });
      setUsers(data.users || []);
      setErr('');
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const open = async (u: User) => {
    if (!token) return;
    const data = await api<{ convId: string }>('open_dm', { method: 'POST', token, body: { userId: u.id } });
    nav.replace('Chat', { convId: data.convId, title: u.displayName, type: 'dm', otherId: u.id });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => nav.goBack()}><Text style={{ color: t.accent, fontWeight: '700' }}>Close</Text></Pressable>
        <Text style={[styles.title, { color: t.text }]}>Find a student</Text>
        <View style={{ width: 40 }} />
      </View>
      <TextInput
        value={q}
        onChangeText={search}
        autoCapitalize="none"
        placeholder="Search username…"
        placeholderTextColor={t.faint}
        style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
      />
      {loading && <ActivityIndicator color={t.accent} style={{ marginTop: 12 }} />}
      {!!err && <Text style={{ color: t.danger, padding: 16 }}>{err}</Text>}
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={[styles.row, { borderBottomColor: t.line }]}>
            <Avatar name={item.displayName} avatar={item.avatar} color={item.avatarColor} online={item.online} />
            <View>
              <Text style={{ color: t.text, fontWeight: '800' }}>{item.displayName}</Text>
              <Text style={{ color: t.muted }}>@{item.username}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: t.faint, textAlign: 'center', marginTop: 40 }}>Type a username to find someone real.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 16, fontWeight: '800' },
  input: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
