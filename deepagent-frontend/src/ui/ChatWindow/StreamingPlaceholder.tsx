import { memo } from 'react';

/**
 * Shown inside an agent block when every message so far is either a
 * tool-call indicator or an empty streaming message — i.e. the agent
 * has not yet produced any readable text content.
 */
function StreamingPlaceholder() {
  return (
    <div
      role="status"
      aria-label="El agente está procesando su respuesta"
      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm bg-slate-800/60 border border-slate-700/50"
    >
      {/* Three-dot pulsing ellipsis */}
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]"
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]"
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]"
      />
      <span className="ml-1 text-xs text-slate-400 italic">
        el agente está escribiendo…
      </span>
    </div>
  );
}

export default memo(StreamingPlaceholder);
