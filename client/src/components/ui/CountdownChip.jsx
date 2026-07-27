import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CountdownChip — THE signature element of SRE.
 *
 * A pill-shaped, monospace countdown that ticks down to cook-start or ready-time.
 * Color changes carry real meaning (Section 7):
 *   - rail-bordered, neutral → waiting, plenty of time
 *   - ember, filled → cook-start is imminent or overdue
 *   - herb, filled → ready / delivered
 *
 * Everything else on the page stays quiet so this reads as the focal point.
 */

/**
 * @param {Date|string|number} targetTime - The time to count down to
 * @param {string} status - 'waiting' | 'imminent' | 'cooking' | 'ready' | 'delivered'
 * @param {string} label - Optional label (e.g., "Cook start" or "Ready")
 * @param {boolean} large - Larger variant for KDS
 */
export default function CountdownChip({
  targetTime,
  status = 'waiting',
  label,
  large = false,
}) {
  const [remaining, setRemaining] = useState(computeRemaining(targetTime));

  useEffect(() => {
    if (status === 'ready' || status === 'delivered') return;

    const interval = setInterval(() => {
      setRemaining(computeRemaining(targetTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, status]);

  // Determine visual state from status
  const chipStyle = getChipStyle(status, remaining);

  const sizeClasses = large
    ? 'px-4 py-2 text-2xl'
    : 'px-3 py-1 text-base';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          inline-flex items-center gap-2
          rounded-full font-mono font-semibold
          transition-colors duration-200
          ${chipStyle}
          ${sizeClasses}
        `}
      >
        {label && (
          <span className="font-body text-xs font-medium uppercase tracking-wide opacity-80">
            {label}
          </span>
        )}
        <span className="tabular-nums">
          {status === 'ready'
            ? 'Ready'
            : status === 'delivered'
            ? 'Delivered'
            : formatTime(remaining)}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

function getChipStyle(status, remaining) {
  if (status === 'ready' || status === 'delivered') {
    return 'bg-herb text-surface';
  }
  if (status === 'cooking' || status === 'imminent' || remaining <= 0) {
    return 'bg-ember text-surface';
  }
  // Waiting — neutral, rail-bordered
  return 'bg-transparent text-rail border-2 border-rail';
}

function computeRemaining(targetTime) {
  if (!targetTime) return 0;
  const target = new Date(targetTime).getTime();
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
  return diff;
}

function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
