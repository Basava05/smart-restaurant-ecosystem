/**
 * Badge / StatusChip — colored status indicator.
 * Maps order statuses to design tokens:
 *   queued → rail (secondary)
 *   cooking → ember (urgent)
 *   ready → herb (success)
 *   delivered → herb
 *   cancelled → ember outline
 */
const statusStyles = {
  queued: 'bg-rail/15 text-rail border-rail/30',
  pending: 'bg-rail/15 text-rail border-rail/30',
  pending_payment: 'bg-rail/15 text-rail border-rail/30',
  confirmed: 'bg-herb/15 text-herb border-herb/30',
  cooking: 'bg-ember/15 text-ember border-ember/30',
  ready: 'bg-herb text-surface border-herb',
  delivered: 'bg-herb/20 text-herb border-herb/30',
  cancelled: 'bg-ember/10 text-ember border-ember/30',
  approved: 'bg-herb/15 text-herb border-herb/30',
  suspended: 'bg-ember/15 text-ember border-ember/30',
};

export default function Badge({ status, label, className = '' }) {
  const display = label || status?.replace(/_/g, ' ') || '';
  const styles = statusStyles[status] || statusStyles.queued;

  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-semibold uppercase tracking-wide
        font-body
        border rounded-sm
        ${styles}
        ${className}
      `}
    >
      {display}
    </span>
  );
}
