import React, { useCallback, useState } from 'react';
import { Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';

export default function ModerationScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await api<{ reports: any[] }>('reports', { token });
      setRows(d.reports || []);
      setErr('');
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
      <Text style={{ color: t.text, fontSize: 24, fontWeight: '900', paddingHorizontal: 18 }}>Moderation</Text>
      {!!err && <Text style={{ color: t.danger, padding: 18 }}>{err}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.accent} />}
        renderItem={({ item }) => (
          <>
            <Text style={{ color: t.text, fontWeight: '800', paddingHorizontal: 18, paddingTop: 14 }}>{item.targetType} · {item.status}</Text>
            <Text style={{ color: t.muted, paddingHorizontal: 18 }}>{item.reason}</Text>
            <Text style={{ color: t.faint, paddingHorizontal: 18, paddingBottom: 10 }}>{timeAgo(item.createdAt)} · {item.targetId}</Text>
          </>
        )}
      />
    </SafeAreaView>
  );
}
