import React, { useState } from 'react';
import { View, Text, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import GButton from '../components/GButton';

const REASONS = ['Spam', 'Harassment', 'Impersonation', 'Illegal content', 'Other'];

export default function ReportScreen() {
  const { palette: t } = useTheme();
  const { token } = useAuth();
  const nav = useNavigation<any>();
  const { targetType, targetId } = useRoute<any>().params || {};
  const [reason, setReason] = useState('Spam');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      await api('report', { method: 'POST', token, body: { targetType, targetId, reason: reason + (note ? ' — ' + note : '') } });
      Alert.alert('Report filed', 'Campus staff will review this.');
      nav.goBack();
    } catch (e: any) { Alert.alert('Could not report', e.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Close</Text></Pressable>
      <View style={{ padding: 20, gap: 12 }}>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '900' }}>Report {targetType}</Text>
        {REASONS.map((r) => (
          <Pressable key={r} onPress={() => setReason(r)} style={{ padding: 12, borderRadius: 12, backgroundColor: reason === r ? t.accent : t.card }}>
            <Text style={{ color: reason === r ? '#fff' : t.text, fontWeight: '700' }}>{r}</Text>
          </Pressable>
        ))}
        <TextInput value={note} onChangeText={setNote} placeholder="Optional details" placeholderTextColor={t.faint} style={{ borderWidth: 1, borderColor: t.line, borderRadius: 12, color: t.text, padding: 12, minHeight: 80 }} multiline />
        <GButton title="Submit report" onPress={send} loading={loading} />
      </View>
    </SafeAreaView>
  );
}
