import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  channelID: string;
  onSendMessage: (messageData: { channelID: string; content: string }) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ channelID, onSendMessage, disabled = false }) => {
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  const hasText = text.trim().length > 0;

  const handleSubmit = () => {
    if (!hasText || disabled) return;

    const trimmed = text.trim();
    onSendMessage({ channelID, content: trimmed });
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter alone sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasText) {
        handleSubmit();
      }
    }
    // Shift+Enter inserts a newline
    // (default textarea behavior, so do nothing)
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div
      className="
        sticky
        bottom-0
        bg-slate-900
        border-t
        border-slate-700
      "
    >
      <div className="flex flex-row items-end px-4 py-3 gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          rows={1}
          aria-label="Escribir mensaje"
          className="
            flex-1
            resize-none
            overflow-y-auto
            rounded-lg
            bg-slate-800
            border
            border-slate-600
            text-slate-200
            placeholder-slate-400
            px-4
            py-2.5
            text-base
            leading-relaxed
            focus:ring-2
            focus:ring-blue-500
            focus:border-transparent
            outline-none
            transition-colors
            duration-200
            disabled:opacity-50
            disabled:cursor-not-allowed
            hover:border-slate-500
          "
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasText || disabled}
          aria-label="Enviar mensaje"
          className="
            flex-shrink-0
            inline-flex
            items-center
            justify-center
            w-10
            h-10
            rounded-lg
            bg-blue-600
            hover:bg-blue-500
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-colors
            duration-200
            text-white
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        >
          {/* Paper airplane / send SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="
              w-5
              h-5
              ml-0.5
            "
          >
            <path d="M3.474 4.435a.75.75 0 00-.474.692v14a.75.75 0 001.047.692l16.5-7.5a.75.75 0 000-1.384l-16.5-7.5a.75.75 0 00-.574.008z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
