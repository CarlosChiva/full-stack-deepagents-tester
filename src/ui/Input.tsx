import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      type = 'text',
      value,
      onChange,
      error,
      helperText,
      disabled,
      required,
      name,
      id,
      className = '',
      autoFocus,
      autoComplete,
      autoCapitalize,
      autoCorrect,
      spellCheck,
      maxLength,
      minLength,
      pattern,
      step,
      ...rest
    },
    ref
  ) => {
    const inputId = id || name || '';
    const hasError = !!error;

    const inputClasses = [
      'w-full rounded bg-slate-800 border text-slate-200 placeholder-slate-400',
      'py-2.5 px-3',
      'transition-colors duration-200',
      'border-slate-600 outline-none',
      'focus:ring-2 focus:ring-blue-500',
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'hover:border-slate-500',
      disabled
        ? 'opacity-50 cursor-not-allowed bg-slate-800'
        : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm text-slate-300 font-medium"
          >
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          step={step}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...rest}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
