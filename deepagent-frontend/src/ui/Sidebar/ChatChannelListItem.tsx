import { ChatChannel as BaseChatChannel } from '@/types';
import Avatar from '@/ui/Avatar';

type ChannelType = Exclude<BaseChatChannel['type'], 'private'> | 'general';

interface ChatChannelListItemProps {
  channel: BaseChatChannel;
  isActive: boolean;
  onClick: () => void;
}

const CATEGORY_ICONS: Record<ChannelType, string> = {
  general: '#',
  direct: '👤',
  group: '👥',
};

function extractTime(ts?: string | null): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

const ChatChannelListItem: React.FC<ChatChannelListItemProps> = ({
  channel,
  isActive,
  onClick,
}) => {
  const channelType: ChannelType = (channel.type as ChannelType) ?? 'general';
  // For 'private' channels, treat them as 'general'
  const channelIcon = CATEGORY_ICONS[channelType];
  const hasAvatar = !!channel.avatar;
  const unreadCount = Math.max(0, channel.unreadCount);
  const time = extractTime(channel.lastMessage);

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 cursor-pointer
        transition-colors duration-200 border-l-[3px]
        bg-slate-800
        ${isActive ? 'border-l-[#3b82f6]' : 'border-l-transparent'}
        hover:bg-slate-700
      `}
      role="button"
      tabIndex={0}
      aria-label={channel.name}
      aria-current={isActive ? 'true' : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex-shrink-0">
        {hasAvatar ? (
          <Avatar name={channel.name} src={channel.avatar || undefined} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-[12px] font-semibold">
            <span className="text-[#818cf8]">{channelIcon}</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none">{channelIcon}</span>
          <p className="truncate text-slate-100 font-semibold text-sm">
            {channel.name}
          </p>
        </div>

        <p className="truncate text-slate-400 text-sm font-normal">
          {channel.lastMessage ? channel.lastMessage : 'No hay mensajes aún'}
        </p>
      </div>

      {time && (
        <span className="flex-shrink-0 text-xs text-slate-500 whitespace-nowrap">
          {time}
        </span>
      )}

      {unreadCount > 0 && (
        <span className="flex-shrink-0 ml-auto bg-[#3b82f6] text-white text-sm font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default ChatChannelListItem;
