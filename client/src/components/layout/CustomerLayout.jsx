import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import BotWidget from '../ui/BotWidget';

/**
 * CustomerLayout — premium glassmorphism navbar with full-width layout.
 */
export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/restaurants', label: 'Restaurants' },
  ];

  return (
    <div className="min-h-screen bg-steel">
      {/* ─── Glassmorphism Navbar ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass shadow-glass py-2'
            : 'bg-transparent py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg gradient-warm flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-display text-lg font-bold leading-tight transition-colors ${scrolled ? 'text-ink' : 'text-ink'}`}>
                SmartEats
              </span>
              <span className="text-xs text-slate-500 font-medium -mt-0.5 hidden sm:block">Bangalore</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-ember/10 text-ember'
                    : 'text-slate-600 hover:text-ink hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            {itemCount > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => navigate('/checkout')}
                className="relative flex items-center gap-2 bg-ember text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ember/90 transition-colors shadow-md"
              >
                <span>🛒</span>
                <span className="hidden sm:inline">Cart</span>
                <span className="bg-white text-ember text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </motion.button>
            )}

            {/* User */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-herb flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.name?.split(' ')[0]}</span>
                </Link>
                {user.role !== 'customer' && (
                  <button
                    onClick={logout}
                    className="text-sm text-slate-500 hover:text-ink transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-ink text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className={`w-5 h-0.5 bg-ink transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`w-5 h-0.5 bg-ink transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-ink transition-all duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-neutral-200 overflow-hidden"
            >
              <div className="px-5 py-4 space-y-1">
                {navLinks.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive(path)
                        ? 'bg-ember/10 text-ember'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* ─── Main Content ─── */}
      <main className="min-h-[calc(100vh-200px)]">
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-ink text-white/60 mt-auto">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg gradient-warm flex items-center justify-center">
                  <span className="text-white font-bold text-base">S</span>
                </div>
                <span className="font-display text-xl font-bold text-white">SmartEats</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-md">
                Discover Bangalore's finest restaurants, explore diverse cuisines, and enjoy seamless ordering with real-time kitchen tracking. Your next great meal is just a click away.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display text-base font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-sm hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/restaurants" className="text-sm hover:text-white transition-colors">Restaurants</Link></li>
                <li><Link to="/login" className="text-sm hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="text-sm hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-base font-bold text-white mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <span>📍</span> Bangalore, Karnataka
                </li>
                <li className="flex items-center gap-2">
                  <span>📧</span> hello@smarteats.in
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span> +91 80 1234 5678
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} SmartEats — Smart Restaurant Ecosystem. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/30">
              <span className="hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white/60 cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── AI Assistant Bot ─── */}
      <BotWidget />
    </div>
  );
}
