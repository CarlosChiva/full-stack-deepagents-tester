import {
  ConversationCreateResponse,
  ConversationListResponse,
  ConversationListItem,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';

function authHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create a new conversation (thread).
 * Backend endpoint: POST /conversations
 */
export async function createConversation(token: string): Promise<ConversationCreateResponse> {
  const response = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: authHeader(token),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Create conversation error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * List all active conversations.
 * Backend endpoint: GET /conversations
 */
export async function listConversations(token: string): Promise<ConversationListResponse> {
  const response = await fetch(`${BASE_URL}/conversations`, {
    method: 'GET',
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(`List conversations error (${response.status})`);
  }

  return response.json();
}

/**
 * Get metadata for a specific conversation.
 * Backend endpoint: GET /conversations/{thread_id}
 */
export async function getConversation(token: string, threadId: string): Promise<ConversationListItem> {
  const response = await fetch(`${BASE_URL}/conversations/${threadId}`, {
    method: 'GET',
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(`Get conversation error (${response.status})`);
  }

  return response.json();
}

/**
 * Delete/end a conversation.
 * Backend endpoint: DELETE /conversations/{thread_id}
 */
export async function deleteConversation(token: string, threadId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/conversations/${threadId}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });

  if (!response.ok) {
    throw new Error(`Delete conversation error (${response.status})`);
  }
}
