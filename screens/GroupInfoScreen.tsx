import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { GroupInfo, User } from '../lib/types';
import Avatar from '../components/Avatar';
import GButton from '../components/GButton';

export default function GroupInfoScreen() {
  const { palette: t } = useTheme();
  const { token, user } = useAuth();
  const nav = useNavigation<any>();
  const { convId } = useRoute<any>().params || {};
  const [info, setInfo] = useState<GroupInfo | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [people, setPeople] = useState<User[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await api<{ group: GroupInfo }>('group.info', { token, query: { convId } });
    setInfo(data.group); setTitle(data.group.title); setTopic(data.group.topic || '');
    const s = await api<{ users: User[] }>('search', { token, query: { q: '' } });
    setPeople(s.users || []);
  }, [token, convId]);

  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));

  const mine = info?.members.find((m) => m.id === user?.id);
  const isAdmin = mine?.memberRole === 'admin';

  const save = async () => {
    try { await api('group.update', { method: 'POST', token, body: { convId, title, topic } }); Alert.alert('Saved'); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };
  const add = async (uid: string) => {
    try { await api('group.add', { method: 'POST', token, body: { convId, userId: uid } }); load(); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };
  const remove = async (uid: string) => {
    try { await api('group.remove', { method: 'POST', token, body: { convId, userId: uid } }); load(); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };
  const role = async (uid: string, r: string) => {
    try { await api('group.role', { method: 'POST', token, body: { convId, userId: uid, role: r } }); load(); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };
  const leave = async () => {
    try { await api('group.leave', { method: 'POST', token, body: { convId } }); nav.popToTop(); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };

  if (!info) return <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.head}>
        <Pressable onPress={() => nav.goBack()}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
        <Text style={{ color: t.text, fontWeight: '800' }}>Group info</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={{ alignItems: 'center', padding: 16, gap: 8 }}>
        <Avatar name={info.title} avatar={info.image || 'nebula'} size={80} />
        {isAdmin ? (
          <>
            <TextInput value={title} onChangeText={setTitle} style={[styles.input, { color: t.text, borderColor: t.line, backgroundColor: t.card }]} />
            <TextInput value={topic} onChangeText={setTopic} placeholder="Topic" placeholderTextColor={t.faint} style={[styles.input, { color: t.text, borderColor: t.line, backgroundColor: t.card }]} />
            <GButton title="Save details" onPress={save} />
          </>
        ) : (
          <>
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '900' }}>{info.title}</Text>
            <Text style={{ color: t.muted }}>{info.topic}</Text>
          </>
        )}
      </View>
      <Text style={{ color: t.faint, paddingHorizontal: 18, fontWeight: '800', letterSpacing: 1 }}>MEMBERS</Text>
      <FlatList
        data={info.members}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: t.line }]}>
            <Avatar name={item.displayName} avatar={item.avatar} color={item.avatarColor} online={item.online} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{item.displayName}</Text>
              <Text style={{ color: t.muted }}>@{item.username} · {item.memberRole}{item.id === info.createdBy ? ' · creator' : ''}</Text>
            </View>
            {isAdmin && item.id !== user?.id && item.id !== info.createdBy && (
              <View style={{ gap: 4 }}>
                <Pressable onPress={() => role(item.id, item.memberRole === 'admin' ? 'member' : 'admin')}>
                  <Text style={{ color: t.accent, fontSize: 12 }}>{item.memberRole === 'admin' ? 'Demote' : 'Promote'}</Text>
                </Pressable>
                <Pressable onPress={() => remove(item.id)}><Text style={{ color: t.danger, fontSize: 12 }}>Remove</Text></Pressable>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={isAdmin ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: t.faint, fontWeight: '800', marginBottom: 8 }}>ADD PEOPLE</Text>
            {people.filter((p) => !info.members.some((m) => m.id === p.id)).slice(0, 12).map((p) => (
              <Pressable key={p.id} onPress={() => add(p.id)} style={{ paddingVertical: 8 }}>
                <Text style={{ color: t.accent }}>+ {p.displayName} @{p.username}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      />
      <View style={{ padding: 16 }}>
        <GButton title="Leave group" variant="danger" onPress={leave} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
