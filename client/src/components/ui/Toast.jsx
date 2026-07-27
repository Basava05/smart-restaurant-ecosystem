import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';

/**
 * Toast — notification overlay.
 * Types: info (rail), success (herb), error (ember), warning (ember outline).
 */
const typeStyles = {
  info: 'bg-rail text-surface',
  success: 'bg-herb text-surface',
  error: 'bg-ember text-surface',
  warning: 'bg-surface text-ember border border-ember',
};

function ToastItem({ toast, onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        flex items-center gap-3 px-4 py-3
        rounded-sm shadow-lg
        font-body text-sm
        ${typeStyles[toast.type] || typeStyles.info}
      `}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
