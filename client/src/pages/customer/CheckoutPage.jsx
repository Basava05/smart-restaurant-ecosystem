import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';


// Helper to load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ─── Main Checkout Page ────────────────────────── */
export default function CheckoutPage() {
  const { cart, updateQty, clearCart, itemCount, totalPrice } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null); // { orderId, rzpData }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="font-display text-3xl font-bold text-ink mb-3">Your cart is empty</h2>
          <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
            Looks like you haven't added anything yet. Browse our restaurants and discover something delicious!
          </p>
          <button
            onClick={() => navigate('/restaurants')}
            className="bg-ember hover:bg-ember/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-md"
          >
            Browse Restaurants
          </button>
        </motion.div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      addToast('Please login to place an order.', 'error');
      navigate('/login');
      return;
    }

    setLoading(true);

    let customerLocation = { lat: 12.9716, lng: 77.5946 };
    try {
      customerLocation = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('Not supported'));
        else navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          reject,
          { timeout: 5000 }
        );
      });
    } catch {
      addToast('Using default location. Enable location for better ETA.', 'info');
    }

    try {
      // 1. Create the SRE order
      const { data: orderRes } = await api.post('/api/orders', {
        restaurantId: cart.restaurantId,
        customerLocation,
        items: cart.items.map(item => ({
          menuItemId: item._id || item.menuItemId,
          qty: item.qty,
          name: item.name,
        })),
      });

      const orderId = orderRes.data._id;

      // 2. Create payment order
      const { data: rzpRes } = await api.post('/api/payments/create', { orderId });
      const rzpData = rzpRes.data;

      // 3. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        addToast('Failed to load payment gateway. Check your internet connection.', 'error');
        setLoading(false);
        return;
      }

      // 4. Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Smart Restaurant Ecosystem',
        description: `Order #${orderId.slice(-6).toUpperCase()}`,
        order_id: rzpData.id,
        handler: async function (response) {
          try {
            // Verify payment on the backend
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });
            
            // Redirect to success/tracking page
            clearCart();
            navigate(`/orders/${orderId}`, { state: { paymentId: response.razorpay_payment_id, justPaid: true } });
          } catch (err) {
            console.error('Payment verification failed:', err);
            addToast('Payment verification failed. If money was deducted, contact support.', 'error');
          }
        },
        prefill: {
          name: user?.name || 'Customer',
          email: user?.email || 'customer@example.com',
          contact: user?.phone || '9999999999',
        },
        theme: {
          color: '#E2571D',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [
                  { method: 'upi' }
                ]
              }
            },
            sequence: ['block.upi'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            addToast('Payment cancelled.', 'info');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        setLoading(false);
        addToast('Payment failed. Please try another method.', 'error');
        console.error('Razorpay Error:', response.error);
      });

      razorpay.open();

    } catch (err) {
      console.error('Checkout Error:', err.response?.data || err);
      addToast(err.response?.data?.error || 'Failed to create order. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">

      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-ink text-sm font-medium mb-4 flex items-center gap-1.5 transition-colors"
        >
          ← Back to Menu
        </button>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-ink">Checkout</h1>
        <p className="text-slate-500 mt-1">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
      </motion.div>

      {/* Order Items */}
      <motion.div
        className="bg-white rounded-2xl border border-neutral-200 shadow-card overflow-hidden mb-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Order Summary</h2>
          <span className="text-sm text-slate-500">{itemCount} items</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {cart.items.map((item) => (
            <div key={item._id || item.menuItemId} className="px-6 py-4 flex items-center gap-4">
              {item.image && (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-ink truncate">{item.name}</h4>
                <p className="font-mono text-sm text-slate-500">₹{item.price} each</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-neutral-200 p-1">
                <button
                  onClick={() => updateQty(item.menuItemId || item._id, item.qty - 1)}
                  className="w-8 h-8 flex items-center justify-center text-ink font-bold hover:bg-white rounded-lg transition-colors text-lg"
                >−</button>
                <span className="w-8 text-center font-mono text-sm font-semibold">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.menuItemId || item._id, item.qty + 1)}
                  className="w-8 h-8 flex items-center justify-center text-ink font-bold hover:bg-white rounded-lg transition-colors text-lg"
                >+</button>
              </div>
              <div className="text-right min-w-[60px]">
                <span className="font-mono font-bold text-ink">₹{item.price * item.qty}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Total & CTA */}
      <motion.div
        className="bg-white rounded-2xl border border-neutral-200 shadow-card p-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-mono font-semibold text-ink">₹{totalPrice}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-500">Delivery Fee</span>
          <span className="font-mono font-semibold text-herb">FREE</span>
        </div>
        <div className="border-t border-neutral-200 my-4" />
        <div className="flex justify-between items-center mb-6">
          <span className="font-display text-xl font-bold text-ink">Total</span>
          <span className="font-mono text-2xl font-bold text-ink">₹{totalPrice}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-ember hover:bg-ember/90 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-hero"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Order…
            </span>
          ) : (
            `Proceed to Payment — ₹${totalPrice}`
          )}
        </motion.button>

        {!user && (
          <p className="text-center text-sm text-slate-500 mt-4">
            You'll need to{' '}
            <Link to="/login" className="text-ember font-semibold hover:underline">sign in</Link>
            {' '}before placing your order
          </p>
        )}
      </motion.div>
    </div>
  );
}
