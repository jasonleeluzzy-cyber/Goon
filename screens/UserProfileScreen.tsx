import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User } from '../lib/types';
import Avatar from '../components/Avatar';
import GButton from '../components/GButton';
import { timeAgo } from '../lib/format';

export default function UserProfileScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const { userId } = useRoute<any>().params || {};
  const [u, setU] = useState<User | null>(null);

  useEffect(() => {
    if (!token || !userId) return;
    api<{ user: User }>('profile.get', { token, query: { userId } }).then((d) => setU(d.user)).catch(() => {});
  }, [token, userId]);

  const message = async () => {
    const data = await api<{ convId: string }>('open_dm', { method: 'POST', token, body: { userId } });
    nav.navigate('Chat', { convId: data.convId, title: u?.displayName, type: 'dm', otherId: userId });
  };
  const block = async () => {
    try { await api('block', { method: 'POST', token, body: { userId } }); Alert.alert('Blocked'); nav.goBack(); }
    catch (e: any) { Alert.alert('Nope', e.message); }
  };

  if (!u) return <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
      <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
        <Avatar name={u.displayName} avatar={u.avatar} color={u.avatarColor} online={u.online} size={96} ring />
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '900' }}>{u.displayName}</Text>
        <Text style={{ color: t.accent2 }}>@{u.username}</Text>
        <Text style={{ color: t.muted, textAlign: 'center' }}>{u.bio || 'No bio yet.'}</Text>
        <Text style={{ color: t.faint }}>{u.online ? 'Online now' : u.lastSeen ? `Last seen ${timeAgo(u.lastSeen)}` : 'Last seen hidden'}</Text>
      </View>
      <View style={{ padding: 20, gap: 12 }}>
        <GButton title="Send signal" onPress={message} />
        <GButton title="Report" variant="ghost" onPress={() => nav.navigate('Report', { targetType: 'user', targetId: userId })} />
        <GButton title="Block" variant="danger" onPress={block} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
