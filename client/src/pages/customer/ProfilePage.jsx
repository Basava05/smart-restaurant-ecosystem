import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
  confirmed:       { label: 'Confirmed',        color: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-400' },
  preparing:       { label: 'Preparing',        color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400 animate-pulse' },
  ready:           { label: 'Ready',            color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  delivered:       { label: 'Delivered',        color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  completed:       { label: 'Completed',        color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-500' },
  cancelled:       { label: 'Cancelled',        color: 'bg-red-100 text-red-700 border-red-200',      dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function OrderSlipModal({ order, onClose }) {
  const date = new Date(order.createdAt);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-ink p-5 text-white text-center relative">
          <button onClick={onClose} className="absolute top-3 right-4 text-white/60 hover:text-white text-xl">&times;</button>
          <div className="w-12 h-12 bg-ember rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black text-lg">S</span>
          </div>
          <h3 className="font-bold text-lg">SmartEats</h3>
          <p className="text-white/50 text-xs mt-0.5">Order Confirmation Slip</p>
        </div>

        {/* Slip Body */}
        <div className="p-5 font-mono text-sm">
          {/* Divider */}
          <div className="border-t-2 border-dashed border-neutral-200 my-4" />

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Order ID</span>
              <span className="font-bold text-ink">#{order._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Restaurant</span>
              <span className="font-bold text-ink text-right max-w-[60%] truncate">
                {order.restaurantId?.name || 'Restaurant'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="text-ink">{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time</span>
              <span className="text-ink">{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment</span>
              <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.paymentStatus?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-neutral-200 my-4" />

          {/* Items */}
          <div className="space-y-1.5 text-xs mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-600">{item.qty}x {item.name}</span>
                <span className="text-ink">₹{(item.price || 0) * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-neutral-200 my-4" />

          <div className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span className="text-ember">₹{order.totalPrice}</span>
          </div>

          <div className="border-t-2 border-dashed border-neutral-200 my-4" />

          <p className="text-center text-xs text-slate-400">Thank you for dining with SmartEats 🍽️</p>
        </div>

        <div className="px-5 pb-5">
          <Link
            to={`/orders/${order._id}`}
            onClick={onClose}
            className="block w-full text-center bg-ember hover:bg-ember/90 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Track This Order →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    api.get('/api/orders/my')
      .then(res => {
        const fetchedOrders = res.data.data || [];
        setOrders(fetchedOrders);
        
        socket.connect();
        fetchedOrders.forEach(order => {
          socket.emit('join_order_room', order._id);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    socket.on('order_updated', (updated) => {
      setOrders(prev => prev.map(o => o._id === updated._id ? { ...o, ...updated, restaurantId: o.restaurantId } : o));
      
      // Also update selectedOrder if it's currently open
      setSelectedOrder(prev => (prev && prev._id === updated._id ? { ...prev, ...updated, restaurantId: prev.restaurantId } : prev));
    });

    return () => {
      socket.off('order_updated');
    };
  }, []);

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.paymentStatus === 'paid').length,
    spent: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalPrice, 0),
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">
      {/* Order Slip Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderSlipModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-ink to-slate-800 rounded-2xl p-6 mb-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-ember flex items-center justify-center text-2xl font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{user?.name}</h1>
              <p className="text-white/50 text-sm">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-white/50 hover:text-white text-sm border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
            <div className="text-white/40 text-xs mt-1">Total Orders</div>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="text-2xl font-bold font-mono">{stats.paid}</div>
            <div className="text-white/40 text-xs mt-1">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-ember">₹{stats.spent}</div>
            <div className="text-white/40 text-xs mt-1">Total Spent</div>
          </div>
        </div>
      </motion.div>

      {/* Orders Section */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="font-display text-xl font-bold text-ink mb-4">Order History</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="font-display text-lg font-bold text-ink mb-2">No orders yet</h3>
            <p className="text-slate-500 text-sm mb-5">Time to discover something delicious!</p>
            <Link
              to="/restaurants"
              className="inline-block bg-ember text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ember/90 transition-colors"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.orderStatus} />
                        {order.table?.number && order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Table {order.table.number}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-ink">
                        {order.restaurantId?.name || 'Restaurant'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-lg text-ink">₹{order.totalPrice}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* Items summary */}
                  <p className="text-sm text-slate-500 mb-4 truncate">
                    {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/orders/${order._id}`}
                      className="flex-1 text-center text-sm font-semibold py-2 border border-neutral-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Track Order
                    </Link>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 text-sm font-semibold py-2 bg-slate-50 hover:bg-slate-100 border border-neutral-200 rounded-lg text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      🧾 View Slip
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
