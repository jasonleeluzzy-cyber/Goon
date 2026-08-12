import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { AppNotification } from '../lib/types';
import { timeAgo } from '../lib/format';
import EmptyState from '../components/EmptyState';

export default function NotificationsScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await api<{ notifications: AppNotification[] }>('notifs', { token });
      setRows(d.notifications || []);
      await api('notifs.read', { method: 'POST', token, body: {} });
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
        <Pressable onPress={() => nav.goBack()}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Text style={{ color: t.text, fontWeight: '800' }}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.accent} />}
        ListEmptyComponent={!loading ? <EmptyState icon="notifications-off-outline" title="Quiet orbit" body="When someone writes you, it lands here." /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => item.convId && nav.navigate('Chat', { convId: item.convId, title: item.title, type: 'dm' })} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: t.line, opacity: item.read ? 0.65 : 1 }}>
            <Text style={{ color: t.text, fontWeight: '800' }}>{item.title}</Text>
            <Text style={{ color: t.muted }}>{item.body}</Text>
            <Text style={{ color: t.faint, fontSize: 12 }}>{timeAgo(item.createdAt)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
