import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away';
  showStatus?: boolean;
}

const containerSizes: Record<Required<AvatarProps>['size'], { container: string; text: string; dot: string }> = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    dot: 'w-2 h-2',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    dot: 'w-2.5 h-2.5',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-base',
    dot: 'w-3 h-3',
  },
};

const statusColors: Record<Required<AvatarProps>['status'], string> = {
  online: '#22c55e',
  away: '#f59e0b',
  offline: '#6b7280',
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  status,
  showStatus = false,
}) => {
  const sizes = containerSizes[size];
  const initials = alt
    ? alt
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <div className={`relative inline-flex ${sizes.container}`}>
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full bg-chat-sidebar flex items-center justify-center ${sizes.text} font-semibold text-gray-300`}
        >
          {initials}
        </div>
      )}

      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 ${sizes.dot} rounded-full border-2 border-chat-sidebar`}
          style={{ backgroundColor: statusColors[status] }}
        />
      )}
    </div>
  );
};

export default Avatar;
