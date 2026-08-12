import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Message } from '../lib/types';
import { clock } from '../lib/format';
import { stickerById } from '../lib/stickers';
import Avatar from './Avatar';

export default function MessageBubble({
  msg, mine, group, onLong, onReact,
}: {
  msg: Message; mine: boolean; group?: boolean; onLong?: () => void; onReact?: (e: string) => void;
}) {
  const { palette: t } = useTheme();
  const statusIcon = msg.status === 'failed' ? 'alert-circle' : msg.status === 'sending' ? 'time-outline' : msg.status === 'read' ? 'checkmark-done' : 'checkmark';
  const statusColor = msg.status === 'failed' ? t.danger : msg.status === 'read' ? t.accent2 : 'rgba(255,255,255,0.7)';

  if (msg.deleted) {
    return (
      <View style={[styles.row, mine && styles.right]}>
        <View style={[styles.bubble, { backgroundColor: 'transparent', borderColor: t.line, borderWidth: 1 }]}>
          <Text style={{ color: t.faint, fontStyle: 'italic' }}>Message removed</Text>
        </View>
      </View>
    );
  }

  const sticker = msg.type === 'sticker' ? stickerById(msg.media?.stickerId || msg.text) : null;

  return (
    <Pressable onLongPress={onLong} style={[styles.row, mine && styles.right]}>
      {!mine && group && <Avatar name={msg.senderName} avatar={msg.senderAvatar} size={28} />}
      <View style={[styles.col, mine && { alignItems: 'flex-end' }]}>
        {!mine && group && <Text style={[styles.name, { color: t.accent2 }]}>{msg.senderName}</Text>}
        {msg.replyTo ? (
          <View style={[styles.reply, { borderColor: t.accent, backgroundColor: t.card2 }]}>
            <Text style={{ color: t.accent, fontSize: 11, fontWeight: '700' }}>{msg.replyTo.senderName}</Text>
            <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{msg.replyTo.text}</Text>
          </View>
        ) : null}
        {sticker ? (
          <Text style={{ fontSize: 56, lineHeight: 64 }}>{sticker.emoji}</Text>
        ) : msg.type === 'gif' && msg.media?.url ? (
          <Image source={{ uri: msg.media.url }} style={styles.media} resizeMode="cover" />
        ) : msg.type === 'image' && msg.media?.uri ? (
          <Image source={{ uri: msg.media.uri }} style={styles.media} resizeMode="cover" />
        ) : msg.type === 'voice' ? (
          <View style={[styles.bubble, { backgroundColor: mine ? t.bubbleMe : t.bubbleThem, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <Ionicons name="play" size={18} color="#fff" />
            <View style={{ width: 90, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>
              <View style={{ width: '60%', height: 4, backgroundColor: t.accent2, borderRadius: 2 }} />
            </View>
            <Text style={{ color: '#fff', fontSize: 12 }}>{msg.media?.duration || '0:00'}</Text>
          </View>
        ) : msg.type === 'file' || msg.type === 'video' ? (
          <View style={[styles.bubble, { backgroundColor: mine ? t.bubbleMe : t.bubbleThem, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <Ionicons name={msg.type === 'video' ? 'videocam' : 'document'} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', maxWidth: 180 }} numberOfLines={1}>{msg.media?.name || msg.type}</Text>
          </View>
        ) : (
          <View style={[styles.bubble, { backgroundColor: mine ? t.bubbleMe : t.bubbleThem }]}>
            <Text style={{ color: mine || t.name === 'dark' ? '#fff' : t.text, fontSize: 16, lineHeight: 22 }}>{msg.text}</Text>
          </View>
        )}
        <View style={styles.meta}>
          {msg.editedAt ? <Text style={[styles.time, { color: t.faint }]}>edited · </Text> : null}
          <Text style={[styles.time, { color: t.faint }]}>{clock(msg.createdAt)}</Text>
          {mine && <Ionicons name={statusIcon as any} size={13} color={statusColor} style={{ marginLeft: 4 }} />}
        </View>
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <View style={styles.reacts}>
            {Object.entries(msg.reactions).filter(([, ids]) => ids.length).map(([e, ids]) => (
              <Pressable key={e} onPress={() => onReact?.(e)} style={[styles.reactChip, { backgroundColor: t.card, borderColor: t.line }]}>
                <Text>{e} {ids.length}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4, gap: 8, alignItems: 'flex-end' },
  right: { justifyContent: 'flex-end' },
  col: { maxWidth: '78%' },
  name: { fontSize: 11, fontWeight: '700', marginBottom: 3, marginLeft: 6 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  reply: { borderLeftWidth: 3, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, marginBottom: 4, maxWidth: 240 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingHorizontal: 6 },
  time: { fontSize: 11 },
  media: { width: 220, height: 160, borderRadius: 16, backgroundColor: '#111' },
  reacts: { flexDirection: 'row', gap: 4, marginTop: 4 },
  reactChip: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
});
