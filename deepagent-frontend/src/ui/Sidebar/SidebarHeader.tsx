import React, { useCallback, useState } from 'react';

interface SidebarHeaderProps {
  onAddChannel: () => void;
  searchQuery?: string;
  onSearchChange?: (term: string) => void;
  filteredCount?: number;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onAddChannel,
  searchQuery,
  onSearchChange,
  filteredCount,
}) => {
  const hasSearch = searchQuery !== undefined && onSearchChange !== undefined;
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (hasSearch) {
        onSearchChange?.(value);
      } else {
        setLocalSearchTerm(value);
      }
    },
    [hasSearch, onSearchChange],
  );

  return (
    <header className="flex flex-col gap-4 px-4 py-4 border-b border-slate-700 bg-slate-800">
      {/* Logo / Título de la app */}
      <div className="flex items-center gap-3">
        {/* Icono globo de chat (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7 text-blue-400 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-100 tracking-tight">
            ChatApp
          </span>
          <span className="text-xs text-slate-400">
            Tu espacio de conversación
          </span>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        {/* Ícono lupa */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={11} cy={11} r={8} />
          <line x1={21} y1={21} x2={16.65} y2={16.65} />
        </svg>

        <input
          type="text"
          className="
            w-full
            pl-9
            pr-4
            py-2
            text-sm
            bg-slate-700
            border
            border-slate-600
            rounded-lg
            text-slate-200
            placeholder:text-slate-500
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-transparent
            transition-colors
            duration-200
          "
          placeholder="Buscar canales..."
          value={searchQuery ?? localSearchTerm}
          onChange={handleChange}
          aria-label="Buscar canales"
        />

        {/* Botón limpiar */}
        {((searchQuery && searchQuery.length > 0) ||
          (localSearchTerm && localSearchTerm.length > 0)) && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200"
            onClick={() => {
              const clearValue = '';
              if (hasSearch) {
                onSearchChange?.(clearValue);
              } else {
                setLocalSearchTerm(clearValue);
              }
            }}
            aria-label="Limpiar búsqueda"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
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
        )}
      </div>

      {/* Botón "Crear canal" */}
      <button
        type="button"
        className="
          w-full
          inline-flex
          items-center
          justify-center
          gap-2
          px-4
          py-2
          text-sm
          rounded-lg
          bg-transparent
          text-slate-300
          hover:bg-slate-700
          hover:text-blue-400
          transition-colors
          duration-200
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
        onClick={onAddChannel}
        aria-label="Crear canal"
        title="Crear canal"
      >
        {/* Icono + */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1={12} y1={5} x2={12} y2={19} />
          <line x1={5} y1={12} x2={19} y2={12} />
        </svg>
        <span>Crear canal</span>
      </button>

      {filteredCount !== undefined && filteredCount > 0 && (
        <p className="text-xs text-slate-500">
          {filteredCount} canales encontrados
        </p>
      )}
    </header>
  );
};

export default SidebarHeader;
