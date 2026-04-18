import React, { useMemo } from 'react';
import type { ChatChannel } from '../../types';
import { useChatContext } from '../../context';
import SidebarHeader from './SidebarHeader';
import ChatChannelListItem from './ChatChannelListItem';

interface SidebarProps {
  channels: ChatChannel[];
  activeChannel: string | null;
  onChannelSelect: (channelId: string) => void;
  onAddChannel: () => void;
  onSearchChange?: (term: string) => void;
  searchQuery?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  channels,
  activeChannel,
  onChannelSelect,
  onAddChannel,
  onSearchChange,
  searchQuery,
  isOpen = true,
  onToggle,
}) => {
  // Access user info from context for the footer
  const { currentUser } = useChatContext();

  // Filter channels by search query (case-insensitive)
  const filteredChannels = useMemo<ChatChannel[]>(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return channels;
    }

    const query = searchQuery.toLowerCase().trim();
    return channels.filter((ch) =>
      ch.name.toLowerCase().includes(query)
    );
  }, [channels, searchQuery]);

  // Status dot color using CSS classes
  const statusDotColor: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-slate-500',
  };

  return (
    <aside
      className={`
        fixed
        inset-y-0
        left-0
        z-50
        w-full
        bg-slate-900
        flex
        flex-col
        transform
        transition-transform
        duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative
        md:translate-x-0
        md:block
        md:w-80
        md:flex-none
      `}
      aria-label="Barra lateral de canales"
    >
      <div className="flex flex-col h-full">
        {/* Sección 1: Header */}
        <SidebarHeader
          onAddChannel={onAddChannel}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filteredCount={searchQuery && searchQuery.length > 0 ? filteredChannels.length : undefined}
        />

        {/* Botón hamburguesa en mobile */}
        {onToggle && (
          <div className="md:hidden px-4 pt-2">
            <button
              type="button"
              className="
                inline-flex
                items-center
                justify-center
                w-8
                h-8
                rounded-lg
                bg-slate-700
                text-slate-300
                hover:bg-slate-600
                hover:text-white
                transition-colors
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              onClick={onToggle}
              aria-label="Cerrar menú"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1={18} y1={6} x2={6} y2={18} />
                <line x1={6} y1={6} x2={18} y2={18} />
              </svg>
            </button>
          </div>
        )}

        {/* Sección 2: Lista de canales (scrollable) */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredChannels.length === 0 ? (
            <div className="px-4 py-6 text-center">
              {/* Icono decorativo */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 mx-auto mb-3 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx={9} cy={7} r={4} />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>

              <p className="text-sm text-slate-500 leading-relaxed">
                No hay canales todavía.
                <br />
                <span className="text-blue-400">¡Crea uno!</span>
              </p>
            </div>
          ) : (
            <ul className="list-none" role="list">
              {filteredChannels.map((channel) => (
                <li key={channel.id}>
                  <ChatChannelListItem
                    channel={channel}
                    isActive={activeChannel === channel.id}
                    onClick={() => onChannelSelect(channel.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sección 3: Footer — info del usuario actual */}
        <footer className="border-t border-slate-700 mt-auto">
          <button
            type="button"
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              text-left
              hover:bg-slate-800
              transition-colors
              duration-150
              focus:outline-none
              focus:ring-2
              focus:ring-inset
              focus:ring-blue-500
            "
            aria-label={`Perfil de ${currentUser.name}`}
            title="Configuración"
          >
            {/* Avatar del usuario actual */}
            <div className="relative flex-shrink-0">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="
                  w-8
                  h-8
                  rounded-full
                  bg-slate-700
                  flex
                  items-center
                  justify-center
                  text-xs
                  font-semibold
                  text-slate-300
                ">
                  {currentUser.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}

              {/* Indicador de estado */}
              <span
                className={`
                  absolute
                  bottom-0
                  right-0
                  w-[10px]
                  h-[10px]
                  rounded-full
                  border-2
                  border-slate-900
                  ${statusDotColor[currentUser.status] ?? 'bg-slate-500'}
                `}
                aria-label={`Estado: ${currentUser.status}`}
              />
            </div>

            {/* Nombre + status */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {currentUser.status === 'online'
                  ? 'En línea'
                  : currentUser.status === 'away'
                    ? 'Ausente'
                    : 'Desconectado'}
              </p>
            </div>

            {/* Icono de settings (placeholder) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={12} cy={12} r={3} />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </footer>
      </div>
    </aside>
  );
};

export default Sidebar;
