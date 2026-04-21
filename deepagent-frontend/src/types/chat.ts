export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string; // ISO string
  is_edited?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'private';
  avatar: string;
  lastMessage?: string;
  unreadCount: number;
  participants: string[];
}
