/**
 * Skeleton — loading placeholder shown while data loads.
 * Section 7: not a bare spinner — a shaped placeholder matching the content layout.
 */
export default function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = 'sm',
  className = '',
  count = 1,
}) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    full: 'rounded-full',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            animate-pulse bg-rail/15
            ${roundedClass[rounded] || roundedClass.sm}
            ${className}
          `}
          style={{ width, height }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/** Pre-composed skeleton for a menu card */
export function MenuCardSkeleton() {
  return (
    <div className="bg-surface rounded-md border border-rail/10 p-4 space-y-3">
      <Skeleton height="10rem" rounded="sm" />
      <Skeleton width="60%" height="1.25rem" />
      <Skeleton width="40%" height="1rem" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width="4rem" height="1.5rem" />
        <Skeleton width="5rem" height="2.25rem" rounded="sm" />
      </div>
    </div>
  );
}

/** Pre-composed skeleton for a dashboard KPI card */
export function KpiSkeleton() {
  return (
    <div className="bg-surface rounded-md border border-rail/10 p-4 space-y-2">
      <Skeleton width="40%" height="0.875rem" />
      <Skeleton width="60%" height="2rem" />
    </div>
  );
}
