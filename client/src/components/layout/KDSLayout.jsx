/**
 * KDSLayout — Kitchen Display System layout.
 * Section 7: dark ink background, the one deliberately dark screen.
 * Commercial kitchen displays run dark because they're read from a few feet
 * away in a bright, hot, glare-prone room, often for hours at a stretch.
 */
export default function KDSLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink kds-scrollbar">
      <header className="bg-ink border-b border-rail/20 px-6 py-3 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-surface">
          Kitchen Display
        </h1>
        <div className="font-mono text-sm text-surface/60" id="kds-clock">
          {new Date().toLocaleTimeString()}
        </div>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
