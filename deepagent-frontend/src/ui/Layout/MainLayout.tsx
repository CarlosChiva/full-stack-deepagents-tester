import { useState } from 'react';
import Sidebar from '@/ui/Sidebar/Sidebar';
import ChatWindow from '@/ui/ChatWindow/ChatWindow';
import { useChatContext } from '@/context';
import type { ChatChannel } from '@/types';

/** Layout principal: Sidebar a la izquierda + ChatWindow a la derecha.
 *  Responsive: sidebar oculto en mobile (por defecto) con botón hamburguesa
 *  para abrirlo. Incluye overlay semi-transparente en mobile. */
interface MainLayoutProps {
  /** Canal activo por defecto (opcional, para control externo).
   *  Si no se proporciona, se usa el del ChatContext. */
  defaultChannel?: ChatChannel | null;
}

function MainLayout({ defaultChannel }: MainLayoutProps) {
  const { channels, activeChannel, setActiveChannel, addChannel } = useChatContext();
  const sidebarChannel = defaultChannel ?? activeChannel;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleChannelSelect = (channelId: string) => {
    const channel = channels.find((ch) => ch.id === channelId);
    setActiveChannel(channel ?? null);
    setIsSidebarOpen(false);
  };

  const handleAddChannel = async () => {
    await addChannel();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100" role="main">
      {/* Sidebar — visible en desktop (md) por defecto; en mobile se muestra/oculta con isOpen */}
      <Sidebar
        channels={channels}
        activeChannel={sidebarChannel?.id ?? null}
        onChannelSelect={handleChannelSelect}
        onAddChannel={handleAddChannel}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Overlay — semi-transparente, cierra sidebar al tocar. Solo visible en mobile. */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Cerrar menú lateral"
          role="presentation"
        />
      )}

      {/* Área principal — contiene chat window con header móvil opcional */}
      <section className="flex-1 flex flex-col min-w-0" role="region" aria-label="Ventana de chat principal">
        {/* Header móvil: siempre visible en <768px con botón hamburguesa para togglear sidebar */}
        <header className="flex-none flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
          >
            {/* Icono hamburguesa SVG inline */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h1 className="text-sm font-semibold text-slate-100 truncate">
            {sidebarChannel?.name ?? 'Chat'}
          </h1>
        </header>

        <ChatWindow />
      </section>
    </div>
  );
}

export default MainLayout;
