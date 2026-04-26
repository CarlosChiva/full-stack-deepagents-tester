import { useEffect, useMemo, useRef, useState } from 'react';
import useChatMessages from '@/hooks/useChatMessages';
import MessageBubble from './MessageBubble';
import StreamingPlaceholder from './StreamingPlaceholder';
import type { InternalMessage } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const DATE_FORMAT = 'dd MMMM yyyy';

/** A consecutive block is either one user message or a run of agent messages (text + tool calls). */
interface MessageBlock {
  type: 'user' | 'agent';
  messages: InternalMessage[];
}

/** Determine whether a message belongs to an agent block. */
function isAgentBlock(msg: InternalMessage): boolean {
  return msg.sender === 'agent' || msg.kind === 'tool_call';
}

/**
 * Partition a flat message list into consecutive-block groups.
 * Consecutive agent messages (including tool-call indicators) are collapsed
 * into a single block so the renderer can wrap them in a shared visual container.
 */
function groupIntoConsecutiveBlocks(messages: InternalMessage[]): MessageBlock[] {
  const blocks: MessageBlock[] = [];

  for (const msg of messages) {
    const type = isAgentBlock(msg) ? 'agent' : 'user';
    const last = blocks[blocks.length - 1];

    if (last && last.type === type) {
      last.messages.push(msg);
    } else {
      blocks.push({ type, messages: [msg] });
    }
  }

  return blocks;
}

interface MessageListProps {
  channelID: string;
}

function groupMessagesByDate(messages: InternalMessage[]) {
  const groups: { dateLabel: string; messages: InternalMessage[] }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]!;
    const msgDate = new Date(message.timestamp);
    const dateLabel = format(msgDate, DATE_FORMAT, { locale: es });

    if (i === 0 || groups[groups.length - 1]!.dateLabel !== dateLabel) {
      groups.push({ dateLabel, messages: [message] });
    } else {
      groups[groups.length - 1]!.messages.push(message);
    }
  }

  return groups;
}

function formatMessageDate(dateLabel: string): string {
  const today = format(new Date(), DATE_FORMAT, { locale: es });
  const yesterday = format(new Date(Date.now() - 86400000), DATE_FORMAT, { locale: es });

  if (dateLabel === today) return 'Hoy';
  if (dateLabel === yesterday) return 'Ayer';
  return dateLabel;
}

function MessageList({ channelID }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { displayedMessages, isLoadingHistory, scrollToBottom } = useChatMessages(channelID);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const _hasUnread = hasUnread;
  void _hasUnread; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Detectar scroll manual del usuario
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= 100;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setHasUnread(false);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-scroll when new messages arrive & user is at bottom
  useEffect(() => {
    if (displayedMessages.length > 0) {
      if (isAtBottom) {
        scrollToBottom();
      } else {
        setHasUnread(true);
      }
    }
  }, [displayedMessages.length, isAtBottom, scrollToBottom]);

  const groupedMessages = useMemo(() => groupMessagesByDate(displayedMessages), [displayedMessages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-slate-900 px-4 py-2"
      role="log"
      aria-label="Mensajes del canal"
      aria-live="polite"
    >
      {groupedMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 text-center">
            No hay mensajes aún. ¡Envía el primero!
          </p>
        </div>
      ) : (
        groupedMessages.map((group) => (
          <div key={group.dateLabel}>
            <div className="flex items-center justify-center my-3 sticky top-0">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-xs text-slate-500 px-3 bg-slate-900">
                  {formatMessageDate(group.dateLabel)}
                </span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>
            </div>

            {groupIntoConsecutiveBlocks(group.messages).map((block) =>
              block.type === 'user' ? (
                block.messages.map((message) => (
                  <div key={message.id}>
                    <MessageBubble
                      message={message}
                      isOwn={true}
                    />
                  </div>
                ))
              ) : (
                <div
                  key={block.messages.map((m) => m.id).join('-')}
                  className="flex gap-2 mt-3 justify-start"
                >
                  <div className="flex flex-col items-start gap-1 max-w-[80%]">
                    {/* Only show avatar once per consecutive agent block */}
                    <MessageBubble
                      message={block.messages[0]!}
                      isOwn={false}
                      showAvatar={true}
                    />
                    {block.messages.slice(1).map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={false}
                        showAvatar={false}
                      />
                    ))}
                    {/* Streaming placeholder when the last agent message is still streaming */}
                    {block.messages[block.messages.length - 1]?.isStreaming &&
                      block.messages.every(
                        (m) => m.kind === 'tool_call' || m.content.length === 0,
                      ) && (
                        <StreamingPlaceholder />
                      )}
                  </div>
                </div>
              ),
            )}
          </div>
        ))
      )}

      {isLoadingHistory && (
        <div className="flex items-center justify-center py-3">
          <div className="animate-pulse text-xs text-slate-500">Cargando mensajes anteriores...</div>
        </div>
      )}
    </div>
  );
}

export default MessageList;
