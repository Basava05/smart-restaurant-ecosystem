import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import socket from '../../services/socket';

const STEPS = [
  { key: 'pending_payment', icon: '💳', label: 'Payment' },
  { key: 'confirmed',       icon: '✅', label: 'Confirmed' },
  { key: 'preparing',       icon: '🍳', label: 'Cooking' },
  { key: 'ready',           icon: '🎉', label: 'Ready!' },
];

const STATUS_INDEX = {
  pending_payment: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
  completed: 4,
  cancelled: -1,
};

function ProgressBar({ status }) {
  const idx = STATUS_INDEX[status] ?? 0;
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-1 relative z-10`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                done ? 'bg-herb text-white shadow-md' :
                active ? 'bg-ember text-white shadow-lg scale-110' :
                'bg-slate-200 text-slate-400'
              }`}>
                {step.icon}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${
                active ? 'text-ember' : done ? 'text-herb' : 'text-slate-400'
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-all duration-700 ${
                i < idx ? 'bg-herb' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveCountdown({ targetDate }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const tick = () => setDiff(Math.max(0, new Date(targetDate) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (diff === 0) return <span className="text-herb font-bold">Ready now! 🎉</span>;

  return (
    <span className="font-mono text-3xl font-bold text-ember">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

const STATUS_MESSAGES = {
  pending_payment: { title: 'Awaiting Payment', sub: 'Complete your payment to confirm the order.', color: 'text-yellow-600' },
  confirmed:       { title: 'Order Confirmed!', sub: "Your order is in the queue. Chef will start soon.", color: 'text-blue-600' },
  preparing:       { title: 'Chef is Cooking!', sub: 'Your food is being freshly prepared.', color: 'text-ember' },
  ready:           { title: 'Order Ready!', sub: 'Your food is ready. Come pick it up!', color: 'text-herb' },
  delivered:       { title: 'Enjoy Your Meal!', sub: 'Order delivered. Thank you for dining with SmartEats!', color: 'text-herb' },
  completed:       { title: '', sub: 'Hope you enjoyed your meal! See you again soon.', color: 'text-herb' },
  cancelled:       { title: 'Order Cancelled', sub: 'This order was cancelled.', color: 'text-red-500' },
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const justPaid = location.state?.justPaid;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastEvent, setLastEvent] = useState(null); // tracks last notable status change

  useEffect(() => {
    api.get(`/api/orders/${orderId}`)
      .then(res => setOrder(res.data.data))
      .catch(err => console.error('Failed to fetch order', err))
      .finally(() => setLoading(false));

    socket.connect();
    socket.emit('join_order_room', orderId);

    socket.on('order_updated', (updated) => {
      setOrder(prev => {
        const prevStatus = prev?.orderStatus;
        const newStatus = updated.orderStatus;
        if (prevStatus !== newStatus) setLastEvent(newStatus);
        return { ...prev, ...updated, restaurantId: prev?.restaurantId || updated.restaurantId };
      });
    });

    // Customer location tracking
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => socket.emit('update_location', {
          orderId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off('order_updated');
    };
  }, [orderId]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="font-display text-xl font-bold text-ink">Order not found</h2>
    </div>
  );

  const statusMsg = STATUS_MESSAGES[order.orderStatus] || STATUS_MESSAGES.confirmed;

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 md:py-12 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-slate-400 text-sm font-mono mb-1">
          Order #{order._id.slice(-8).toUpperCase()}
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">
          {order.restaurantId?.name || 'Your Order'}
        </h1>
      </motion.div>

      {/* Table Assignment Banner */}
      <AnimatePresence>
        {order.table?.number && order.orderStatus !== 'delivered' && order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-gradient-to-r from-ember to-yellow-500 text-white rounded-xl px-5 py-4 text-center shadow-lg border border-white/20"
          >
            <p className="text-sm font-medium opacity-90 uppercase tracking-widest mb-1">Your Table is Ready</p>
            <p className="text-3xl font-display font-bold">Table {order.table.number}</p>
            <p className="text-xs mt-2 opacity-80">Please take a seat. Your food will be served here shortly.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live status change toast */}
      <AnimatePresence>
        {lastEvent && (
          <motion.div
            key={lastEvent}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            onAnimationComplete={() => setTimeout(() => setLastEvent(null), 3000)}
            className="bg-ink text-white rounded-xl px-5 py-3 text-sm font-semibold text-center shadow-xl"
          >
            {lastEvent === 'preparing' && '🍳 Your chef just started cooking!'}
            {lastEvent === 'ready' && '🎉 Your order is ready for pickup!'}
            {lastEvent === 'confirmed' && '✅ Your order is confirmed!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-card p-6"
      >
        <ProgressBar status={order.orderStatus} />
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-ink text-white rounded-2xl p-6 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ember via-yellow-400 to-herb opacity-70" />

        <AnimatePresence mode="wait">
          <motion.div
            key={order.orderStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h2 className={`text-2xl font-bold mb-1 ${statusMsg.color}`}>{statusMsg.title}</h2>
            <p className="text-white/50 text-sm">{statusMsg.sub}</p>
          </motion.div>
        </AnimatePresence>

        {/* Countdown when cooking */}
        {order.estimatedReadyTime && order.orderStatus === 'preparing' && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Ready in approx.</p>
            <LiveCountdown targetDate={order.estimatedReadyTime} />
          </div>
        )}

        {/* Payment info */}
        {justPaid && (
          <div className="mt-4 bg-white/10 rounded-xl px-4 py-2 inline-block">
            <span className="text-green-400 text-sm font-semibold">✓ Payment received</span>
          </div>
        )}
      </motion.div>

      {/* Order Details */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-card p-6"
      >
        <h3 className="font-display text-lg font-bold text-ink mb-4">Order Items</h3>
        <ul className="space-y-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between items-center border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
              <span className="text-ink">
                <span className="font-mono font-bold text-ember mr-1">{item.qty}×</span>
                {item.name}
              </span>
              <span className="font-mono font-semibold text-slate-600">₹{(item.price || 0) * item.qty}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-center">
          <span className="font-display font-bold text-ink">Total Paid</span>
          <span className="font-mono text-xl font-bold text-ink">₹{order.totalPrice}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-400">Payment Status</span>
          <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
            {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
