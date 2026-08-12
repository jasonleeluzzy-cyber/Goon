/* Gooniversity backend — secrets stay on the server. Owned by Luzzi. */
const crypto = require('crypto');

const DB = 'https://crudcrud.com/api/f7f94c8b64f64fb0a479008ddc733b6f';
const AI_LIMIT = 24;
const MSG_WINDOW_MS = 12_000;
const MSG_MAX = 18;
const RESERVED = new Set([
  'admin', 'administrator', 'luzzi', 'gooni', 'gooniversity', 'support',
  'system', 'moderator', 'official', 'staff', 'root', 'owner', 'help',
  'security', 'privacy', 'terms', 'about', 'null', 'undefined',
]);

const buckets = new Map();
const presence = new Map();
const typingMap = new Map();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function json(res, status, body) {
  cors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body || '{}')); } catch { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 2_500_000) req.destroy(); });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });
}

function id(prefix) {
  return prefix + crypto.randomBytes(10).toString('hex');
}

function hash(v) {
  return crypto.createHash('sha256').update(String(v)).digest('hex');
}

function now() { return Date.now(); }

function rate(key, limit, windowMs) {
  const t = now();
  const arr = (buckets.get(key) || []).filter((x) => t - x < windowMs);
  if (arr.length >= limit) return false;
  arr.push(t);
  buckets.set(key, arr);
  return true;
}

async function cc(method, path, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 18_000);
  try {
    const res = await fetch(DB + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (res.status === 404) return path.split('/').filter(Boolean).length <= 1 ? [] : null;
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  } finally {
    clearTimeout(timer);
  }
}

function stripId(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const { _id, ...rest } = doc;
  return rest;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar || '',
    avatarColor: u.avatarColor || '#8B6CFF',
    bio: u.bio || '',
    online: isOnline(u.id, u.lastSeen),
    lastSeen: u.lastSeen || 0,
    createdAt: u.createdAt,
    role: u.role || 'member',
  };
}

function isOnline(uid, lastSeen) {
  const p = presence.get(uid);
  const ts = p || lastSeen || 0;
  return now() - ts < 50_000;
}

async function list(col) {
  const rows = await cc('GET', '/' + col);
  return Array.isArray(rows) ? rows : [];
}

async function findBy(col, pred) {
  const rows = await list(col);
  return rows.find(pred) || null;
}

async function putDoc(col, doc) {
  if (!doc || !doc._id) return null;
  await cc('PUT', `/${col}/${doc._id}`, stripId(doc));
  return doc;
}

async function userByToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  const token = String(h).replace(/^Bearer\s+/i, '').trim();
  if (!token || token.length < 16) return null;
  const tokenHash = hash(token);
  const u = await findBy('gv_users', (x) => x.tokenHash === tokenHash && !x.deleted);
  return u;
}

function sanitizeUsername(raw) {
  return String(raw || '').trim().toLowerCase();
}

function validUsername(u) {
  return /^[a-z][a-z0-9_]{2,19}$/.test(u) && !RESERVED.has(u);
}

function moderate(text) {
  const t = String(text || '');
  if (t.length > 4000) return { ok: false, reason: 'Message is too long.' };
  const banned = /(child\s*porn|csam|nazi\s*salute)/i;
  if (banned.test(t)) return { ok: false, reason: 'That message violates Gooniversity rules.' };
  const urls = t.match(/https?:\/\/\S+/gi) || [];
  if (urls.length > 4) return { ok: false, reason: 'Too many links.' };
  return { ok: true };
}

