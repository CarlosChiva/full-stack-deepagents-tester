import React from 'react';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error?: string;
  type?: string;
  className?: string;
  as?: 'input' | 'textarea';
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  type = 'text',
  className = '',
  as = 'input',
}) => {
  const baseClasses = `
    w-full
    rounded-lg
    border
    border-gray-600
    bg-chat-input
    text-white
    placeholder:text-gray-500
    focus:outline-none
    focus:ring-2
    focus:ring-chat-accent
    transition-colors
    duration-200
    px-4
    py-2
    resize-y
    max-h-40
  `.trim();

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

  const renderField = () => {
    if (as === 'textarea') {
      return (
        <textarea
          className={`${baseClasses} ${errorClasses} ${className}`.trim()}
          placeholder={placeholder}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        />
      );
    }

    return (
      <input
        type={type}
        className={`${baseClasses} ${errorClasses} ${className}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
      />
    );
  };

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="text-sm text-gray-400 mb-1">{label}</label>
      )}
      {renderField()}
      {error && <span className="mt-1 text-sm text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
