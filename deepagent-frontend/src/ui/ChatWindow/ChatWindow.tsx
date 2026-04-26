import { useEffect } from 'react';
import { useChatContext } from '@/context';
import MessageList from '@/ui/ChatWindow/MessageList';
import ChatInput from '@/ui/ChatWindow/ChatInput';
import Avatar from '@/ui/Avatar';

/** Componente principal de la ventana de chat. Integra MessageList y ChatInput
 *  dentro de un layout vertical con header y estados de empty.
 *  Lee isStreaming desde ChatContext para renderizar el indicador del agente. */
function ChatWindow() {
  const {
    activeChannel,
    currentUser,
    sendMessage,
    isStreaming,
    token,
    channelsList,
    isLoadingChannels,
    addChannel,
  } = useChatContext();

  /* ── Auto-crear canal si no existe ninguno ── */
  useEffect(() => {
    if (token && !isLoadingChannels && channelsList.length === 0) {
      addChannel();
    }
  }, [token, isLoadingChannels, channelsList, addChannel]);



  /* ── Actualizar título del documento con nombre del canal ── */
  useEffect(() => {
    if (activeChannel?.name) {
      document.title = `${activeChannel.name} — Chat`;
    } else {
      document.title = 'Chat';
    }
  }, [activeChannel?.name]);

  /* ── Envolviendo el envío: ChatInput espera {channelID, content}
   *    mientras que sendMessage del contexto usa argumentos planos. ── */
  const handleSendMessage = (messageData: {
    channelID: string;
    content: string;
  }) => {
    if (!activeChannel) return;

    sendMessage(
      messageData.channelID,
      messageData.content,
      currentUser.id,
      currentUser.name
    );
  };

  /* ─── Estado vacío: sin canal seleccionado o cargando canales ─── */
  if (isLoadingChannels || (!activeChannel && channelsList.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-400 select-none">
        <Avatar name="" size="lg" className="mb-6 opacity-40" />
        <p className="text-lg font-medium text-slate-300">
          Cargando conversaciones…
        </p>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-400 select-none">
        <Avatar name="" size="lg" className="mb-6 opacity-40" />
        <p className="text-lg font-medium text-slate-300">
          Selecciona un canal para comenzar a chatear.
        </p>
      </div>
    );
  }

  /* ─── Estado del canal (descripción / estado) ─── */
  const channelStatus = (() => {
    switch (activeChannel.type) {
      case 'direct':
        return 'Directo';
      case 'group':
        return `${activeChannel.participants.length} miembros`;
      default:
        return 'Canal';
    }
  })();

  /* ─── Componente principal ─── */
  return (
    <div className="flex flex-col h-full bg-slate-900 w-full">
      {/* Header — fondo sólido con borde inferior */}
      <header className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
        <Avatar name={activeChannel.name} size="md" />

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-slate-100 truncate">
            {activeChannel.name}
          </h2>
          {activeChannel.lastMessage && (
            <p className="text-xs text-slate-400 truncate">
              {activeChannel.lastMessage}
            </p>
          )}
          {!activeChannel.lastMessage && (
            <p className="text-xs text-slate-500">{channelStatus}</p>
          )}
        </div>
      </header>

      {/* Lista de mensajes — MessageList maneja su propio scroll y estado interno */}
      <MessageList channelID={activeChannel.id} />

      {/* Indicador "agente pensando" — se muestra mientras el agente envía tokens */}
      {isStreaming && (
        <div className="px-4 py-1.5 bg-slate-800/60">
          <p className="text-xs italic text-blue-400 animate-pulse">
            Agente pensando…
          </p>
        </div>
      )}

      {/* Input de mensajes — sticky bottom, deshabilitado mientras el agente responde */}
      <ChatInput
        channelID={activeChannel.id}
        onSendMessage={handleSendMessage}
        disabled={isStreaming}
      />
    </div>
  );
}

export default ChatWindow;
