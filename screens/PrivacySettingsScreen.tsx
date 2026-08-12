import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function PrivacySettingsScreen() {
  const { palette: t } = useTheme();
  const { settings, updateProfile } = useAuth();
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Back</Text></Pressable>
      <Text style={{ color: t.text, fontSize: 24, fontWeight: '900', paddingHorizontal: 18 }}>Privacy</Text>
      <View style={[styles.row, { borderBottomColor: t.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontWeight: '700' }}>Show last seen</Text>
          <Text style={{ color: t.muted }}>Others can see when you were last orbiting.</Text>
        </View>
        <Switch value={settings.lastSeen !== false} onValueChange={(v) => updateProfile({ settings: { ...settings, lastSeen: v } })} />
      </View>
      <View style={[styles.row, { borderBottomColor: t.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontWeight: '700' }}>Read receipts</Text>
          <Text style={{ color: t.muted }}>Let people know you opened their signal.</Text>
        </View>
        <Switch value={settings.readReceipts !== false} onValueChange={(v) => updateProfile({ settings: { ...settings, readReceipts: v } })} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
