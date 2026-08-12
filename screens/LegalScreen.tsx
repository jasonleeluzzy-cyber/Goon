import React from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { TERMS, PRIVACY, ABOUT } from '../lib/legal';

export default function LegalScreen() {
  const { palette: t } = useTheme();
  const nav = useNavigation<any>();
  const kind = useRoute<any>().params?.kind || 'about';
  const body = kind === 'terms' ? TERMS : kind === 'privacy' ? PRIVACY : ABOUT;
  const title = kind === 'terms' ? 'Terms' : kind === 'privacy' ? 'Privacy Policy' : 'About';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '900', marginBottom: 12 }}>{title}</Text>
        <Text style={{ color: t.muted, lineHeight: 22, fontSize: 15 }}>{body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
