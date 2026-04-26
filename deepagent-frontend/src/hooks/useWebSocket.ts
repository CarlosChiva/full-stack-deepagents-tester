import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketStatus } from '@/types';
import type { WebSocketEvent } from '@/types';

/**
 * Valores devueltos por la hook useWebSocket.
 */
interface UseWebSocketReturn {
  /** Estado actual de la conexión WebSocket. */
  status: WebSocketStatus;
  /** Indica si el agente está enviando tokens en streaming. */
  isStreaming: boolean;
  /** Texto parcial acumulado en streaming: se acumulan tokens hasta recibir "done". */
  currentTokens: string;
  /** Todos los eventos WebSocket recibidos ordenados por llegada. */
  events: WebSocketEvent[];
  /** Envía un mensaje al agente backend. */
  send: (content: string) => void;
  /** Cierra la conexión WebSocket de forma manual. */
  disconnect: () => void;
}

/**
 * Opciones de configuración para la hook useWebSocket.
 */
interface UseWebSocketOptions {
  /** ID del canal (thread_id) para abrir el WebSocket. */
  channelId: string | null;
  /** Token JWT para autenticación en la conexión. */
  token: string | null;
  /** Callback invoked on each incoming WebSocket event. */
  onMessage?: (event: WebSocketEvent) => void;
  /** Callback llamado cada vez que cambia el estado de la conexión. */
  onStatusChange?: (status: WebSocketStatus) => void;
  /** Si es true se intenta reconectar automáticamente tras cierre inesperado. */
  autoReconnect?: boolean;
  /** Máximo número de intentos de reconexión. */
  maxReconnectAttempts?: number;
}

/**
 * Hook personalizado que gestiona la conexión WebSocket con el backend
 * para recibir streaming de tokens, llamadas a herramientas y notificación
 * de final de respuesta del agente de IA.
 *
  * Conecta directamente al backend usando `VITE_API_BASE_URL`
  * (p.ej. `ws://localhost:8003/ws/{channelId}?token={token}`).
 *
 * Protocolo:
 * - Cliente → Servidor: `{"type": "message", "content": "..."}`
 * - Servidor → Cliente: `{"type": "token", "content": "..."}` (streaming token)
 * - Servidor → Cliente: `{"type": "tool_call", "name": "...", "args": {...}}`
 * - Servidor → Cliente: `{"type": "done", "content": "final response"}`
 *
 * @param channelId — thread_id del canal activo.
 * @param token — JWT activo del usuario.
 * @param onMessage — callback opcional para cada evento recibido.
 * @param onStatusChange — callback opcional para cambios de estado.
 * @param autoReconnect — activar reconexión automática (default: true).
 * @param maxReconnectAttempts — límite de reintentos (default: 3).
 * @returns Objeto con estado y funciones de control de la conexión.
 */
function useWebSocket({
  channelId,
  token,
  onMessage,
  onStatusChange,
  autoReconnect = true,
  maxReconnectAttempts = 3,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>(
    WebSocketStatus.DISCONNECTED,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTokens, setCurrentTokens] = useState('');
  const [events, setEvents] = useState<WebSocketEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // -----------------------------------------------------------------------
  // Envía un mensaje tipo "message" al backend.
  // -----------------------------------------------------------------------
  const send = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', content }));
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Cierra la conexión WebSocket y limpia temporizadores.
  // -----------------------------------------------------------------------
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // -----------------------------------------------------------------------
  // Establece la conexión WebSocket; no-op si ya está OPEN o CONNECTING.
  // -----------------------------------------------------------------------
  const connect = useCallback(() => {
    if (!channelId || !token) {
      setStatus(WebSocketStatus.DISCONNECTED);
      return;
    }

    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';
    let wsProtocol: string;
    let wsHost: string;
    try {
      const url = new URL(apiBaseUrl);
      wsProtocol = url.protocol === 'https:' ? 'wss' : 'ws';
      wsHost = url.host;
    } catch {
      wsProtocol = 'ws';
      wsHost = 'localhost:8003';
    }
    const ws = new WebSocket(
      `${wsProtocol}://${wsHost}/ws/${channelId}?token=${token}`,
    );

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setStatus(WebSocketStatus.CONNECTED);
      onStatusChange?.(WebSocketStatus.CONNECTED);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
        onMessage?.(data);

        if (data.type === 'token') {
          setIsStreaming(true);
          setCurrentTokens((prev) => prev + (data.content || ''));
        } else if (data.type === 'done') {
          setIsStreaming(false);
          setCurrentTokens('');
        }
      } catch (err) {
        console.error('[useWebSocket] Error al interpretar mensaje:', err);
      }
    };

    ws.onerror = (err: Event) => {
      setStatus(WebSocketStatus.ERROR);
      onStatusChange?.(WebSocketStatus.ERROR);
      console.error('[useWebSocket] Error de WebSocket:', err);
    };

    ws.onclose = (event: CloseEvent) => {
      setStatus(WebSocketStatus.DISCONNECTED);
      onStatusChange?.(WebSocketStatus.DISCONNECTED);
      setCurrentTokens('');
      setIsStreaming(false);

      // Reconexión automática tras cierre inesperado
      if (
        autoReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts &&
        !event.wasClean
      ) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 2000 * reconnectAttemptsRef.current); // backoff exponencial
      }
    };

    wsRef.current = ws;
  }, [
    channelId,
    token,
    autoReconnect,
    maxReconnectAttempts,
    onMessage,
    onStatusChange,
  ]);

  // -----------------------------------------------------------------------
  // Efecto principal: conectar cuando channelId + token están disponibles,
  // desconectar al desmontar o al cambiar de canal.
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (channelId && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [channelId, token, connect, disconnect]);

  return {
    status,
    isStreaming,
    currentTokens,
    events,
    send,
    disconnect,
  };
}

export default useWebSocket;
