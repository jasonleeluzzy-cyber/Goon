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

export default function GroupsScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api<{ conversations: Conversation[] }>('inbox', { token });
      setRows((data.conversations || []).filter((c) => c.type === 'group'));
    } catch { /* keep */ } finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <View style={styles.head}>
        <View>
          <Text style={[styles.kicker, { color: t.accent2 }]}>CREWS</Text>
          <Text style={[styles.title, { color: t.text }]}>Groups</Text>
        </View>
        <Pressable onPress={() => nav.navigate('CreateGroup')} style={[styles.fab, { backgroundColor: t.accent }]}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.accent} />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
        ListEmptyComponent={!loading ? <EmptyState icon="people-outline" title="No crews yet" body="Create a group, name it, drop an image, and invite the campus." /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('Chat', { convId: item.id, title: item.title, type: 'group' })} style={[styles.card, { backgroundColor: t.card, borderColor: t.line }]}>
            <Avatar name={item.title} avatar={item.image || 'nebula'} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: t.text }]}>{item.title}</Text>
              <Text style={{ color: t.muted }} numberOfLines={1}>{item.lastSender ? `${item.lastSender}: ` : ''}{item.lastMessage}</Text>
              <Text style={{ color: t.faint, fontSize: 12, marginTop: 2 }}>{item.memberCount || 0} members · {timeAgo(item.lastAt)}</Text>
            </View>
            {item.unread > 0 && <View style={[styles.badge, { backgroundColor: t.accent3 }]}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>{item.unread}</Text></View>}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '900' },
  fab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
