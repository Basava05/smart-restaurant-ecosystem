import { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton, { MenuCardSkeleton, KpiSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import CountdownChip from '../../components/ui/CountdownChip';

/**
 * Internal styleguide page — /dev/styleguide
 * Renders every shared component and state for visual verification.
 * Not shown to real users.
 */
export default function StyleGuidePage() {
  const [inputValue, setInputValue] = useState('');
  const futureTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min from now
  const soonTime = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 min from now

  return (
    <div className="min-h-screen bg-steel p-6 space-y-12 max-w-4xl mx-auto">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink">
          SRE Design System
        </h1>
        <p className="font-body text-base text-rail mt-2">
          Internal style guide — every shared component and state in one place.
        </p>
      </header>

      {/* ── Colors ─────────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Color Tokens
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'ink', hex: '#1E2320', cls: 'bg-ink text-surface' },
            { name: 'steel', hex: '#EDEFEC', cls: 'bg-steel text-ink border border-rail/20' },
            { name: 'surface', hex: '#FFFFFF', cls: 'bg-surface text-ink border border-rail/20' },
            { name: 'ember', hex: '#E2571D', cls: 'bg-ember text-surface' },
            { name: 'herb', hex: '#3F6A52', cls: 'bg-herb text-surface' },
            { name: 'rail', hex: '#45566B', cls: 'bg-rail text-surface' },
          ].map((c) => (
            <div
              key={c.name}
              className={`rounded-md p-4 font-mono text-sm ${c.cls}`}
            >
              <div className="font-semibold">{c.name}</div>
              <div className="opacity-80">{c.hex}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ─────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Typography
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-rail mb-1">Display — Archivo Narrow</p>
            <p className="font-display text-2xl font-bold text-ink">
              Kitchen Queue — Order #1042
            </p>
          </div>
          <div>
            <p className="text-xs text-rail mb-1">Body — Public Sans</p>
            <p className="font-body text-base text-ink">
              Grilled chicken with herb butter, served with roasted vegetables
              and garlic mashed potatoes.
            </p>
          </div>
          <div>
            <p className="text-xs text-rail mb-1">Data — IBM Plex Mono</p>
            <p className="font-mono text-lg text-ink tabular-nums">
              #1042 — 14:32:05 — ₹1,240.00
            </p>
          </div>
        </div>
      </section>

      {/* ── Buttons ─────────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Place order</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="danger">Delete item</Button>
          <Button variant="success">Mark ready</Button>
          <Button variant="primary" loading>
            Processing…
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </div>
      </section>

      {/* ── Inputs ──────────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Inputs
        </h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            error="Password must be at least 8 characters."
          />
          <Input
            label="Disabled"
            placeholder="Can't type here"
            disabled
          />
          <Input
            label="With helper"
            placeholder="Search…"
            helperText="Try searching by dish name"
          />
        </div>
      </section>

      {/* ── Cards ───────────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Cards
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <h3 className="font-display text-lg font-semibold text-ink">
              Revenue Today
            </h3>
            <p className="font-mono text-2xl font-bold text-ink mt-2">
              ₹12,450
            </p>
            <p className="text-sm text-rail mt-1">+8% vs yesterday</p>
          </Card>
          <Card>
            <h3 className="font-display text-lg font-semibold text-ink">
              Active Orders
            </h3>
            <p className="font-mono text-2xl font-bold text-ember mt-2">7</p>
            <p className="text-sm text-rail mt-1">3 cooking, 4 queued</p>
          </Card>
        </div>
      </section>

      {/* ── Badges ──────────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Status Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          <Badge status="pending" />
          <Badge status="pending_payment" />
          <Badge status="confirmed" />
          <Badge status="cooking" />
          <Badge status="ready" />
          <Badge status="delivered" />
          <Badge status="cancelled" />
        </div>
      </section>

      {/* ── CountdownChip ───────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Countdown Chip — Signature Element
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <CountdownChip
            targetTime={futureTime}
            status="waiting"
            label="Cook start"
          />
          <CountdownChip
            targetTime={soonTime}
            status="imminent"
            label="Starting soon"
          />
          <CountdownChip
            targetTime={futureTime}
            status="cooking"
            label="Ready in"
          />
          <CountdownChip status="ready" label="Status" />
          <CountdownChip status="delivered" label="Status" />
        </div>
        <div className="mt-4">
          <p className="text-xs text-rail mb-2">Large variant (KDS)</p>
          <div className="bg-ink rounded-md p-6 inline-flex gap-4">
            <CountdownChip
              targetTime={futureTime}
              status="waiting"
              large
            />
            <CountdownChip
              targetTime={soonTime}
              status="cooking"
              large
            />
            <CountdownChip status="ready" large />
          </div>
        </div>
      </section>

      {/* ── Skeletons ───────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Skeleton Loaders
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <MenuCardSkeleton />
          <MenuCardSkeleton />
          <KpiSkeleton />
        </div>
      </section>

      {/* ── EmptyState ──────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          Empty State
        </h2>
        <Card>
          <EmptyState
            title="No orders yet today"
            description="Orders will appear here as customers place them. Share your QR code to get started."
            action={
              <Button variant="primary" size="sm">
                View QR code
              </Button>
            }
          />
        </Card>
      </section>

      {/* ── KDS Preview ─────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">
          KDS Card Preview (Dark)
        </h2>
        <div className="bg-ink rounded-md p-6 space-y-3">
          {['queued', 'cooking', 'ready'].map((s) => (
            <div
              key={s}
              className={`
                rounded-sm p-4 border-l-4
                ${
                  s === 'queued'
                    ? 'border-l-rail bg-ink'
                    : s === 'cooking'
                    ? 'border-l-ember bg-ink'
                    : 'border-l-herb bg-ink'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-lg text-surface font-semibold">
                  #104{s === 'queued' ? '2' : s === 'cooking' ? '3' : '1'}
                </span>
                <CountdownChip
                  targetTime={
                    s === 'queued'
                      ? futureTime
                      : s === 'cooking'
                      ? soonTime
                      : null
                  }
                  status={s === 'queued' ? 'waiting' : s}
                  large={false}
                />
              </div>
              <p className="font-body text-sm text-surface/70 mt-1">
                2× Butter Chicken, 1× Garlic Naan
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
