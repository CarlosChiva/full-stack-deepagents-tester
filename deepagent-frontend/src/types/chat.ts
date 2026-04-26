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

// --- API Response types ---

/** Response from POST /auth/login or POST /auth/token */
export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
}

/** Response from POST /conversations */
export interface ConversationCreateResponse {
  thread_id: string;
}

/** Entry in the list of conversations from GET /conversations */
export interface ConversationListItem {
  thread_id: string;
  message_count: number;
  last_activity: string | null;
  is_alive: boolean;
}

/** Response from GET /conversations */
export interface ConversationListResponse {
  conversations: ConversationListItem[];
}

// --- WebSocket event types ---

/** Status of the WebSocket connection */
export enum WebSocketStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

/** Event types received from the backend over WebSocket */
export type WSEventType = 'token' | 'tool_call' | 'done';

/** Generic WebSocket event from the server */
export interface WebSocketEvent {
  type: WSEventType;
  content: string;
}

/** WebSocket event specifically for tool calls (may have extra fields) */
export interface ToolCallEvent extends WebSocketEvent {
  type: 'tool_call';
  name: string;
  args?: Record<string, unknown>;
}

// --- User profile for Sidebar footer ---
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
}

// --- Internal Channel (maps to backend thread) ---
export interface InternalChannel {
  id: string;
  threadId: string;
  label: string;
  createdAt: number;
}

// --- Internal Message (local state) ---
export interface InternalMessage {
  id: string;
  channelId: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: number;
  isStreaming?: boolean;
  /** Discriminates a regular text message from a tool-call activity indicator. */
  kind?: 'message' | 'tool_call';
  /** Name of the tool being invoked (only set when kind === 'tool_call'). */
  toolName?: string;
  /** Arguments passed to the tool (only set when kind === 'tool_call'). */
  toolArgs?: Record<string, unknown>;
}