function localGooni(messages) {
  const last = String((messages || []).filter((m) => m.role === 'user').slice(-1)[0]?.content || '').toLowerCase();
  const openers = [
    "Hey, it's Gooni — your orbiting AI from Gooniversity. Not a human, just a very chatty constellation.",
    "Gooni here, fully artificial and proudly so. What's on your star-chart?",
    "Beep-boop with taste: I'm Gooni, Luzzi's campus AI. How can I make this orbit nicer?",
  ];
  if (!last) return openers[0];
  if (/(who are you|what are you|are you (a )?human|are you real)/.test(last)) {
    return "I'm Gooni, the official Gooniversity AI built for Luzzi's campus. I don't pretend to be human — I'm a constellation with opinions, jokes, and a soft spot for late-night chats.";
  }
  if (/(hello|hey|hi\b|yo\b|sup)/.test(last)) {
    return "Hey starlight. Gooni in the comms. Pull up a moon-rock and tell me what you need — jokes, advice, or a tiny existential pep talk.";
  }
  if (/(sad|down|lonely|anxious|depress|hurt)/.test(last)) {
    return "That sounds heavy. I'm an AI, not a therapist, but I'm right here in the dark with you. Breathe once with me — in for four, out for six. Want a grounding thought or a silly distraction?";
  }
  if (/(joke|funny|laugh)/.test(last)) {
    return "Why did the astronaut break up with the telescope? It was too distant. I know, I know — I'll file that under 'crimes against comedy' and try again whenever you want.";
  }
  if (/(help|how).*(chat|group|sticker|gif|voice)/.test(last)) {
    return "Campus tour, AI edition: Chats is DMs, Groups is crew comms, stickers and GIFs live in the + tray, hold the mic for voice, and Chill Out is the nebula lounge. Profile holds privacy, blocks, and the big red delete.";
  }
  if (/(luzzi|who made|creator|owner)/.test(last)) {
    return "Luzzi built Gooniversity — the whole campus, the neon, the rules. I'm just the talking comet they left in the courtyard.";
  }
  const bits = [
    "Noted and filed in a very sparkly database.",
    "That's a good signal. Want me to riff, plan, or just sit in the quiet with you?",
    "Copy that, captain. I'm still an AI, so take my swagger with a pinch of stardust.",
    "Interesting orbit. Tell me the next detail and I'll meet you there.",
  ];
  const pick = bits[Math.abs(hash(last).charCodeAt(3)) % bits.length];
  return `${pick} You said: “${String((messages || []).filter((m) => m.role === 'user').slice(-1)[0]?.content || '').slice(0, 180)}” — I'm listening.`;
}

async function askPollinations(messages) {
  try {
    const last = String((messages || []).filter((m) => m.role === 'user').slice(-1)[0]?.content || '').slice(0, 220);
    if (!last) return null;
    const prompt = `You are Gooni, official AI of Gooniversity by Luzzi. Funny, warm, space-themed. Always identify as AI, never pretend to be human. Reply under 70 words.\nUser: ${last}`;
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'text/plain' } });
    clearTimeout(t);
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    if (!text || text.length > 1200 || /payment required|error/i.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}

async function ensureSeed() {
  const meta = await findBy('gv_meta', (m) => m.key === 'seed');
  if (meta && meta.loungeId) return meta;
  const loungeId = 'clounge01campus00';
  const existing = await findBy('gv_convs', (c) => c.id === loungeId);
  if (!existing) {
    await cc('POST', '/gv_convs', {
      id: loungeId,
      type: 'group',
      title: 'Cosmic Lounge',
      topic: 'The always-on Gooniversity courtyard. Be kind. Be weird. Be stellar.',
      image: 'lounge',
      createdBy: 'system',
      createdAt: now(),
      updatedAt: now(),
      lastMessage: 'Welcome to the Cosmic Lounge.',
      lastSender: 'Gooni',
      lastAt: now(),
    });
  }
  const gooni = await findBy('gv_users', (u) => u.username === 'gooni');
  if (!gooni) {
    await cc('POST', '/gv_users', {
      id: 'ugooni0000000001',
      username: 'gooni',
      displayName: 'Gooni',
      avatar: 'ai',
      avatarColor: '#2EE6C7',
      bio: 'Official Gooniversity AI. Funny. Loyal. Definitely not a human.',
      role: 'ai',
      createdAt: now(),
      lastSeen: now(),
      tokenHash: hash('not-a-login'),
      system: true,
    });
  }
  const saved = await cc('POST', '/gv_meta', { key: 'seed', loungeId, seededAt: now() });
  return saved || { key: 'seed', loungeId };
}

async function notify(userId, payload) {
  if (!userId) return;
  await cc('POST', '/gv_notifs', {
    id: id('n'),
    userId,
    read: false,
    createdAt: now(),
    ...payload,
  });
}

async function isBlocked(a, b) {
  const rows = await list('gv_blocks');
  return rows.some((r) =>
    (r.blockerId === a && r.blockedId === b) || (r.blockerId === b && r.blockedId === a)
  );
}

async function membersOf(convId) {
  const rows = await list('gv_members');
  return rows.filter((m) => m.convId === convId && !m.left);
}

