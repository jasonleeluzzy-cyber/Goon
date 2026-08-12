import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import GButton from '../components/GButton';

const AVATARS = ['orbit', 'nebula', 'comet', 'rocket', 'moon', 'star', 'ufo', 'sat'];
const COLORS = ['#8B6CFF', '#2EE6C7', '#FF5BA8', '#FFD166', '#5B8CFF', '#FF7A59'];

export default function EditProfileScreen() {
  const { palette: t } = useTheme();
  const { user, updateProfile } = useAuth();
  const nav = useNavigation<any>();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'orbit');
  const [color, setColor] = useState(user?.avatarColor || COLORS[0]);
  const [loading, setLoading] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.5 });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    if ((res.assets[0].fileSize || 0) > 900_000) { Alert.alert('Too large', 'Keep avatars under 900 KB.'); return; }
    setAvatar(`data:image/jpeg;base64,${res.assets[0].base64}`);
  };

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile({ displayName, bio, avatar, avatarColor: color });
      nav.goBack();
    } catch (e: any) { Alert.alert('Could not save', e.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Pressable onPress={() => nav.goBack()}><Text style={{ color: t.accent, fontWeight: '700' }}>Cancel</Text></Pressable>
        <View style={{ alignItems: 'center' }}><Avatar name={displayName} avatar={avatar} color={color} size={96} ring /></View>
        <GButton title="Upload photo" variant="soft" onPress={pick} />
        <Text style={{ color: t.faint }}>Username @{user?.username} is permanent.</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]} placeholder="Display name" placeholderTextColor={t.faint} />
        <TextInput value={bio} onChangeText={setBio} style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line, height: 100 }]} placeholder="Bio" placeholderTextColor={t.faint} multiline maxLength={180} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AVATARS.map((a) => (
            <Pressable key={a} onPress={() => setAvatar(a)}><Avatar avatar={a} color={color} size={40} /></Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {COLORS.map((c) => <Pressable key={c} onPress={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: 2, borderColor: color === c ? t.text : 'transparent' }} />)}
        </View>
        <GButton title="Save profile" onPress={save} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
