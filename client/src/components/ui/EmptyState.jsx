/**
 * EmptyState — shown when a list or view has no data.
 * Section 7: an invitation to act, never a dead end or blank rectangle.
 */
export default function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="text-rail/40 mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-ink mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-rail max-w-xs mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
