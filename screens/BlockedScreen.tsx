import React, { useCallback, useState } from 'react';
import { Text, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User } from '../lib/types';
import EmptyState from '../components/EmptyState';

export default function BlockedScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const d = await api<{ users: User[] }>('blocks', { token });
    setUsers(d.users || []);
  }, [token]);
  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));

  const unblock = async (id: string) => {
    try { await api('unblock', { method: 'POST', token, body: { userId: id } }); load(); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        ListEmptyComponent={<EmptyState icon="ban-outline" title="No blocks" body="People you block vanish from search and DMs." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => unblock(item.id)} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: t.line, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{item.displayName} @{item.username}</Text>
            <Text style={{ color: t.accent }}>Unblock</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
