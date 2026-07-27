/**
 * Card — surface container sitting on top of steel background.
 * md radius (8px), subtle shadow. Supports optional padding variants.
 */
export default function Card({ children, className = '', padding = 'md', ...props }) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        bg-surface rounded-md
        border border-rail/10
        shadow-sm
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
