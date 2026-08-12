import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User } from '../lib/types';
import Avatar from '../components/Avatar';
import GButton from '../components/GButton';

const IMAGES = ['nebula', 'orbit', 'rocket', 'star', 'lounge', 'comet'];

export default function CreateGroupScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [image, setImage] = useState('nebula');
  const [users, setUsers] = useState<User[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ users: User[] }>('search', { token, query: { q: '' } }).then((d) => setUsers(d.users || [])).catch(() => {});
  }, [token]);

  const create = async () => {
    setLoading(true);
    try {
      const data = await api<{ convId: string }>('create_group', { method: 'POST', token, body: { title, topic, image, memberIds: picked } });
      nav.replace('Chat', { convId: data.convId, title, type: 'group' });
    } catch (e: any) {
      Alert.alert('Could not create', e.message);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.head}>
        <Pressable onPress={() => nav.goBack()}><Text style={{ color: t.accent, fontWeight: '700' }}>Cancel</Text></Pressable>
        <Text style={{ color: t.text, fontWeight: '800' }}>New group</Text>
        <View style={{ width: 50 }} />
      </View>
      <View style={{ padding: 18, gap: 10 }}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Group name" placeholderTextColor={t.faint} style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]} />
        <TextInput value={topic} onChangeText={setTopic} placeholder="Topic (optional)" placeholderTextColor={t.faint} style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {IMAGES.map((im) => (
            <Pressable key={im} onPress={() => setImage(im)} style={{ borderWidth: 2, borderColor: image === im ? t.accent2 : 'transparent', borderRadius: 24 }}>
              <Avatar avatar={im} size={44} />
            </Pressable>
          ))}
        </View>
        <Text style={{ color: t.muted, fontWeight: '700' }}>Invite members</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => {
          const on = picked.includes(item.id);
          return (
            <Pressable onPress={() => setPicked(on ? picked.filter((x) => x !== item.id) : [...picked, item.id])} style={[styles.row, { borderBottomColor: t.line }]}>
              <Avatar name={item.displayName} avatar={item.avatar} color={item.avatarColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700' }}>{item.displayName}</Text>
                <Text style={{ color: t.muted }}>@{item.username}</Text>
              </View>
              <View style={[styles.check, { backgroundColor: on ? t.accent : t.card, borderColor: t.line }]} />
            </Pressable>
          );
        }}
      />
      <View style={{ padding: 18 }}><GButton title="Create group" onPress={create} loading={loading} disabled={title.trim().length < 2} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
});
