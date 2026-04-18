import type { ChatChannel, Message, User } from '../types';

// Placeholder SVG data for avatars
const SVG_AVATAR_1 = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3b82f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">G</text></svg>`)}`;

const SVG_AVATAR_2 = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#22c55e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">M</text></svg>`)}`;

const SVG_AVATAR_3 = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#a855f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">A</text></svg>`)}`;

const SVG_AVATAR_4 = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#f59e0b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">S</text></svg>`)}`;

/**
 * Default chat channels for the application.
 */
export const defaultChannels: ChatChannel[] = [
  {
    id: 'channel-general',
    name: 'General',
    type: 'group',
    avatar: SVG_AVATAR_1,
    lastMessage: 'Bienvenidos al canal de General!',
    unreadCount: 3,
    participants: ['user-1', 'user-2', 'user-3', 'user-4'],
  },
  {
    id: 'channel-backend-dev',
    name: 'Backend Dev',
    type: 'group',
    avatar: SVG_AVATAR_2,
    lastMessage: 'El servicio de auth ya está en producción.',
    unreadCount: 0,
    participants: ['user-1', 'user-2', 'user-4'],
  },
  {
    id: 'channel-design-ui',
    name: 'Diseño UI/UX',
    type: 'group',
    avatar: SVG_AVATAR_3,
    lastMessage: '¿Alguien revisó los nuevos mocks?',
    unreadCount: 12,
    participants: ['user-1', 'user-3'],
  },
  {
    id: 'channel-support',
    name: 'Soporte',
    type: 'private',
    avatar: SVG_AVATAR_4,
    lastMessage: 'Ticket #42 resuelto.',
    unreadCount: 0,
    participants: ['user-1', 'user-2', 'user-3', 'user-4'],
  },
];

/**
 * Current authenticated user for the session.
 */
export const currentUser: User = {
  id: 'user-1',
  name: 'Usuario Demo',
  avatar: SVG_AVATAR_1,
  status: 'online',
};

/**
 * Other sample users for the application.
 */
export const sampleUsers: User[] = [
  {
    id: 'user-2',
    name: 'María García',
    avatar: SVG_AVATAR_2,
    status: 'online',
  },
  {
    id: 'user-3',
    name: 'Ana López',
    avatar: SVG_AVATAR_3,
    status: 'away',
  },
  {
    id: 'user-4',
    name: 'Sofía Ruiz',
    avatar: SVG_AVATAR_4,
    status: 'offline',
  },
];

/**
 * Initial sample messages for the default channel.
 */
export const initialMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Bienvenidos al canal de General!',
    sender_id: 'user-1',
    sender_name: 'Usuario Demo',
    channel_id: 'channel-general',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-2',
    content: 'Hola a todos! ¿Cómo están?',
    sender_id: 'user-2',
    sender_name: 'María García',
    channel_id: 'channel-general',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-3',
    content: 'Hola María! Todo bien, acá trabajando en el proyecto.',
    sender_id: 'user-1',
    sender_name: 'Usuario Demo',
    channel_id: 'channel-general',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg-4',
    content: '¡Genial! Avísenme si necesitan ayuda con algo.',
    sender_id: 'user-3',
    sender_name: 'Ana López',
    channel_id: 'channel-general',
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'msg-5',
    content: 'Sistema',
    sender_id: 'system',
    sender_name: 'Sistema',
    channel_id: 'channel-general',
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'msg-6',
    content: 'Ana se unió al canal.',
    sender_id: 'user-3',
    sender_name: 'Ana López',
    channel_id: 'channel-general',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
];

/**
 * UI constants used across the application.
 */
export const UI_CONSTANTS = {
  /** Number of pixels to leave at the top before triggering auto-scroll */
  SCROLL_THRESHOLD: 100,
  /** Maximum allowed character length for a message */
  MAX_MESSAGE_LENGTH: 500,
  /** The default channel ID to show on first load */
  DEFAULT_CHANNEL: 'channel-general',
};
