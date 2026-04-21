import { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import type { AuthUser, ChatChannel, Message } from '@/types';

interface ChatContextType {
  channels: ChatChannel[];
  activeChannel: ChatChannel | null;
  messages: Record<string, Message[]>;
  currentUser: AuthUser;
  setActiveChannel: (channel: ChatChannel | null) => void;
  sendMessage: (channelId: string, text: string, senderId: string, senderName: string) => void;
  addChannel: (channel: ChatChannel) => void;
  removeChannel: (channelId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const DEFAULT_CURRENT_USER: AuthUser = {
  id: '1',
  name: 'You',
  avatar: '',
  status: 'online',
  token: null,
};

function ChatProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannelState] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentUser] = useState<AuthUser>(DEFAULT_CURRENT_USER);

  const setActiveChannel = useCallback((channel: ChatChannel | null) => {
    if (channel) {
      setActiveChannelState({ ...channel, unreadCount: 0 });
    } else {
      setActiveChannelState(null);
    }
  }, []);

  const sendMessage = useCallback(
    (channelId: string, text: string, senderId: string, senderName: string) => {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        channel_id: channelId,
        sender_id: senderId,
        sender_name: senderName,
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), newMessage],
      }));

      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id === channelId) {
            const isUnread = activeChannel && activeChannel.id !== channelId;
            return {
              ...ch,
              lastMessage: text.trim(),
              unreadCount: isUnread ? ch.unreadCount + 1 : 0,
            };
          }

          if (ch.participants.includes(senderId) && (activeChannel === null || activeChannel.id !== ch.id)) {
            return { ...ch, unreadCount: ch.unreadCount + 1 };
          }

          return ch;
        })
      );
    },
    [activeChannel]
  );

  const addChannel = useCallback((channel: ChatChannel) => {
    setChannels((prev) => [...prev, channel]);
  }, []);

  const removeChannel = useCallback((channelId: string) => {
    setChannels((prev) => prev.filter((ch) => ch.id !== channelId));
    setMessages((prev) => {
      const updated = { ...prev };
      delete updated[channelId];
      return updated;
    });
  }, []);

  const value: ChatContextType = {
    channels,
    activeChannel,
    messages,
    currentUser,
    setActiveChannel,
    sendMessage,
    addChannel,
    removeChannel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

function useChatContext(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return ctx;
}

export { ChatContext, ChatProvider, useChatContext };
