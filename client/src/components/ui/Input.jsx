import { forwardRef } from 'react';

/**
 * Input — text input with label, error state, and helper text.
 * States: default, focus (ring), error (ember border + message below).
 * Section 7: error message written inline beneath the field, not just a red border.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    className = '',
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`
          w-full px-3 py-2
          font-body text-base text-ink
          bg-surface border rounded-sm
          placeholder:text-rail/60
          transition-colors duration-fast
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            error
              ? 'border-ember focus:ring-ember/40'
              : 'border-rail/30 focus:border-rail focus:ring-rail/30'
          }
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-ember"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-rail">{helperText}</p>
      )}
    </div>
  );
});

export default Input;
