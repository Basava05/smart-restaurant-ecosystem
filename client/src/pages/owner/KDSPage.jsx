import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import socket from '../../services/socket';
import Button from '../../components/ui/Button';

/* ─── Live countdown clock ────────────────────── */
function LiveClock({ targetDate }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const ms = new Date(targetDate) - Date.now();
      setDiff(Math.max(0, ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const urgent = diff < 5 * 60 * 1000 && diff > 0;

  return (
    <span className={`font-mono text-xs font-bold px-2 py-1 rounded-full ${
      diff === 0 ? 'bg-slate-200 text-slate-500' :
      urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-ember text-white'
    }`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

/* ─── Customer ETA display ────────────────────── */
function CustomerETA({ order }) {
  const [eta, setEta] = useState(order.eta?.current || order.eta?.initial || null);
  const hasLocation = order.customerLocation?.lat;

  useEffect(() => {
    setEta(order.eta?.current || order.eta?.initial || null);
  }, [order.eta]);

  if (!hasLocation) {
    return <span className="text-slate-400 text-xs">Location not shared</span>;
  }
  if (!eta) {
    return <span className="text-slate-400 text-xs">Calculating ETA…</span>;
  }
  return (
    <span className="text-xs font-semibold text-herb">
      🚶 Customer ~{eta} min away
    </span>
  );
}

/* ─── Order Card ──────────────────────────────── */
function OrderCard({ order, onStatusUpdate, onEtaOverride, userRole }) {
  const statusStyles = {
    queued:    'border-l-slate-400',
    cooking:   'border-l-ember',
    ready:     'border-l-herb',
    delivered: 'border-l-slate-300',
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border border-neutral-200 border-l-4 ${statusStyles[order.cookingStatus] || 'border-l-slate-300'} w-72 flex-shrink-0 flex flex-col`}>
      {/* Card Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-neutral-100 flex items-center justify-between rounded-t-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-ink text-sm">
              #{order._id.slice(-5).toUpperCase()}
            </span>
            {order.table?.number && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                Table {order.table.number}
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <CustomerETA order={order} />
          </div>
        </div>
        {order.cookingWindow?.estimatedStart && (
          <LiveClock targetDate={order.cookingWindow.estimatedStart} />
        )}
      </div>

      {/* Items */}
      <div className="p-4 flex-1">
        <ul className="space-y-2">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-ember text-base w-7 text-right flex-shrink-0">
                {item.qty}×
              </span>
              <span className="text-ink font-semibold text-sm leading-tight">{item.name}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Status</span>
            <span className={`font-semibold capitalize ${
              order.cookingStatus === 'cooking' ? 'text-ember' :
              order.cookingStatus === 'ready' ? 'text-herb' : 'text-slate-500'
            }`}>{order.cookingStatus}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Total</span>
            <span className="font-mono font-bold text-ink">₹{order.totalPrice}</span>
          </div>
          {order.estimatedReadyTime && order.cookingStatus === 'cooking' && (
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Ready by</span>
              <span className="font-semibold text-ember">
                {new Date(order.estimatedReadyTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        {userRole === 'owner' ? (
          <div className="w-full bg-slate-50 text-slate-400 border border-slate-200 border-dashed font-semibold py-2.5 rounded-xl text-sm text-center">
            View Only
          </div>
        ) : (
          <>
            {order.cookingStatus === 'queued' && (
              <>
                <button
                  onClick={() => onStatusUpdate(order._id, 'cooking')}
                  className="w-full bg-ember hover:bg-ember/90 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  🍳 Start Cooking
                </button>
                <button
                  onClick={() => onEtaOverride(order)}
                  className="w-full border border-neutral-200 text-slate-600 hover:bg-slate-50 font-medium py-2 rounded-xl text-xs transition-colors"
                >
                  ⏱ Override ETA
                </button>
              </>
            )}
            {order.cookingStatus === 'cooking' && (
              <button
                onClick={() => onStatusUpdate(order._id, 'ready')}
                className="w-full bg-herb hover:bg-herb/90 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                ✅ Mark Ready
              </button>
            )}
          </>
        )}
        {order.cookingStatus === 'ready' && (
          <div className="w-full bg-slate-100 text-slate-500 font-semibold py-2.5 rounded-xl text-sm text-center">
            Waiting for Customer
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main KDS Page ───────────────────────────── */
export default function KDSPage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load restaurant & initial orders
  useEffect(() => {
    const load = async () => {
      try {
        const { data: restData } = await api.get('/api/restaurants/owner/me');
        setRestaurant(restData.data);
        const { data: ordersData } = await api.get(`/api/orders/kitchen/${restData.data._id}`);
        setOrders(ordersData.data || []);
      } catch {
        addToast('Failed to load kitchen data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  // Socket.IO real-time
  useEffect(() => {
    if (!restaurant) return;

    socket.connect();
    socket.emit('join_kitchen_room', restaurant._id);

    socket.on('new_order', (order) => {
      setOrders(prev => {
        // avoid duplicates
        if (prev.some(o => o._id === order._id)) return prev;
        return [...prev, order];
      });
      addToast(`🔔 New order #${order._id.slice(-5).toUpperCase()} arrived!`, 'info');
    });

    socket.on('order_updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    return () => {
      socket.off('new_order');
      socket.off('order_updated');
      socket.disconnect();
    };
  }, [restaurant, addToast]);

  const updateCookingStatus = useCallback(async (orderId, newStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o =>
      o._id === orderId ? { ...o, cookingStatus: newStatus } : o
    ));
    try {
      const { data } = await api.patch(`/api/orders/${orderId}/kitchen`, { cookingStatus: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? data.data : o));
      if (newStatus === 'cooking') addToast('Order is being prepared! Customer notified.', 'success');
      if (newStatus === 'ready') addToast('Order marked ready! Customer notified.', 'success');
    } catch (err) {
      // Revert optimistic update
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, cookingStatus: o.cookingStatus } : o
      ));
      addToast(err.response?.data?.error || 'Failed to update order status.', 'error');
    }
  }, [addToast]);

  const handleEtaOverride = useCallback(async (order) => {
    const mins = window.prompt('Delay start by how many minutes?');
    if (!mins || isNaN(mins) || Number(mins) <= 0) return;

    const base = order.cookingWindow?.estimatedStart
      ? new Date(order.cookingWindow.estimatedStart)
      : new Date();
    base.setMinutes(base.getMinutes() + parseInt(mins, 10));

    // Also push the main ETA that the customer sees
    const readyTime = order.estimatedReadyTime
      ? new Date(order.estimatedReadyTime)
      : new Date(Date.now() + 15 * 60000); // fallback
    readyTime.setMinutes(readyTime.getMinutes() + parseInt(mins, 10));

    try {
      const { data } = await api.patch(`/api/orders/${order._id}/kitchen`, {
        cookingWindow: { ...order.cookingWindow, estimatedStart: base },
        estimatedReadyTime: readyTime
      });
      setOrders(prev => prev.map(o => o._id === order._id ? data.data : o));
      addToast(`ETA pushed by ${mins} min.`, 'success');
    } catch {
      addToast('Failed to override ETA.', 'error');
    }
  }, [addToast]);

  // Group orders by status
  const cooking = orders.filter(o => o.cookingStatus === 'cooking');
  const queued = orders.filter(o => o.cookingStatus === 'queued');
  const ready = orders.filter(o => o.cookingStatus === 'ready');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-surface text-center">
          <div className="w-12 h-12 border-4 border-ember/30 border-t-ember rounded-full animate-spin mx-auto mb-4" />
          <p>Loading Kitchen Display…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-[#0f1117]">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Kitchen Display System</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {restaurant?.name} — {user?.email}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm font-mono">
            <span className="text-ember font-bold">{cooking.length} Cooking</span>
            <span className="text-yellow-400 font-bold">{queued.length} Queued</span>
            <span className="text-green-400 font-bold">{ready.length} Ready</span>
          </div>
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={logout}>Logout</Button>
        </div>
      </header>

      {/* No orders */}
      {orders.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/30">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-lg font-semibold">No active orders</p>
            <p className="text-sm mt-1">Orders will appear here after customers pay</p>
          </div>
        </div>
      )}

      {/* Orders Board */}
      {orders.length > 0 && (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-5 min-w-max pb-4 h-full items-start">
            {/* Cooking column first (most urgent) */}
            {[...cooking, ...queued, ...ready].map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={updateCookingStatus}
                onEtaOverride={handleEtaOverride}
                userRole={user.role}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
