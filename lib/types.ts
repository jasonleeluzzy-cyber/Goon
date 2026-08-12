export type UserRole = 'member' | 'admin' | 'owner' | 'ai';

export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  bio: string;
  online: boolean;
  lastSeen: number;
  createdAt: number;
  role: UserRole;
  memberRole?: 'admin' | 'member';
  joinedAt?: number;
};

export type Settings = {
  notifications?: boolean;
  lastSeen?: boolean;
  readReceipts?: boolean;
  theme?: 'system' | 'dark' | 'light';
};

export type Conversation = {
  id: string;
  type: 'dm' | 'group';
  title: string;
  username?: string;
  topic?: string;
  image?: string;
  avatarColor?: string;
  online?: boolean;
  lastMessage: string;
  lastSender?: string;
  lastAt: number;
  unread: number;
  muted?: boolean;
  memberCount?: number;
  typing?: string[];
  otherId?: string;
  createdBy?: string;
};

export type MessageType = 'text' | 'sticker' | 'gif' | 'image' | 'video' | 'file' | 'voice' | 'system';

export type Message = {
  id: string;
  convId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  text: string;
  media?: any;
  replyTo?: { id: string; text: string; senderName: string } | null;
  reactions: Record<string, string[]>;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: number;
  editedAt?: number | null;
  deleted?: boolean;
  clientId?: string | null;
};

export type GroupInfo = {
  id: string;
  title: string;
  topic: string;
  image?: string;
  createdBy: string;
  createdAt: number;
  members: User[];
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  convId?: string;
  createdAt: number;
  read?: boolean;
};

export type Sticker = {
  id: string;
  emoji: string;
  label: string;
  category: string;
  animated?: boolean;
};

export type GifItem = {
  id: string;
  url: string;
  preview: string;
  title?: string;
};
