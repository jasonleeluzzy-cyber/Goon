import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { storeGet, storeSet } from '../lib/storage';
import Composer from '../components/Composer';
import Avatar from '../components/Avatar';

type Turn = { id: string; role: 'user' | 'assistant'; content: string; at: number };

export default function AIScreen() {
  const { palette: t } = useTheme();
  const { token, user } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList>(null);

  useEffect(() => {
    storeGet<Turn[]>('gv.ai.' + (user?.id || 'x'), []).then((rows) => {
      if (rows.length) setTurns(rows);
      else setTurns([{ id: 'hi', role: 'assistant', at: Date.now(), content: "Hey, I'm Gooni — official Gooniversity AI, not a human. Funny, loyal, slightly cosmic. What's on your star-chart?" }]);
    });
  }, [user?.id]);

  const persist = (rows: Turn[]) => { setTurns(rows); storeSet('gv.ai.' + (user?.id || 'x'), rows); };

  const send = async () => {
    const v = text.trim();
    if (!v || busy) return;
    setText('');
    const next = [...turns, { id: 'u' + Date.now(), role: 'user' as const, content: v, at: Date.now() }];
    persist(next);
    setBusy(true);
    try {
      const data = await api<{ reply: string }>('ai', {
        method: 'POST', token,
        body: { messages: next.slice(-16).map((x) => ({ role: x.role, content: x.content })) },
      });
      persist([...next, { id: 'a' + Date.now(), role: 'assistant', content: data.reply, at: Date.now() }]);
    } catch (e: any) {
      persist([...next, { id: 'e' + Date.now(), role: 'assistant', content: e.message || 'Gooni lost the uplink.', at: Date.now() }]);
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <View style={[styles.head, { borderBottomColor: t.line }]}>
        <Avatar avatar="ai" color="#2EE6C7" size={40} />
        <View>
          <Text style={{ color: t.text, fontWeight: '900', fontSize: 18 }}>Gooni</Text>
          <Text style={{ color: t.accent2, fontSize: 12 }}>Official AI · never human</Text>
        </View>
      </View>
      <FlatList
        ref={list}
        data={turns}
        keyExtractor={(i) => i.id}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const mine = item.role === 'user';
          return (
            <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.bubble, { backgroundColor: mine ? t.bubbleMe : t.card }]}>
                <Text style={{ color: mine ? '#fff' : t.text, fontSize: 16, lineHeight: 22 }}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />
      {busy && <ActivityIndicator color={t.accent2} style={{ marginBottom: 6 }} />}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Composer value={text} onChange={setText} onSend={send} placeholder="Talk to Gooni…" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
});
