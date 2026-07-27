import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Button — primary action component.
 * Variants: primary (ember), secondary (rail outline), danger (ember outline).
 * States: default, hover, focus, active, disabled, loading.
 */
const variants = {
  primary:
    'bg-ember text-surface hover:bg-ember/90 focus:ring-ember/40 active:bg-ember/80',
  secondary:
    'bg-transparent text-rail border border-rail hover:bg-rail/10 focus:ring-rail/30 active:bg-rail/20',
  danger:
    'bg-transparent text-ember border border-ember hover:bg-ember/10 focus:ring-ember/30 active:bg-ember/20',
  success:
    'bg-herb text-surface hover:bg-herb/90 focus:ring-herb/40 active:bg-herb/80',
};

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={`
        inline-flex items-center justify-center gap-2
        font-body font-semibold
        rounded-sm
        transition-colors duration-fast
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
});

export default Button;
