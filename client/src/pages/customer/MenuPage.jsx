import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import BANGALORE_RESTAURANTS from '../../data/restaurantData';
import AuthModal from '../../components/ui/AuthModal';
import api from '../../services/api';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-base ${i < Math.floor(rating) ? 'text-gold' : 'text-neutral-300'}`}>
          ★
        </span>
      ))}
      <span className="ml-1.5 text-base font-bold text-ink">{rating}</span>
    </div>
  );
}

export default function MenuPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, itemCount, totalPrice, cart } = useCart();
  const { addToast } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingItemRef = useRef(null);

  // Load restaurant data (hardcoded first, fallback to API)
  useEffect(() => {
    const localRest = BANGALORE_RESTAURANTS.find((r) => r._id === restaurantId);
    if (localRest) {
      setRestaurant(localRest);
      setMenuItems(localRest.menu.filter((item) => item.available));
      setLoading(false);
    } else {
      // Try API as fallback
      Promise.all([
        api.get(`/api/restaurants/${restaurantId}`),
        api.get(`/api/menu/restaurant/${restaurantId}`),
      ])
        .then(([restRes, menuRes]) => {
          setRestaurant(restRes.data.data);
          setMenuItems(menuRes.data.data.filter((item) => item.available));
        })
        .catch(() => {
          addToast('Restaurant not found.', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [restaurantId, addToast]);

  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleAddToCart = useCallback(
    (item) => {
      if (!user) {
        // Save pending item and show auth modal
        pendingItemRef.current = item;
        setShowAuthModal(true);
        return;
      }
      addItem({
        ...item,
        menuItemId: item._id,
        restaurantId,
      });
      addToast(`Added "${item.name}" to cart`, 'success');
    },
    [user, addItem, restaurantId, addToast]
  );

  const handleAuthSuccess = useCallback(
    () => {
      setShowAuthModal(false);
      // Auto-add the pending item
      if (pendingItemRef.current) {
        const item = pendingItemRef.current;
        addItem({
          ...item,
          menuItemId: item._id,
          restaurantId,
        });
        addToast(`Added "${item.name}" to cart`, 'success');
        pendingItemRef.current = null;
      }
    },
    [addItem, restaurantId, addToast]
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-12">
        {/* Skeleton header */}
        <div className="h-64 rounded-2xl shimmer mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-xl overflow-hidden">
              <div className="h-48 shimmer" />
              <div className="bg-white p-4 space-y-3">
                <div className="h-5 w-2/3 shimmer rounded" />
                <div className="h-4 w-full shimmer rounded" />
                <div className="h-10 w-full shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Restaurant Not Found</h2>
        <p className="text-slate-500 mb-6">This restaurant doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="bg-ember text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-ember/90 transition-colors"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 pb-32">
      {/* ─── Auth Modal ─── */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* ─── Restaurant Hero Header ─── */}
      <motion.div
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop&q=80'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Back button */}
        <button
          onClick={() => navigate('/restaurants')}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-all flex items-center gap-2 border border-white/10"
        >
          ← Back
        </button>

        {/* Restaurant info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-2">
                {restaurant.name}
              </h1>
              <p className="text-white/70 text-sm md:text-base mb-3 max-w-2xl">
                {restaurant.description}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {restaurant.cuisine?.map((c, i) => (
                  <span key={i} className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium border border-white/10">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/10">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-gold text-sm">★</span>
                  <span className="text-white font-bold text-lg">{restaurant.rating || '4.0'}</span>
                </div>
                <span className="text-white/60 text-xs">Rating</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/10">
                <div className="text-white font-bold text-lg">{restaurant.avgPrepTime || 20}</div>
                <span className="text-white/60 text-xs">min</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Category Tabs ─── */}
      <motion.div
        className="mb-8 overflow-x-auto no-scrollbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-ink text-white shadow-md'
                  : 'bg-white text-slate-600 border border-neutral-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({menuItems.filter((m) => m.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Menu Items Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.4 }}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group"
            >
              {/* Item Image */}
              {item.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                    <span className="font-mono font-bold text-sm text-ink">₹{item.price}</span>
                  </div>
                  {item.prepTime && (
                    <div className="absolute top-3 left-3 bg-ink/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-white text-xs font-medium">🕐 {item.prepTime} min</span>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h3 className="font-display text-lg font-bold text-ink leading-tight">
                    {item.name}
                  </h3>
                  {!item.image && (
                    <span className="font-mono font-bold text-lg text-ember whitespace-nowrap">₹{item.price}</span>
                  )}
                </div>
                
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full font-medium border border-slate-100">
                    {item.category}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(item)}
                    className="bg-ember hover:bg-ember/90 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>Add</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Empty State ─── */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="font-display text-xl font-bold text-ink mb-2">No items in this category</h3>
          <p className="text-slate-500">Try another category or check back later</p>
        </div>
      )}

      {/* ─── Floating Cart Bar ─── */}
      <AnimatePresence>
        {itemCount > 0 && cart.restaurantId === restaurantId && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-40"
          >
            <div className="bg-ink text-white px-6 py-4 rounded-2xl shadow-elevated flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="bg-ember text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {itemCount}
                </span>
                <div>
                  <div className="text-xs text-white/50">Cart Total</div>
                  <div className="font-mono font-bold text-lg">₹{totalPrice}</div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/checkout')}
                className="bg-white text-ink font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors shadow-sm"
              >
                Checkout →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