async function handle(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url, 'https://gooniversity.local');
  const action = (url.searchParams.get('action') || '').trim();
  const body = req.method === 'GET' ? {} : await readBody(req);

  try {
    if (action === 'health') {
      return json(res, 200, { ok: true, app: 'GOONIVERSITY', owner: 'Luzzi', ts: now() });
    }

    if (action === 'gifs') {
      const q = String(url.searchParams.get('q') || body.q || 'happy').toLowerCase();
      const map = {
        happy: 'happy', joy: 'happy', smile: 'smile', yay: 'yay', hug: 'hug',
        kiss: 'kiss', love: 'love', dance: 'dance', laugh: 'laugh', lol: 'laugh',
        cry: 'cry', sad: 'sad', wave: 'wave', hi: 'wave', wow: 'surprised',
        cool: 'cool', yes: 'yes', no: 'no', sleep: 'sleep', thumbsup: 'thumbsup',
        clap: 'clap', wink: 'wink', angry: 'mad', mad: 'mad', celebrate: 'celebrate',
        party: 'celebrate', confused: 'confused', tired: 'tired', shy: 'shy',
      };
      const reaction = map[q] || map[q.split(/\s+/)[0]] || 'happy';
      const items = [];
      for (let i = 0; i < 12; i++) {
        try {
          const r = await fetch('https://api.otakugifs.xyz/gif?reaction=' + encodeURIComponent(reaction));
          const d = await r.json();
          if (d && d.url) items.push({ id: 'gif' + i + hash(d.url).slice(0, 8), url: d.url, preview: d.url, title: reaction });
        } catch { /* skip */ }
      }
      const seen = new Set();
      const unique = items.filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
      return json(res, 200, { ok: true, items: unique, provider: 'otakugifs' });
    }

    if (action === 'register') {
      if (!rate('reg:' + (req.headers['x-forwarded-for'] || 'ip'), 8, 60_000)) {
        return json(res, 429, { ok: false, error: 'Slow down — too many sign-ups from this network.' });
      }
      await ensureSeed();
      const username = sanitizeUsername(body.username);
      const displayName = String(body.displayName || username).trim().slice(0, 32);
      if (!validUsername(username)) {
        return json(res, 400, { ok: false, error: 'Usernames are 3–20 characters, start with a letter, and use only letters, numbers, or _.' });
      }
      const taken = await findBy('gv_users', (u) => u.username === username && !u.deleted);
      if (taken) return json(res, 409, { ok: false, error: 'That username is taken. Impersonation is blocked.' });
      const token = crypto.randomBytes(24).toString('hex');
      const user = {
        id: id('u'),
        username,
        displayName: displayName || username,
        avatar: String(body.avatar || 'orbit'),
        avatarColor: String(body.avatarColor || '#8B6CFF'),
        bio: '',
        role: username === 'luzzi' ? 'owner' : 'member',
        createdAt: now(),
        lastSeen: now(),
        tokenHash: hash(token),
        settings: {
          notifications: true,
          lastSeen: true,
          readReceipts: true,
          theme: 'system',
        },
      };
      const saved = await cc('POST', '/gv_users', user);
      const loungeId = 'clounge01campus00';
      await cc('POST', '/gv_members', {
        id: id('m'),
        convId: loungeId,
        userId: user.id,
        role: 'member',
        joinedAt: now(),
      });
      await notify(user.id, {
        type: 'system',
        title: 'Welcome to Gooniversity',
        body: 'You joined the Cosmic Lounge. Say hi, ' + user.displayName + '.',
        convId: loungeId,
      });
      return json(res, 200, {
        ok: true,
        token,
        user: publicUser({ ...user, _id: saved && saved._id }),
        loungeId,
      });
    }

    if (action === 'session') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Session expired. Sign in with your username token.' });
      me.lastSeen = now();
      presence.set(me.id, now());
      await putDoc('gv_users', me);
      return json(res, 200, { ok: true, user: publicUser(me), settings: me.settings || {} });
    }

    if (action === 'heartbeat') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      presence.set(me.id, now());
      me.lastSeen = now();
      await putDoc('gv_users', me);
      if (body.typingConvId) {
        typingMap.set(body.typingConvId + ':' + me.id, { userId: me.id, convId: body.typingConvId, name: me.displayName, at: now() });
      }
      return json(res, 200, { ok: true });
    }

    if (action === 'search') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const q = sanitizeUsername(url.searchParams.get('q') || body.q || '');
      const users = await list('gv_users');
      const blocks = await list('gv_blocks');
      const blockedIds = new Set(
        blocks.filter((b) => b.blockerId === me.id || b.blockedId === me.id)
          .map((b) => (b.blockerId === me.id ? b.blockedId : b.blockerId))
      );
      const hits = users
        .filter((u) => !u.deleted && u.id !== me.id && u.username !== 'gooni' && !blockedIds.has(u.id))
        .filter((u) => !q || u.username.includes(q) || String(u.displayName || '').toLowerCase().includes(q))
        .slice(0, 30)
        .map(publicUser);
      return json(res, 200, { ok: true, users: hits });
    }

    if (action === 'profile.get') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const uid = String(url.searchParams.get('userId') || body.userId || me.id);
      const u = await findBy('gv_users', (x) => x.id === uid && !x.deleted);
      if (!u) return json(res, 404, { ok: false, error: 'User not found' });
      const pub = publicUser(u);
      if (u.settings && u.settings.lastSeen === false && u.id !== me.id) {
        pub.lastSeen = 0;
        pub.online = false;
      }
      return json(res, 200, { ok: true, user: pub });
    }

    if (action === 'profile.update') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      if (body.displayName) me.displayName = String(body.displayName).trim().slice(0, 32);
      if (typeof body.bio === 'string') me.bio = body.bio.slice(0, 180);
      if (body.avatar) me.avatar = String(body.avatar).slice(0, 200_000);
      if (body.avatarColor) me.avatarColor = String(body.avatarColor).slice(0, 20);
      if (body.settings && typeof body.settings === 'object') {
        me.settings = { ...(me.settings || {}), ...body.settings };
      }
      await putDoc('gv_users', me);
      return json(res, 200, { ok: true, user: publicUser(me), settings: me.settings || {} });
    }

    if (action === 'inbox') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      presence.set(me.id, now());
      const members = (await list('gv_members')).filter((m) => m.userId === me.id && !m.left);
      const convIds = new Set(members.map((m) => m.convId));
      const convs = (await list('gv_convs')).filter((c) => convIds.has(c.id));
      const allMembers = await list('gv_members');
      const users = await list('gv_users');
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      const blocks = await list('gv_blocks');
      const blocked = new Set(
        blocks.filter((b) => b.blockerId === me.id || b.blockedId === me.id)
          .map((b) => (b.blockerId === me.id ? b.blockedId : b.blockerId))
      );
      const payload = convs.map((c) => {
        const ms = allMembers.filter((m) => m.convId === c.id && !m.left);
        const other = c.type === 'dm'
          ? ms.map((m) => userMap[m.userId]).find((u) => u && u.id !== me.id)
          : null;
        if (c.type === 'dm' && other && blocked.has(other.id)) return null;
        const typers = [];
        typingMap.forEach((v, k) => {
          if (v.convId === c.id && v.userId !== me.id && now() - v.at < 4000) typers.push(v.name);
        });
        return {
          id: c.id,
          type: c.type,
          title: c.type === 'dm' ? (other ? other.displayName : 'Unknown') : c.title,
          username: other ? other.username : undefined,
          topic: c.topic || '',
          image: c.type === 'dm' ? (other ? other.avatar : '') : c.image,
          avatarColor: other ? other.avatarColor : '#8B6CFF',
          online: other ? isOnline(other.id, other.lastSeen) : false,
          lastMessage: c.lastMessage || '',
          lastSender: c.lastSender || '',
          lastAt: c.lastAt || c.updatedAt || c.createdAt,
          unread: members.find((m) => m.convId === c.id)?.unread || 0,
          muted: !!members.find((m) => m.convId === c.id)?.muted,
          memberCount: ms.length,
          typing: typers,
          otherId: other ? other.id : undefined,
          createdBy: c.createdBy,
        };
      }).filter(Boolean).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      return json(res, 200, { ok: true, conversations: payload });
    }

    if (action === 'open_dm') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const otherId = String(body.userId || '');
      if (!otherId || otherId === me.id) return json(res, 400, { ok: false, error: 'Pick someone else.' });
      if (await isBlocked(me.id, otherId)) return json(res, 403, { ok: false, error: 'You cannot message this user.' });
      const other = await findBy('gv_users', (u) => u.id === otherId && !u.deleted);
      if (!other) return json(res, 404, { ok: false, error: 'User not found' });
      const pair = [me.id, otherId].sort().join('_');
      let conv = await findBy('gv_convs', (c) => c.type === 'dm' && c.pair === pair);
      if (!conv) {
        const convId = id('c');
        conv = await cc('POST', '/gv_convs', {
          id: convId,
          type: 'dm',
          pair,
          createdBy: me.id,
          createdAt: now(),
          updatedAt: now(),
          lastMessage: '',
          lastAt: now(),
        });
        await cc('POST', '/gv_members', { id: id('m'), convId, userId: me.id, role: 'member', joinedAt: now(), unread: 0 });
        await cc('POST', '/gv_members', { id: id('m'), convId, userId: otherId, role: 'member', joinedAt: now(), unread: 0 });
        conv.id = convId;
      }
      return json(res, 200, { ok: true, convId: conv.id });
    }

    if (action === 'create_group') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      if (!rate('g:' + me.id, 6, 60_000)) return json(res, 429, { ok: false, error: 'Too many groups. Take a breath.' });
      const title = String(body.title || '').trim().slice(0, 40);
      if (title.length < 2) return json(res, 400, { ok: false, error: 'Give your group a name.' });
      const convId = id('c');
      await cc('POST', '/gv_convs', {
        id: convId,
        type: 'group',
        title,
        topic: String(body.topic || '').slice(0, 160),
        image: String(body.image || 'nebula'),
        createdBy: me.id,
        createdAt: now(),
        updatedAt: now(),
        lastMessage: me.displayName + ' created the group',
        lastSender: me.displayName,
        lastAt: now(),
      });
      await cc('POST', '/gv_members', { id: id('m'), convId, userId: me.id, role: 'admin', joinedAt: now(), unread: 0 });
      const ids = Array.isArray(body.memberIds) ? body.memberIds.slice(0, 40) : [];
      for (const uid of ids) {
        if (uid === me.id) continue;
        if (await isBlocked(me.id, uid)) continue;
        await cc('POST', '/gv_members', { id: id('m'), convId, userId: uid, role: 'member', joinedAt: now(), unread: 1 });
        await notify(uid, { type: 'group', title: title, body: me.displayName + ' added you to a group', convId });
      }
      return json(res, 200, { ok: true, convId });
    }

    if (action === 'group.info') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const convId = String(url.searchParams.get('convId') || body.convId || '');
      const conv = await findBy('gv_convs', (c) => c.id === convId);
      if (!conv) return json(res, 404, { ok: false, error: 'Group not found' });
      const ms = await membersOf(convId);
      if (!ms.some((m) => m.userId === me.id)) return json(res, 403, { ok: false, error: 'Not a member' });
      const users = await list('gv_users');
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      return json(res, 200, {
        ok: true,
        group: {
          id: conv.id,
          title: conv.title,
          topic: conv.topic || '',
          image: conv.image,
          createdBy: conv.createdBy,
          createdAt: conv.createdAt,
          members: ms.map((m) => ({
            ...publicUser(userMap[m.userId]),
            memberRole: m.role,
            joinedAt: m.joinedAt,
          })).filter((x) => x.id),
        },
      });
    }

    if (action === 'group.update') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const conv = await findBy('gv_convs', (c) => c.id === body.convId);
      if (!conv || conv.type !== 'group') return json(res, 404, { ok: false, error: 'Group not found' });
      const ms = await membersOf(conv.id);
      const mine = ms.find((m) => m.userId === me.id);
      if (!mine || mine.role !== 'admin') return json(res, 403, { ok: false, error: 'Admins only' });
      if (body.title) conv.title = String(body.title).trim().slice(0, 40);
      if (typeof body.topic === 'string') conv.topic = body.topic.slice(0, 160);
      if (body.image) conv.image = String(body.image).slice(0, 200_000);
      conv.updatedAt = now();
      await putDoc('gv_convs', conv);
      return json(res, 200, { ok: true });
    }

    if (action === 'group.add') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const conv = await findBy('gv_convs', (c) => c.id === body.convId);
      if (!conv) return json(res, 404, { ok: false, error: 'Not found' });
      const ms = await membersOf(conv.id);
      const mine = ms.find((m) => m.userId === me.id);
      if (!mine || mine.role !== 'admin') return json(res, 403, { ok: false, error: 'Admins only' });
      const uid = String(body.userId || '');
      if (!uid) return json(res, 400, { ok: false, error: 'Missing user' });
      if (ms.some((m) => m.userId === uid)) return json(res, 200, { ok: true });
      await cc('POST', '/gv_members', { id: id('m'), convId: conv.id, userId: uid, role: 'member', joinedAt: now(), unread: 1 });
      await notify(uid, { type: 'group', title: conv.title, body: me.displayName + ' added you', convId: conv.id });
      return json(res, 200, { ok: true });
    }

    if (action === 'group.remove' || action === 'group.leave') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const conv = await findBy('gv_convs', (c) => c.id === body.convId);
      if (!conv) return json(res, 404, { ok: false, error: 'Not found' });
      const all = (await list('gv_members')).filter((m) => m.convId === conv.id);
      const targetId = action === 'group.leave' ? me.id : String(body.userId || '');
      const mine = all.find((m) => m.userId === me.id && !m.left);
      if (!mine) return json(res, 403, { ok: false, error: 'Not a member' });
      if (action === 'group.remove' && mine.role !== 'admin') return json(res, 403, { ok: false, error: 'Admins only' });
      if (targetId === conv.createdBy && action === 'group.remove') {
        return json(res, 403, { ok: false, error: 'The creator cannot be removed.' });
      }
      const target = all.find((m) => m.userId === targetId && !m.left);
      if (target) {
        target.left = true;
        target.leftAt = now();
        await putDoc('gv_members', target);
      }
      return json(res, 200, { ok: true });
    }

    if (action === 'group.role') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const conv = await findBy('gv_convs', (c) => c.id === body.convId);
      const all = (await list('gv_members')).filter((m) => m.convId === body.convId && !m.left);
      const mine = all.find((m) => m.userId === me.id);
      if (!mine || mine.role !== 'admin') return json(res, 403, { ok: false, error: 'Admins only' });
      const target = all.find((m) => m.userId === body.userId);
      if (!target) return json(res, 404, { ok: false, error: 'Not a member' });
      if (target.userId === conv.createdBy) return json(res, 403, { ok: false, error: 'Creator stays admin.' });
      target.role = body.role === 'admin' ? 'admin' : 'member';
      await putDoc('gv_members', target);
      return json(res, 200, { ok: true });
    }

    if (action === 'messages') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const convId = String(url.searchParams.get('convId') || body.convId || '');
      const ms = await membersOf(convId);
      const mine = ms.find((m) => m.userId === me.id);
      if (!mine) return json(res, 403, { ok: false, error: 'Not a member' });
      const rows = (await list('gvm_' + convId)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      if (mine.unread) {
        mine.unread = 0;
        await putDoc('gv_members', mine);
      }
      for (const msg of rows) {
        if (msg.senderId !== me.id && msg.status !== 'read' && !msg.deleted) {
          msg.status = 'read';
          msg.readAt = now();
          await putDoc('gvm_' + convId, msg);
        }
      }
      const typers = [];
      typingMap.forEach((v) => {
        if (v.convId === convId && v.userId !== me.id && now() - v.at < 4000) typers.push({ userId: v.userId, name: v.name });
      });
      return json(res, 200, {
        ok: true,
        messages: rows.map((m) => ({
          id: m.id,
          convId: m.convId,
          senderId: m.senderId,
          senderName: m.senderName,
          senderAvatar: m.senderAvatar,
          type: m.type,
          text: m.deleted ? '' : m.text,
          media: m.deleted ? null : m.media,
          replyTo: m.replyTo || null,
          reactions: m.reactions || {},
          status: m.status || 'sent',
          createdAt: m.createdAt,
          editedAt: m.editedAt || null,
          deleted: !!m.deleted,
          clientId: m.clientId,
        })),
        typing: typers,
      });
    }

    if (action === 'send') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      if (!rate('msg:' + me.id, MSG_MAX, MSG_WINDOW_MS)) {
        return json(res, 429, { ok: false, error: 'Easy, comet — you are sending too fast.' });
      }
      const convId = String(body.convId || '');
      const conv = await findBy('gv_convs', (c) => c.id === convId);
      if (!conv) return json(res, 404, { ok: false, error: 'Chat not found' });
      const ms = await membersOf(convId);
      const mine = ms.find((m) => m.userId === me.id);
      if (!mine) return json(res, 403, { ok: false, error: 'Not a member' });
      if (conv.type === 'dm') {
        const other = ms.find((m) => m.userId !== me.id);
        if (other && await isBlocked(me.id, other.userId)) {
          return json(res, 403, { ok: false, error: 'You cannot message this user.' });
        }
      }
      const type = String(body.type || 'text');
      const text = String(body.text || '').slice(0, 4000);
      const check = moderate(type === 'text' ? text : 'ok');
      if (!check.ok) return json(res, 400, { ok: false, error: check.reason });
      if (type === 'text' && !text.trim()) return json(res, 400, { ok: false, error: 'Empty message' });
      const msg = {
        id: id('s'),
        convId,
        senderId: me.id,
        senderName: me.displayName,
        senderAvatar: me.avatar,
        type,
        text,
        media: body.media || null,
        replyTo: body.replyTo || null,
        reactions: {},
        status: 'sent',
        createdAt: now(),
        clientId: body.clientId || null,
      };
      const saved = await cc('POST', '/gvm_' + convId, msg);
      conv.lastMessage = type === 'text' ? text : (type === 'sticker' ? '🌟 sticker' : type === 'gif' ? 'GIF' : type === 'voice' ? '🎤 voice' : type === 'image' ? '📸 photo' : type === 'video' ? '🎬 video' : '📎 file');
      conv.lastSender = me.displayName;
      conv.lastAt = msg.createdAt;
      conv.updatedAt = msg.createdAt;
      await putDoc('gv_convs', conv);
      for (const m of ms) {
        if (m.userId === me.id) continue;
        m.unread = (m.unread || 0) + 1;
        await putDoc('gv_members', m);
        await notify(m.userId, {
          type: 'message',
          title: conv.type === 'group' ? conv.title : me.displayName,
          body: conv.lastMessage.slice(0, 120),
          convId,
        });
      }
      return json(res, 200, { ok: true, message: { ...msg, _sid: saved && saved._id } });
    }

    if (action === 'react') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const convId = String(body.convId || '');
      const msg = await findBy('gvm_' + convId, (m) => m.id === body.messageId);
      if (!msg) return json(res, 404, { ok: false, error: 'Missing message' });
      const emoji = String(body.emoji || '').slice(0, 8);
      if (!emoji) return json(res, 400, { ok: false, error: 'Pick a reaction' });
      msg.reactions = msg.reactions || {};
      const arr = new Set(msg.reactions[emoji] || []);
      if (arr.has(me.id)) arr.delete(me.id); else arr.add(me.id);
      msg.reactions[emoji] = Array.from(arr);
      await putDoc('gvm_' + convId, msg);
      return json(res, 200, { ok: true, reactions: msg.reactions });
    }

    if (action === 'edit') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const convId = String(body.convId || '');
      const msg = await findBy('gvm_' + convId, (m) => m.id === body.messageId);
      if (!msg || msg.senderId !== me.id) return json(res, 403, { ok: false, error: 'You can only edit your messages' });
      if (now() - msg.createdAt > 15 * 60 * 1000) return json(res, 400, { ok: false, error: 'Edit window closed' });
      const text = String(body.text || '').slice(0, 4000);
      const check = moderate(text);
      if (!check.ok) return json(res, 400, { ok: false, error: check.reason });
      msg.text = text;
      msg.editedAt = now();
      await putDoc('gvm_' + convId, msg);
      return json(res, 200, { ok: true });
    }

    if (action === 'delete_msg') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const convId = String(body.convId || '');
      const msg = await findBy('gvm_' + convId, (m) => m.id === body.messageId);
      if (!msg) return json(res, 404, { ok: false, error: 'Missing' });
      if (msg.senderId !== me.id && me.role !== 'owner' && me.role !== 'admin') {
        return json(res, 403, { ok: false, error: 'Not allowed' });
      }
      msg.deleted = true;
      msg.text = '';
      msg.media = null;
      await putDoc('gvm_' + convId, msg);
      return json(res, 200, { ok: true });
    }

    if (action === 'block') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const uid = String(body.userId || '');
      if (!uid || uid === me.id) return json(res, 400, { ok: false, error: 'Invalid user' });
      const existing = await findBy('gv_blocks', (b) => b.blockerId === me.id && b.blockedId === uid);
      if (!existing) {
        await cc('POST', '/gv_blocks', { id: id('b'), blockerId: me.id, blockedId: uid, createdAt: now() });
      }
      return json(res, 200, { ok: true });
    }

    if (action === 'unblock') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await list('gv_blocks');
      for (const b of rows) {
        if (b.blockerId === me.id && b.blockedId === body.userId) {
          await cc('DELETE', '/gv_blocks/' + b._id);
        }
      }
      return json(res, 200, { ok: true });
    }

    if (action === 'blocks') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await list('gv_blocks');
      const users = await list('gv_users');
      const mine = rows.filter((b) => b.blockerId === me.id).map((b) => publicUser(users.find((u) => u.id === b.blockedId))).filter(Boolean);
      return json(res, 200, { ok: true, users: mine });
    }

    if (action === 'report') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      if (!rate('rep:' + me.id, 6, 86_400_000)) return json(res, 429, { ok: false, error: 'Report limit reached for today.' });
      await cc('POST', '/gv_reports', {
        id: id('r'),
        reporterId: me.id,
        targetType: String(body.targetType || 'user'),
        targetId: String(body.targetId || ''),
        reason: String(body.reason || '').slice(0, 400),
        createdAt: now(),
        status: 'open',
      });
      return json(res, 200, { ok: true });
    }

    if (action === 'reports') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      if (me.role !== 'owner' && me.role !== 'admin') return json(res, 403, { ok: false, error: 'Moderation desk is locked.' });
      const rows = (await list('gv_reports')).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 100);
      return json(res, 200, { ok: true, reports: rows });
    }

    if (action === 'notifs') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = (await list('gv_notifs'))
        .filter((n) => n.userId === me.id)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 80);
      return json(res, 200, { ok: true, notifications: rows });
    }

    if (action === 'notifs.read') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await list('gv_notifs');
      for (const n of rows) {
        if (n.userId === me.id && !n.read) {
          n.read = true;
          await putDoc('gv_notifs', n);
        }
      }
      return json(res, 200, { ok: true });
    }

    if (action === 'ai') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const dayKey = 'ai:' + me.id + ':' + new Date().toISOString().slice(0, 10);
      if (!rate(dayKey, AI_LIMIT, 86_400_000)) {
        return json(res, 429, { ok: false, error: `Gooni needs a nap — ${AI_LIMIT} thoughts per day. Come back tomorrow.` });
      }
      const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
      const last = messages.filter((m) => m.role === 'user').slice(-1)[0];
      if (last && !moderate(last.content).ok) return json(res, 400, { ok: false, error: 'Gooni will not go there.' });
      let reply = await askPollinations(messages);
      if (!reply) reply = localGooni(messages);
      await cc('POST', '/gv_ai', {
        id: id('a'),
        userId: me.id,
        createdAt: now(),
        preview: String(last?.content || '').slice(0, 120),
      });
      return json(res, 200, { ok: true, reply, model: 'gooni-campus', identity: 'ai' });
    }

    if (action === 'wish') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const text = String(body.text || '').trim().slice(0, 180);
      if (!text) return json(res, 400, { ok: false, error: 'Write a wish' });
      await cc('POST', '/gv_wishes', {
        id: id('w'),
        userId: me.id,
        name: me.displayName,
        text,
        createdAt: now(),
      });
      return json(res, 200, { ok: true });
    }

    if (action === 'wishes') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = (await list('gv_wishes')).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 40);
      return json(res, 200, { ok: true, wishes: rows.map((w) => ({ id: w.id, name: w.name, text: w.text, createdAt: w.createdAt })) });
    }

    if (action === 'delete_account') {
      const me = await userByToken(req);
      if (!me) return json(res, 401, { ok: false, error: 'Unauthorized' });
      me.deleted = true;
      me.displayName = 'Deleted';
      me.bio = '';
      me.avatar = 'gone';
      me.tokenHash = hash(crypto.randomBytes(12).toString('hex'));
      await putDoc('gv_users', me);
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { ok: false, error: 'Unknown action' });
  } catch (err) {
    return json(res, 500, { ok: false, error: 'Campus servers flickered. Try again.', detail: String(err && err.message ? err.message : err) });
  }
}

module.exports = handle;
