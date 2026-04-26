import { createContext, useState, useContext, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { getToken } from '@/api/auth';
import { listConversations, createConversation, deleteConversation } from '@/api/conversations';
import useWebSocket from '@/hooks/useWebSocket';
import type { ChatChannel, WebSocketEvent, WebSocketStatus } from '@/types';
import type { InternalChannel, InternalMessage, UserProfile } from '@/types/chat';

// ---------------------------------------------------------------------------
// Types kept for internal use (same shape as before, renamed to avoid clash)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Context value — provides BOTH new API AND backward-compatible aliases
// ---------------------------------------------------------------------------

export interface ChatContextValue {
  // === NEW API ===

  // Auth
  token: string | null;
  isAuthenticated: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;

  // Channels (new flat array)
  channelsList: InternalChannel[];
  currentChannelId: string | null;
  isLoadingChannels: boolean;
  loadChannels: () => Promise<void>;
  addChannel: () => Promise<InternalChannel | null>;
  removeChannel: (id: string) => Promise<void>;
  selectChannel: (id: string) => void;

  // WebSocket
  wsStatus: WebSocketStatus;
  isStreaming: boolean;
  currentTokens: string;
  sendWSMessage: (content: string) => void;
  disconnectWS: () => void;

  // Messages (new flat array)
  messagesFlat: InternalMessage[];
  addMessage: (message: InternalMessage) => void;
  clearMessages: () => void;

  // === BACKWARD-COMPATIBLE ALIASES ===

  // channels: old-style ChatChannel[] derived from InternalChannel[]
  channels: ChatChannel[];

  // activeChannel: derived from currentChannelId + channels
  activeChannel: ChatChannel | null;

  // setActiveChannel: wraps selectChannel, accepts ChatChannel | null
  setActiveChannel: (channel: ChatChannel | null) => void;

  // currentUser: static default user profile
  currentUser: UserProfile;

  // sendMessage: old 4-arg signature (channelId, content, userId, userName)
  sendMessage: (channelId: string, content: string, userId: string, userName: string) => void;

  // messages: Record<string, InternalMessage[]> derived from messagesFlat
  messages: Record<string, InternalMessage[]>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ChatContext = createContext<ChatContextValue | null>(null);

function ChatProvider({ children }: { children: ReactNode }) {
  // -----------------------------------------------------------------------
  // Auth state
  // -----------------------------------------------------------------------
  const [token, setToken] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Channel state — stored as InternalChannel[] internally
  // -----------------------------------------------------------------------
  const [channels, setChannels] = useState<InternalChannel[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

  // -----------------------------------------------------------------------
  // Message state — stored as flat array internally
  // -----------------------------------------------------------------------
  const [messages, setMessages] = useState<InternalMessage[]>([]);

  // -----------------------------------------------------------------------
  // Derive the threadId for the current channel (used by useWebSocket)
  // -----------------------------------------------------------------------
  const currentThread =
    channels.find((ch) => ch.id === currentChannelId)?.threadId ?? null;

  // -----------------------------------------------------------------------
  // WebSocket integration
  // -----------------------------------------------------------------------
  const {
    status: wsStatus,
    isStreaming,
    currentTokens,
    send: wsSend,
    disconnect: wsDisconnect,
  } = useWebSocket({
    channelId: currentThread,
    token,
    onMessage: useCallback((event: WebSocketEvent) => {
      // Find the last streaming agent text message by scanning backwards
      // (safe even if tool-call messages are interleaved in the array).
      const findLastStreamingIndex = (arr: InternalMessage[]): number => {
        for (let i = arr.length - 1; i >= 0; i--) {
          const m = arr[i]!;
          if (m.sender === 'agent' && m.isStreaming && m.kind !== 'tool_call') {
            return i;
          }
        }
        return -1;
      };

      if (event.type === 'token') {
        setMessages((prev) => {
          const target = findLastStreamingIndex(prev);
          if (target === -1) return prev;
          return prev.map((msg, i) =>
            i === target
              ? { ...msg, content: msg.content + (event.content ?? '') }
              : msg,
          );
        });
      } else if (event.type === 'done') {
        setMessages((prev) => {
          const target = findLastStreamingIndex(prev);
          if (target === -1) return prev;
          return prev.map((msg, i) =>
            i === target ? { ...msg, isStreaming: false } : msg,
          );
        });
      } else if (event.type === 'tool_call') {
        const toolEvent = event as unknown as {
          name?: string;
          args?: Record<string, unknown>;
        };
        setMessages((prev) => [
          ...prev,
          {
            id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            channelId: currentChannelId ?? '',
            content: '',
            sender: 'agent',
            timestamp: Date.now(),
            kind: 'tool_call',
            toolName: toolEvent.name ?? 'desconocida',
            toolArgs: toolEvent.args ?? {},
          },
        ]);
      }
    }, [currentChannelId]),
  });

  // -----------------------------------------------------------------------
  // Auth actions
  // -----------------------------------------------------------------------
  const login = useCallback(async (userId: string) => {
    const response = await getToken(userId);
    setToken(response.access_token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setChannels([]);
    setCurrentChannelId(null);
    setMessages([]);
  }, []);

  // -----------------------------------------------------------------------
  // Channel actions
  // -----------------------------------------------------------------------
  const loadChannels = useCallback(async () => {
    if (!token) return;
    setIsLoadingChannels(true);
    try {
      const data = await listConversations(token);
      const mapped: InternalChannel[] = data.conversations.map((conv) => ({
        id: conv.thread_id,
        threadId: conv.thread_id,
        label: `Conversation ${conv.thread_id.slice(0, 8)}`,
        createdAt: conv.last_activity
          ? new Date(conv.last_activity).getTime()
          : Date.now(),
      }));
      setChannels(mapped);
    } finally {
      setIsLoadingChannels(false);
    }
  }, [token]);

  const addChannel = useCallback(
    async (): Promise<InternalChannel | null> => {
      if (!token) return null;
      try {
        const data = await createConversation(token);
        const channel: InternalChannel = {
          id: data.thread_id,
          threadId: data.thread_id,
          label: `Conversation ${data.thread_id.slice(0, 8)}`,
          createdAt: Date.now(),
        };
        setChannels((prev) => [...prev, channel]);
        setCurrentChannelId(channel.id);
        setMessages([]);
        return channel;
      } catch (err) {
        console.error('[ChatContext] Failed to create channel:', err);
        return null;
      }
    },
    [token],
  );

  const removeChannel = useCallback(
    async (id: string) => {
      const channel = channels.find((ch) => ch.id === id);
      if (!channel || !token) return;
      try {
        await deleteConversation(token, channel.threadId);
        setChannels((prev) => prev.filter((ch) => ch.id !== id));
        if (currentChannelId === id) {
          setCurrentChannelId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error('[ChatContext] Failed to remove channel:', err);
      }
    },
    [channels, currentChannelId, token],
  );

  const selectChannel = useCallback((id: string) => {
    setCurrentChannelId(id);
    setMessages([]);
  }, []);

  // -----------------------------------------------------------------------
  // WebSocket / message actions (new flat API)
  // -----------------------------------------------------------------------
  const sendWSMessage = useCallback(
    (content: string) => {
      if (!currentChannelId) return;

      const userMsg: InternalMessage = {
        id: `msg-${Date.now()}-user`,
        channelId: currentChannelId,
        content,
        sender: 'user',
        timestamp: Date.now(),
      };

      const agentMsg: InternalMessage = {
        id: `msg-${Date.now()}-agent`,
        channelId: currentChannelId,
        content: '',
        sender: 'agent',
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, agentMsg]);
      wsSend(content);
    },
    [currentChannelId, wsSend],
  );

  const disconnectWS = useCallback(() => {
    wsDisconnect();
  }, [wsDisconnect]);

  // -----------------------------------------------------------------------
  // Message actions (new flat API)
  // -----------------------------------------------------------------------
  const addMessage = useCallback((message: InternalMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // -----------------------------------------------------------------------
  // Side effects: auto-login on mount, then load channels when token changes
  // -----------------------------------------------------------------------

  // Auto-login on initial mount so that token is non-null and API calls work
  useEffect(() => {
    login('user-1');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only on mount
  }, []);

  // Load channels whenever token becomes available (fires after login succeeds)
  useEffect(() => {
    if (token) {
      loadChannels();
    }
  }, [token, loadChannels]);

  // -----------------------------------------------------------------------
  // BACKWARD-COMPATIBLE DERIVED VALUES
  // -----------------------------------------------------------------------

  // currentUser: static default user profile for consumers that expect it
  const currentUser: UserProfile = useMemo(
    () => ({
      id: 'user-1',
      name: 'User',
      avatar: '',
      status: 'online',
    }),
    [],
  );

  // channels (old ChatChannel[]): map InternalChannel[] to ChatChannel[]
  const compatChannels: ChatChannel[] = useMemo(
    () =>
      channels.map((ch) => ({
        id: ch.id,
        name: ch.label,
        type: 'group' as const,
        avatar: '',
        lastMessage: '',
        unreadCount: 0,
        participants: [],
      })),
    [channels],
  );

  // activeChannel: derive from currentChannelId + compatChannels
  const activeChannel: ChatChannel | null = useMemo(() => {
    if (!currentChannelId) return null;
    return compatChannels.find((c) => c.id === currentChannelId) ?? null;
  }, [currentChannelId, compatChannels]);

  // setActiveChannel: wraps selectChannel, accepts ChatChannel | null
  const setActiveChannel = useCallback(
    (channel: ChatChannel | null) => {
      if (channel) {
        selectChannel(channel.id);
      }
    },
    [selectChannel],
  );

  // sendMessage (old 4-arg signature): delegates to sendWSMessage
  const compatSendMessage = useCallback(
    (channelId: string, content: string, _userId: string, _userName: string) => {
      if (!currentChannelId || currentChannelId !== channelId) {
        selectChannel(channelId);
        // Wait a tick for state to update, then send
        setTimeout(() => {
          sendWSMessage(content);
        }, 0);
        return;
      }
      sendWSMessage(content);
    },
    [currentChannelId, sendWSMessage, selectChannel],
  );

  // messages (old Record<string, InternalMessage[]>): reduce flat messages into a map
  const compatMessages: Record<string, InternalMessage[]> = useMemo(
    () =>
      messages.reduce(
        (acc, msg) => {
          const arr = (acc[msg.channelId] = acc[msg.channelId] ?? []);
          arr.push(msg);
          return acc;
        },
        {} as Record<string, InternalMessage[]>,
      ),
    [messages],
  );

  // -----------------------------------------------------------------------
  // Value — merges NEW API with backward-compatible aliases
  // -----------------------------------------------------------------------
  const value: ChatContextValue = {
    // --- NEW API ---
    token,
    isAuthenticated: !!token,
    login,
    logout,
    channelsList: channels,
    currentChannelId,
    isLoadingChannels,
    loadChannels,
    addChannel,
    removeChannel,
    selectChannel,
    wsStatus,
    isStreaming,
    currentTokens,
    sendWSMessage,
    disconnectWS,
    messagesFlat: messages,
    addMessage,
    clearMessages,

    // --- BACKWARD-COMPATIBLE ALIASES ---
    channels: compatChannels,
    activeChannel,
    setActiveChannel,
    currentUser,
    sendMessage: compatSendMessage,
    messages: compatMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return ctx;
}

export { ChatContext, ChatProvider, useChatContext };
