import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChatContext } from '@/context';
import type { ChatChannel } from '@/types';

interface UseChatNavigationReturn {
  currentChannelId: string | null;
  navigationHistory: string[];
  unreadChannelsCount: number;
  navigateToChannel: (channelId: string) => void;
  goBack: () => void;
  navigateToPrevious: () => void;
  navigateToNext: () => void;
}

// Limit of entries in the navigation history stack
const MAX_HISTORY_LENGTH = 20;

function useChatNavigation(): UseChatNavigationReturn {
  const { activeChannel, setActiveChannel, channels } = useChatContext();

  // Estado del historial de navegación (IDs de canales visitados)
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const isBlockedRef = useRef(false);

  // ID del canal actual desde el contexto
  const currentChannelId: string | null = activeChannel?.id ?? null;

  // Conteo de canales con mensajes sin leer
  const unreadChannelsCount = useMemo(() => {
    return channels.filter((ch: ChatChannel) => ch.unreadCount > 0).length;
  }, [channels]);

  // Envuelve setActiveChannel del contexto para recibir un channelId
  const resolveChannelById = useCallback(
    (channelId: string): ChatChannel | null => {
      return channels.find((ch: ChatChannel) => ch.id === channelId) ?? null;
    },
    [channels]
  );

  // Navegar a un canal específico
  const navigateToChannel = useCallback(
    (channelId: string) => {
      const targetChannel = resolveChannelById(channelId);
      if (!targetChannel) {
        return;
      }

      // Si el canal actual no es null, agregarlo al historial antes de cambiar
      if (currentChannelId !== null && currentChannelId !== channelId) {
        setNavigationHistory((prev) => {
          // No duplicar la entrada del mismo canal
          const last = prev.at(-1);
          if (last === channelId) {
            return prev;
          }
          const updated = [...prev, channelId];
          // Mantener el límite máximo de entradas
          if (updated.length > MAX_HISTORY_LENGTH) {
            return updated.slice(updated.length - MAX_HISTORY_LENGTH);
          }
          return updated;
        });
      }

      setActiveChannel(targetChannel);
    },
    [currentChannelId, resolveChannelById, setActiveChannel]
  );

  // Regresar al canal previo en el historial
  const goBack = useCallback(() => {
    setNavigationHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const newHistory = [...prev];
      const previousChannelId = newHistory.pop();
      if (previousChannelId) {
        const previousChannel = resolveChannelById(previousChannelId);
        if (previousChannel) {
          setActiveChannel(previousChannel);
        }
      }
      return newHistory;
    });
  }, [resolveChannelById, setActiveChannel]);

  // Navegar al canal siguiente en la lista del sidebar
  const navigateToNext = useCallback(() => {
    if (channels.length === 0) {
      return;
    }

    const currentIndex = channels.findIndex(
      (ch: ChatChannel) => ch.id === currentChannelId
    );

    if (currentIndex === -1 || currentIndex === -1 + channels.length) {
      return;
    }

    const nextChannel = channels[currentIndex + 1];
    if (nextChannel) {
      navigateToChannel(nextChannel.id);
    }
  }, [channels, currentChannelId, navigateToChannel]);

  // Navegar al canal anterior en la lista del sidebar
  const navigateToPrevious = useCallback(() => {
    if (channels.length === 0) {
      return;
    }

    const currentIndex = channels.findIndex(
      (ch: ChatChannel) => ch.id === currentChannelId
    );

    if (currentIndex <= 0) {
      return;
    }

    const previousChannel = channels[currentIndex - 1];
    if (previousChannel) {
      navigateToChannel(previousChannel.id);
    }
  }, [channels, currentChannelId, navigateToChannel]);

  // Efecto para atajos de teclado (flechas izquierda/derecha)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const tag = target.tagName;

      // No activar si hay un input o textarea enfocado
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      // Bloqueo temporal para evitar activaciones duplicadas
      if (isBlockedRef.current) {
        return;
      }

      isBlockedRef.current = true;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateToNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateToPrevious();
      }

      setTimeout(() => {
        isBlockedRef.current = false;
      }, 150);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigateToNext, navigateToPrevious]);

  // Efecto para limpiar estado al cambiar de canal o desmontar
  useEffect(() => {
    if (currentChannelId === null) {
      return;
    }

    return () => {
      // Al desmontar el hook o antes de cambiar de canal,
      // limpiar cualquier scroll o estado que dependa del canal anterior
      // (el componente padre debe ser responsable del scroll real)
    };
  }, [currentChannelId]);

  return {
    currentChannelId,
    navigationHistory,
    unreadChannelsCount,
    navigateToChannel,
    goBack,
    navigateToPrevious,
    navigateToNext,
  };
}

export default useChatNavigation;
