import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function ProfileScreen() {
  const { palette: t, pref, setPref } = useTheme();
  const { user, settings, updateProfile, logout, deleteAccount } = useAuth();
  const nav = useNavigation<any>();

  const row = (icon: any, label: string, onPress: () => void, extra?: string) => (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: t.line }]}>
      <Ionicons name={icon} size={20} color={t.accent} />
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      {extra ? <Text style={{ color: t.faint, marginRight: 6 }}>{extra}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={t.faint} />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', padding: 24, gap: 6 }}>
          <Avatar name={user?.displayName} avatar={user?.avatar} color={user?.avatarColor} size={92} online ring />
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '900' }}>{user?.displayName}</Text>
          <Text style={{ color: t.accent2 }}>@{user?.username}</Text>
          <Text style={{ color: t.muted, textAlign: 'center' }}>{user?.bio || 'Add a bio so the campus knows your frequency.'}</Text>
        </View>

        {row('create-outline', 'Edit profile', () => nav.navigate('EditProfile'))}
        {row('notifications-outline', 'Notifications', () => nav.navigate('Notifications'))}
        {row('ban-outline', 'Blocked users', () => nav.navigate('Blocked'))}
        {row('shield-checkmark-outline', 'Privacy', () => nav.navigate('PrivacySettings'))}
        {row('color-palette-outline', 'Appearance', () => {}, pref)}
        <View style={[styles.row, { borderBottomColor: t.line }]}>
          <Ionicons name="moon-outline" size={20} color={t.accent} />
          <Text style={[styles.label, { color: t.text }]}>Theme</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['system', 'dark', 'light'] as const).map((p) => (
              <Pressable key={p} onPress={() => { setPref(p); updateProfile({ settings: { ...settings, theme: p } }); }} style={[styles.chip, { backgroundColor: pref === p ? t.accent : t.card }]}>
                <Text style={{ color: pref === p ? '#fff' : t.muted, fontSize: 12, fontWeight: '700' }}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[styles.row, { borderBottomColor: t.line }]}>
          <Ionicons name="pulse-outline" size={20} color={t.accent} />
          <Text style={[styles.label, { color: t.text }]}>Notifications</Text>
          <Switch value={settings.notifications !== false} onValueChange={(v) => updateProfile({ settings: { ...settings, notifications: v } })} />
        </View>
        {row('document-text-outline', 'Terms', () => nav.navigate('Legal', { kind: 'terms' }))}
        {row('lock-closed-outline', 'Privacy Policy', () => nav.navigate('Legal', { kind: 'privacy' }))}
        {row('information-circle-outline', 'About Gooniversity', () => nav.navigate('Legal', { kind: 'about' }))}
        {(user?.role === 'owner' || user?.role === 'admin') && row('hammer-outline', 'Moderation desk', () => nav.navigate('Moderation'))}

        <Pressable onPress={() => Alert.alert('Sign out?', 'Your username stays reserved. Sign back in with this device session only if the token remains.', [
          { text: 'Stay' }, { text: 'Sign out', style: 'destructive', onPress: logout },
        ])} style={{ padding: 20 }}>
          <Text style={{ color: t.warn, fontWeight: '800', textAlign: 'center' }}>Sign out of this device</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert('Delete account?', 'This revokes your session and marks the profile deleted.', [
          { text: 'Keep orbiting' }, { text: 'Delete', style: 'destructive', onPress: deleteAccount },
        ])} style={{ paddingBottom: 30 }}>
          <Text style={{ color: t.danger, fontWeight: '800', textAlign: 'center' }}>Delete account</Text>
        </Pressable>
        <Text style={{ color: t.faint, textAlign: 'center' }}>Owned and created by Luzzi · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  label: { flex: 1, fontSize: 16, fontWeight: '700' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
});
