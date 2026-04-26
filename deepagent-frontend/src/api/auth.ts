import { TokenResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';

/**
 * Obtain a JWT token from the backend.
 * Backend endpoint: POST /auth/token
 */
export async function getToken(userId: string): Promise<TokenResponse> {
  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Auth error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Verify the current JWT token with the backend.
 * Backend endpoint: GET /auth/verify
 */
export async function verifyToken(token: string): Promise<unknown> {
  const response = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Verify error (${response.status}): Invalid or expired token`);
  }

  return response.json();
}
