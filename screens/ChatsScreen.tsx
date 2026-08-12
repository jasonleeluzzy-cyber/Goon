import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Conversation } from '../lib/types';
import { timeAgo } from '../lib/format';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import TypingDots from '../components/TypingDots';

export default function ChatsScreen() {
  const { palette: t } = useTheme();
  const { token, user } = useAuth();
  const nav = useNavigation<any>();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api<{ conversations: Conversation[] }>('inbox', { token });
      setRows((data.conversations || []).filter((c) => c.type === 'dm'));
      setErr('');
    } catch (e: any) {
      setErr(e.message || 'Could not reach campus');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <View style={styles.head}>
        <View>
          <Text style={[styles.kicker, { color: t.accent2 }]}>SIGNALS</Text>
          <Text style={[styles.title, { color: t.text }]}>Chats</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => nav.navigate('Notifications')} style={[styles.iconBtn, { backgroundColor: t.card }]}>
            <Ionicons name="notifications-outline" size={20} color={t.text} />
          </Pressable>
          <Pressable onPress={() => nav.navigate('NewChat')} style={[styles.iconBtn, { backgroundColor: t.accent }]}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
      {!!err && <Text style={{ color: t.danger, paddingHorizontal: 20 }}>{err}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.accent} />}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={!loading ? <EmptyState icon="chatbubbles-outline" title="No private lines yet" body="Find a username and open the first signal. Messages persist across devices." /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('Chat', { convId: item.id, title: item.title, type: 'dm', otherId: item.otherId })} style={[styles.row, { borderBottomColor: t.line }]}>
            <Avatar name={item.title} avatar={item.image} color={item.avatarColor} online={item.online} size={52} />
            <View style={{ flex: 1 }}>
              <View style={styles.top}>
                <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={{ color: t.faint, fontSize: 12 }}>{timeAgo(item.lastAt)}</Text>
              </View>
              <View style={styles.top}>
                {item.typing && item.typing.length ? <TypingDots /> : (
                  <Text style={{ color: t.muted, flex: 1 }} numberOfLines={1}>{item.lastMessage || 'Open a new orbit'}</Text>
                )}
                {item.unread > 0 && (
                  <View style={[styles.badge, { backgroundColor: t.accent }]}>
                    <Text style={styles.badgeT}>{item.unread > 99 ? '99+' : item.unread}</Text>
                  </View>
                )}
              </View>
              {!!item.username && <Text style={{ color: t.faint, fontSize: 12 }}>@{item.username}</Text>}
            </View>
          </Pressable>
        )}
      />
      <Text style={{ color: t.faint, textAlign: 'center', fontSize: 11, paddingBottom: 6 }}>Signed in as @{user?.username}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '900' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '800', flex: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeT: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
