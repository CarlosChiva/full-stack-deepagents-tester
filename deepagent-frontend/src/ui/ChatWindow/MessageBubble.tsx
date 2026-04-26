import { memo, useMemo, useState } from 'react';
import type { InternalMessage } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import Avatar from '@/ui/Avatar';

interface MessageBubbleProps {
  message: InternalMessage;
  isOwn: boolean;
  /**
   * When false the avatar column is hidden — used for consecutive
   * agent messages so the avatar only appears on the first bubble.
   * @default true
   */
  showAvatar?: boolean;
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `hoy ${format(date, 'HH:mm', { locale: es })}`;
  }
  return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
}

/** Safe text output — strips newlines for tool-name display. */
function safeText(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/[<>]/g, '');
}

/**
 * Inline activity indicator rendered when the agent invokes a tool.
 * Uses only built-in SVG so no extra icon dependency is required.
 */
function ToolCallIndicator({ message }: { message: InternalMessage }) {
  const toolName = useMemo(
    () => safeText(message.toolName, 'herramienta'),
    [message.toolName],
  );

  const argSummary = useMemo(() => {
    if (!message.toolArgs || Object.keys(message.toolArgs).length === 0) {
      return '';
    }
    const keys = Object.keys(message.toolArgs);
    return keys.length <= 3
      ? `(${keys.join(', ')})`
      : `(${keys.join(', ')}, …)`;
  }, [message.toolArgs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-3 py-2 my-1 bg-emerald-900/30 border border-emerald-700/40 rounded-lg max-w-fit mx-auto"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-400 flex-shrink-0"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      <span className="text-xs text-emerald-300">
        <span className="font-medium">usando</span>{' '}
        <span className="font-semibold text-emerald-200">{toolName}</span>
        {argSummary !== '' && (
          <span className="text-emerald-400/80"> {argSummary}</span>
        )}
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-400 animate-spin [animation-duration:1.5s] flex-shrink-0"
      >
        <path
          d="M21 12a9 9 0 1 1-6.219-8.56"
        />
      </svg>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
}: MessageBubbleProps) {
  const [_isHovered, _setIsHovered] = useState(false);
  void _setIsHovered;
  const time = formatTimestamp(message.timestamp);

  // --- Render tool-call indicator ---
  if (message.kind === 'tool_call') {
    return (
      <div
        role="listitem"
        aria-label={`Llamada a herramienta: ${message.toolName ?? 'desconocida'}`}
      >
        <ToolCallIndicator message={message} />
      </div>
    );
  }

  /* ── When avatar is hidden (consecutive agent messages) we skip the
   *    leading column and render only the bubble content.              ── */
  if (!showAvatar && !isOwn) {
    return (
      <div
        role="listitem"
        aria-label={`Mensaje del agente: ${message.content}`}
        className="max-w-[75%]"
      >
        <div
          className={`px-3 py-2 rounded-2xl rounded-bl-none text-sm leading-relaxed whitespace-pre-wrap break-words ${
            message.content.length === 0 && message.isStreaming
              ? 'bg-slate-800/50 border border-slate-700/40'
              : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
          }`}
        >
          {message.content || '\u200B'}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-400 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="listitem"
      aria-label={`Mensaje de ${message.sender}: ${message.content}`}
      className={`flex gap-2 mt-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {showAvatar && (
        <Avatar
          name={message.sender}
          size="sm"
          className={`transition-transform duration-150 ease-in-out ${
            _isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
      )}

      <div
        className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {!isOwn && (
          <span className="text-xs mb-0.5 ml-1 text-violet-400 font-medium">
            agente
          </span>
        )}

        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-slate-800/90 text-slate-200 rounded-bl-sm border border-slate-700/60'
          }`}
        >
          {message.content || '\u200B'}
        </div>

        <div
          className={`flex items-center gap-1 mt-0.5 ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="text-[10px] text-slate-500">{time}</span>
          {message.isStreaming && (
            <span className="text-[10px] text-blue-400 animate-pulse">
              transmitiendo…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
