import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useChatContext } from '@/context';
import type { InternalMessage } from '@/types';

/** Cantidad máxima de mensajes que se cargan por página histórica. */
const PAGE_SIZE = 50;

/** Umbral de proximidad al fondo: si el scroll está a menos de esta distancia del final, se considera "cerca del fondo". */
const NEAR_BOTTOM_THRESHOLD = 100;

/**
 * Tipo de retorno de la hook useChatMessages.
 */
interface UseChatMessagesReturn {
  /** Referencia al contenedor DOM de los mensajes. */
  messageContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Lista de mensajes filtrados por canal, sliced según el offset de paginación. */
  displayedMessages: InternalMessage[];
  /** Indica si se está cargando historia de mensajes. */
  isLoadingHistory: boolean;
  /** Indica si el scroll está cerca del fondo. Si es falso, se desactiva el auto-scroll. */
  isNearBottom: boolean;
  /** Carga más mensajes históricos al inicio de la lista. */
  loadMoreMessages: () => void;
  /** Desplaza el contenedor al final suavemente. */
  scrollToBottom: () => void;
}

/**
 * Hook que gestiona la visualización de mensajes para un canal de chat.
 *
 * Provee:
 * - Filtrado de mensajes por canal activo.
 * - Carga paginada de mensajes históricos (bloques de 50).
 * - Auto-scroll al fondo cuando el usuario está cerca del final.
 * - Detección de scroll manual para evitar auto-scroll cuando el usuario
 *   sube para leer mensajes anteriores.
 *
 * @param channelID — Identificador explícito del canal. Si no se
 *   proporciona, se usa el canal activo del contexto.
 * @returns Objeto con ref, estado y funciones para gestionar mensajes.
 */
function useChatMessages(channelID?: string): UseChatMessagesReturn {
  const { activeChannel, messages } = useChatContext();

  // Priorizar channelID explícito; fallback al canal activo del contexto
  const activeChannelId = channelID ?? activeChannel?.id ?? '';

  // Referencia al contenedor de mensajes
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Estado: cuánto progreso de paginación se ha hecho (offset acumulativo)
  const [offset, setOffset] = useState<number>(0);

  // Estado: bandera de carga de historia
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Estado: proximidad al fondo del contenedor de scroll
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);

  // Filtrado de todos los mensajes del canal, ordenados por timestamp
  // useMemo para recalcular solo cuando cambien los mensajes o el canal activo
  const allChannelMessages = useMemo<InternalMessage[]>(() => {
    if (!activeChannelId) {
      return [];
    }

    const channelMessages = messages?.[activeChannelId] ?? [];

    if (Array.isArray(channelMessages) && channelMessages.length === 0) {
      return [];
    }

    // Ordenar por timestamp descendente (más reciente primero)
    return [...channelMessages].sort((a, b) => {
      const tsA = new Date(a.timestamp).getTime();
      const tsB = new Date(b.timestamp).getTime();
      return tsB - tsA; // descendente para que el slice del offset tome los más antiguos
    });
  }, [messages, activeChannelId]);

  // displayMessages: slice según el offset actual de paginación
  // Devuelve los mensajes entre offset y offset + PAGE_SIZE
  // Esto representa la ventana visible de mensajes: los más recientes visibles
  // más los desplazados por la paginación hacia arriba
  const displayedMessages = useMemo<InternalMessage[]>(() => {
    const base = offset;
    const sliced = allChannelMessages.slice(base, base + PAGE_SIZE);

    // Ordenar ascendente para la UI (más recientes al final)
    return [...sliced].sort((a, b) => {
      const tsA = new Date(a.timestamp).getTime();
      const tsB = new Date(b.timestamp).getTime();
      return tsA - tsB; // ascendente para visualización: más reciente al fondo
    });
  }, [allChannelMessages, offset]);

  /**
   * Carga más mensajes históricos al inicio.
   * Incrementa el offset en PAGE_SIZE y recalculará displayedMessages
   * vía useMemo al volver a renderizar.
   */
  const loadMoreMessages = useCallback(() => {
    // No cargar si ya está cargando o no hay más mensajes
    if (isLoadingHistory || offset + PAGE_SIZE >= allChannelMessages.length) {
      return;
    }

    setIsLoadingHistory(true);

    // Simular delay de red para la carga de historía
    const timer = setTimeout(() => {
      setOffset((prev) => prev + PAGE_SIZE);
      setIsLoadingHistory(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isLoadingHistory, offset, allChannelMessages.length]);

  /**
   * Desplaza el contenedor de mensajes suavemente al final.
   * Solo efectúa la acción si la referencia al DOM está disponible.
   */
  const scrollToBottom = useCallback(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  /**
   * Efecto para auto-scroll al fondo cuando llegan nuevos mensajes.
   * Solo se activa cuando el usuario está cerca del fondo (isNearBottom === true)
   * y cuando hay un canal activo con mensajes disponibles.
   */
  useEffect(() => {
    if (!isNearBottom) {
      return;
    }

    if (activeChannelId && displayedMessages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [displayedMessages, activeChannelId, isNearBottom, scrollToBottom]);

  /**
   * Efecto para escuchar scroll y actualizar isNearBottom.
   * Si el usuario scrolléa hacia arriba (lejos del fondo), se desactiva
   * el auto-scroll para no molestar su lectura.
   */
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsNearBottom(distanceFromBottom <= NEAR_BOTTOM_THRESHOLD);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    messageContainerRef,
    displayedMessages,
    isLoadingHistory,
    isNearBottom,
    loadMoreMessages,
    scrollToBottom,
  };
}

export default useChatMessages;
