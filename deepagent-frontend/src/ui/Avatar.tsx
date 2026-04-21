import React from 'react';

const sizesMap: Record<
  'sm' | 'md' | 'lg',
  { container: string; text: string; dot: string }
> = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-[12px]',
    dot: 'w-[10px] h-[10px]',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-[14px]',
    dot: 'w-[12px] h-[12px]',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-[16px]',
    dot: 'w-[12px] h-[12px]',
  },
};

const statusColors: Record<'online' | 'offline' | 'away' | 'busy', string> = {
  online: '#22c55e',
  offline: '#6b7280',
  away: '#f59e0b',
  busy: '#ef4444',
};

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts.length === 1) return (parts[0] ?? '').charAt(0).toUpperCase();
  return ((parts[0] ?? '').charAt(0) + (parts[parts.length - 1] ?? '').charAt(0)).toUpperCase();
}

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onLoad?: React.ImgHTMLAttributes<HTMLImageElement>['onLoad'];
  onError?: React.ImgHTMLAttributes<HTMLImageElement>['onError'];
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  className = '',
  onLoad,
  onError,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const sizes = sizesMap[size];
  const initials = getInitials(name || alt);

  const handleImageLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageError(false);
      onLoad?.(e);
    },
    [onLoad],
  );

  const handleImageError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageError(true);
      onError?.(e);
    },
    [onError],
  );

  return (
    <div className={`inline-flex items-center justify-center ${sizes.container} ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full rounded-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div
          className={`w-full h-full rounded-full bg-slate-700 flex items-center justify-center ${sizes.text} font-semibold text-slate-200`}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 ${sizes.dot} rounded-full border-2 border-white`}
          style={{ backgroundColor: statusColors[status] }}
        />
      )}
    </div>
  );
};

export default Avatar;
