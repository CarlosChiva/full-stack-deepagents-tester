import { memo, useState } from 'react';
import type { Message } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import Avatar from '@/ui/Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatTimestamp(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `hoy ${format(date, 'HH:mm', { locale: es })}`;
  }
  return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [_isHovered, _setIsHovered] = useState(false);
  void _setIsHovered;
  const time = formatTimestamp(message.timestamp);

  return (
    <div
      role="listitem"
      aria-label={`Mensaje de ${message.sender_name}: ${message.content}`}
      className={`flex gap-2 mt-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <Avatar
        name={message.sender_name}
        size="sm"
        className={`transition-transform duration-150 ease-in-out ${_isHovered ? 'scale-110' : 'scale-100'}`}
      />

      <div
        className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}
      >
        <span className="text-xs text-slate-400 mb-0.5 ml-1">
          {message.sender_name}
        </span>

        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-slate-700 text-slate-100 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-slate-500">{time}</span>
          {message.is_edited && (
            <span className="text-[10px] text-slate-500">(editado)</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
