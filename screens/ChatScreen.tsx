import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Message, GifItem } from '../lib/types';
import { dayLabel } from '../lib/format';
import { STICKERS, STICKER_CATEGORIES, stickerById } from '../lib/stickers';
import { storeGet, storeSet } from '../lib/storage';
import Avatar from '../components/Avatar';
import Composer from '../components/Composer';
import MessageBubble from '../components/MessageBubble';
import TypingDots from '../components/TypingDots';

const REACTS = ['❤️', '😂', '🔥', '✨', '👍', '😮'];

export default function ChatScreen() {
  const { palette: t } = useTheme();
  const { token, user } = useAuth();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { convId, title, type, otherId } = route.params || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tray, setTray] = useState<'none' | 'stickers' | 'gifs' | 'attach'>('none');
  const [stickerCat, setStickerCat] = useState('orbit');
  const [recent, setRecent] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [gifQ, setGifQ] = useState('happy');
  const [gifLoading, setGifLoading] = useState(false);
  const [active, setActive] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recMs, setRecMs] = useState(0);
  const recTimer = useRef<any>(null);
  const list = useRef<FlatList>(null);

  useEffect(() => {
    storeGet<string[]>('gv.stickers.recent', []).then(setRecent);
    storeGet<string[]>('gv.stickers.fav', []).then(setFavs);
  }, []);

  const load = useCallback(async () => {
    if (!token || !convId) return;
    try {
      const data = await api<{ messages: Message[]; typing: { name: string }[] }>('messages', { token, query: { convId } });
      setMessages(data.messages || []);
      setTyping(data.typing || []);
    } catch { /* keep last */ }
    finally { setLoading(false); }
  }, [token, convId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 2500);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!token || !text) return;
    const id = setTimeout(() => {
      api('heartbeat', { method: 'POST', token, body: { typingConvId: convId } }).catch(() => {});
    }, 250);
    return () => clearTimeout(id);
  }, [text, token, convId]);

  const pushLocal = (partial: Partial<Message>): Message => {
    const m: Message = {
      id: 'local-' + Date.now(),
      convId,
      senderId: user?.id || '',
      senderName: user?.displayName || 'You',
      senderAvatar: user?.avatar,
      type: 'text',
      text: '',
      reactions: {},
      status: 'sending',
      createdAt: Date.now(),
      clientId: 'c' + Date.now(),
      ...partial,
    };
    setMessages((prev) => [...prev, m]);
    return m;
  };

  const sendPayload = async (body: any, local: Message) => {
    try {
      await api('send', { method: 'POST', token, body: { convId, clientId: local.clientId, replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName } : null, ...body } });
      setReplyTo(null);
      await load();
    } catch {
      setMessages((prev) => prev.map((m) => m.id === local.id ? { ...m, status: 'failed' } : m));
    }
  };

  const sendText = async () => {
    const v = text.trim();
    if (!v) return;
    if (editId) {
      try { await api('edit', { method: 'POST', token, body: { convId, messageId: editId, text: v } }); }
      catch (e: any) { Alert.alert('Edit failed', e.message); }
      setEditId(null); setText(''); await load(); return;
    }
    setText('');
    const local = pushLocal({ text: v, type: 'text' });
    await sendPayload({ type: 'text', text: v }, local);
  };

  const sendSticker = async (id: string) => {
    const s = stickerById(id);
    if (!s) return;
    const rec = [id, ...recent.filter((x) => x !== id)].slice(0, 16);
    setRecent(rec); storeSet('gv.stickers.recent', rec);
    const local = pushLocal({ type: 'sticker', text: s.emoji, media: { stickerId: id } });
    setTray('none');
    await sendPayload({ type: 'sticker', text: s.emoji, media: { stickerId: id } }, local);
  };

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
    setFavs(next); storeSet('gv.stickers.fav', next);
  };

  const loadGifs = async (q: string) => {
    setGifQ(q); setGifLoading(true);
    try {
      const data = await api<{ items: GifItem[] }>('gifs', { query: { q } });
      setGifs(data.items || []);
    } catch { setGifs([]); }
    finally { setGifLoading(false); }
  };

  const sendGif = async (g: GifItem) => {
    const local = pushLocal({ type: 'gif', text: g.title || 'gif', media: { url: g.url } });
    setTray('none');
    await sendPayload({ type: 'gif', text: g.title || 'gif', media: { url: g.url, preview: g.preview } }, local);
  };

  const pickImage = async (video = false) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: video ? ['videos'] : ['images'], quality: 0.7, base64: true });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if ((a.fileSize || 0) > 8 * 1024 * 1024) { Alert.alert('Too large', 'Keep media under 8 MB.'); return; }
    const uri = a.base64 ? `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}` : a.uri;
    const local = pushLocal({ type: video ? 'video' : 'image', text: video ? 'video' : 'photo', media: { uri, name: a.fileName } });
    setTray('none');
    await sendPayload({ type: video ? 'video' : 'image', text: video ? 'video' : 'photo', media: { uri, name: a.fileName, size: a.fileSize } }, local);
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if ((a.size || 0) > 8 * 1024 * 1024) { Alert.alert('Too large', 'Keep files under 8 MB.'); return; }
    const local = pushLocal({ type: 'file', text: a.name, media: { name: a.name, size: a.size, uri: a.uri } });
    setTray('none');
    await sendPayload({ type: 'file', text: a.name, media: { name: a.name, size: a.size } }, local);
  };

  const toggleRec = () => {
    if (recording) {
      setRecording(false);
      clearInterval(recTimer.current);
      const dur = recMs;
      setRecMs(0);
      if (dur < 400) return;
      const label = `${Math.floor(dur / 1000)}s`;
      const local = pushLocal({ type: 'voice', text: 'voice', media: { duration: label } });
      sendPayload({ type: 'voice', text: 'voice', media: { duration: label } }, local);
    } else {
      setRecording(true);
      const start = Date.now();
      recTimer.current = setInterval(() => setRecMs(Date.now() - start), 200);
    }
  };

  const retry = async (m: Message) => {
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, status: 'sending' } : x));
    await sendPayload({ type: m.type, text: m.text, media: m.media }, m);
  };

  const react = async (m: Message, emoji: string) => {
    try { await api('react', { method: 'POST', token, body: { convId, messageId: m.id, emoji } }); await load(); }
    catch { /* ignore */ }
    setActive(null);
  };

  const remove = async (m: Message) => {
    try { await api('delete_msg', { method: 'POST', token, body: { convId, messageId: m.id } }); await load(); }
    catch (e: any) { Alert.alert('Cannot delete', e.message); }
    setActive(null);
  };

  const shownStickers = stickerCat === 'recent'
    ? recent.map(stickerById).filter(Boolean)
    : stickerCat === 'fav'
      ? favs.map(stickerById).filter(Boolean)
      : STICKERS.filter((s) => s.category === stickerCat);

  const grouped = messages;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <View style={[styles.head, { borderBottomColor: t.line }]}>
        <Pressable onPress={() => nav.goBack()} style={{ padding: 6 }}><Ionicons name="chevron-back" size={24} color={t.text} /></Pressable>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }} onPress={() => {
          if (type === 'group') nav.navigate('GroupInfo', { convId, title });
          else if (otherId) nav.navigate('UserProfile', { userId: otherId });
        }}>
          <Avatar name={title} size={36} />
          <View>
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{title}</Text>
            <Text style={{ color: t.faint, fontSize: 12 }}>{type === 'group' ? 'Group · tap for settings' : 'Private line'}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => nav.navigate('Report', { targetType: type === 'group' ? 'group' : 'user', targetId: otherId || convId })}>
          <Ionicons name="flag-outline" size={20} color={t.muted} />
        </Pressable>
      </View>

      {loading && messages.length === 0 ? <ActivityIndicator color={t.accent} style={{ marginTop: 30 }} /> : (
        <FlatList
          ref={list}
          data={grouped}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item, index }) => {
            const prev = grouped[index - 1];
            const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(item.createdAt);
            return (
              <View>
                {showDay && <Text style={[styles.day, { color: t.faint }]}>{dayLabel(item.createdAt)}</Text>}
                <MessageBubble
                  msg={item}
                  mine={item.senderId === user?.id}
                  group={type === 'group'}
                  onLong={() => item.status === 'failed' ? retry(item) : setActive(item)}
                  onReact={(e) => react(item, e)}
                />
              </View>
            );
          }}
        />
      )}

      {typing.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 8, paddingBottom: 4 }}>
          <TypingDots />
          <Text style={{ color: t.muted, fontSize: 12 }}>{typing.map((x) => x.name).join(', ')} typing</Text>
        </View>
      )}
      {replyTo && (
        <View style={[styles.replyBar, { backgroundColor: t.card, borderColor: t.line }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.accent, fontWeight: '700', fontSize: 12 }}>Replying to {replyTo.senderName}</Text>
            <Text style={{ color: t.muted }} numberOfLines={1}>{replyTo.text}</Text>
          </View>
          <Pressable onPress={() => setReplyTo(null)}><Ionicons name="close" size={18} color={t.muted} /></Pressable>
        </View>
      )}
      {recording && <Text style={{ color: t.danger, textAlign: 'center', padding: 6 }}>Recording {Math.floor(recMs / 1000)}s — tap stop to send, or wait under 0.4s to cancel</Text>}

      {tray === 'stickers' && (
        <View style={[styles.tray, { backgroundColor: t.card, borderColor: t.line }]}>
          <View style={styles.cats}>
            {STICKER_CATEGORIES.map((c) => (
              <Pressable key={c.id} onPress={() => setStickerCat(c.id)} style={[styles.cat, stickerCat === c.id && { backgroundColor: t.accent }]}>
                <Ionicons name={c.icon as any} size={16} color={stickerCat === c.id ? '#fff' : t.muted} />
              </Pressable>
            ))}
          </View>
          <View style={styles.grid}>
            {shownStickers.map((s: any) => (
              <Pressable key={s.id} onPress={() => sendSticker(s.id)} onLongPress={() => toggleFav(s.id)} style={styles.sticker}>
                <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                {favs.includes(s.id) && <Text style={styles.heart}>♥</Text>}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {tray === 'gifs' && (
        <View style={[styles.tray, { backgroundColor: t.card, borderColor: t.line }]}>
          <TextInput
            value={gifQ}
            onChangeText={(v) => loadGifs(v)}
            placeholder="Search GIFs…"
            placeholderTextColor={t.faint}
            style={[styles.gifSearch, { color: t.text, borderColor: t.line }]}
          />
          <Pressable onPress={() => loadGifs(gifQ)} style={{ alignSelf: 'flex-end', marginRight: 12 }}><Text style={{ color: t.accent, fontWeight: '700' }}>Search</Text></Pressable>
          {gifLoading ? <ActivityIndicator color={t.accent} /> : (
            <FlatList
              horizontal
              data={gifs}
              keyExtractor={(g) => g.id}
              contentContainerStyle={{ padding: 8, gap: 8 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => sendGif(item)}>
                  <Image source={{ uri: item.preview || item.url }} style={{ width: 120, height: 90, borderRadius: 10, backgroundColor: '#111' }} />
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {tray === 'attach' && (
        <View style={[styles.attach, { backgroundColor: t.card, borderColor: t.line }]}>
          {[
            { i: 'image-outline', l: 'Photo', f: () => pickImage(false) },
            { i: 'videocam-outline', l: 'Video', f: () => pickImage(true) },
            { i: 'document-outline', l: 'File', f: pickFile },
            { i: 'mic-outline', l: 'Voice', f: toggleRec },
          ].map((a) => (
            <Pressable key={a.l} onPress={a.f} style={styles.attachBtn}>
              <Ionicons name={a.i as any} size={22} color={t.accent} />
              <Text style={{ color: t.text, fontWeight: '700' }}>{a.l}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Composer
          value={text}
          onChange={setText}
          onSend={sendText}
          onAttach={() => setTray(tray === 'attach' ? 'none' : 'attach')}
          onSticker={() => setTray(tray === 'stickers' ? 'none' : 'stickers')}
          onGif={() => { setTray(tray === 'gifs' ? 'none' : 'gifs'); if (!gifs.length) loadGifs('happy'); }}
          onMic={toggleRec}
          recording={recording}
          placeholder={editId ? 'Edit message…' : 'Signal the campus…'}
        />
      </KeyboardAvoidingView>

      <Modal visible={!!active} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <Pressable style={styles.overlay} onPress={() => setActive(null)}>
          <View style={[styles.sheet, { backgroundColor: t.card }]}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {REACTS.map((e) => (
                <Pressable key={e} onPress={() => active && react(active, e)} style={[styles.reactBtn, { backgroundColor: t.card2 }]}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
            {[
              { l: 'Reply', f: () => { setReplyTo(active); setActive(null); } },
              { l: 'Copy', f: () => { if (active?.text) Clipboard.setStringAsync(active.text); setActive(null); } },
              { l: 'Forward', f: () => { if (active) { setText((active.text || '') + ' ' ); setActive(null); } } },
              ...(active?.senderId === user?.id && active?.type === 'text' ? [{ l: 'Edit', f: () => { setEditId(active!.id); setText(active!.text); setActive(null); } }] : []),
              ...(active?.senderId === user?.id ? [{ l: 'Delete', f: () => remove(active!) }] : []),
              { l: 'Report', f: () => { nav.navigate('Report', { targetType: 'message', targetId: active?.id }); setActive(null); } },
            ].map((a) => (
              <Pressable key={a.l} onPress={a.f} style={styles.action}><Text style={{ color: a.l === 'Delete' ? t.danger : t.text, fontWeight: '700', fontSize: 16 }}>{a.l}</Text></Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  day: { textAlign: 'center', fontSize: 11, marginVertical: 10, letterSpacing: 1, fontWeight: '700' },
  replyBar: { marginHorizontal: 12, marginBottom: 4, padding: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tray: { borderTopWidth: 1, paddingVertical: 8, maxHeight: 230 },
  cats: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 6 },
  cat: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  sticker: { width: '16.6%', alignItems: 'center', paddingVertical: 6 },
  heart: { position: 'absolute', right: 4, top: 2, color: '#FF5BA8', fontSize: 10 },
  gifSearch: { marginHorizontal: 12, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  attach: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderTopWidth: 1 },
  attachBtn: { alignItems: 'center', gap: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { padding: 18, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  reactBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  action: { paddingVertical: 12 },
});
