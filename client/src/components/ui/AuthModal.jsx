import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PasswordInput from './PasswordInput';

/**
 * AuthModal — sleek overlay modal for login/register.
 * Appears when unauthenticated user tries to add to cart.
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onSuccess: (user) => void — called after successful auth
 */
export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { addToast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const resetForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      addToast('Signed in successfully!', 'success');
      resetForms();
      onSuccess?.(user);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length > 0) {
        addToast(data.errors[0].message, 'error');
      } else {
        addToast(data?.error || 'Login failed. Please check your credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: 'customer',
      });
      addToast('Account created successfully!', 'success');
      resetForms();
      onSuccess?.(user);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length > 0) {
        addToast(data.errors[0].message, 'error');
      } else {
        addToast(data?.error || 'Registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-ink px-6 py-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                ✕
              </button>
              <div className="text-3xl mb-2">🍽️</div>
              <h2 className="font-display text-2xl font-bold text-white mb-1">
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-white/50 text-sm">
                {tab === 'login'
                  ? 'Sign in to add items to your cart'
                  : 'Join us to start ordering delicious food'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-50 border-b border-neutral-200">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${
                  tab === 'login'
                    ? 'text-ember border-b-2 border-ember bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${
                  tab === 'register'
                    ? 'text-ember border-b-2 border-ember bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Register
              </button>
            </div>

            {/* Forms */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {tab === 'login' ? (
                  <motion.form
                    key="login-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                      <PasswordInput
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="w-full bg-ember hover:bg-ember/90 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleRegister}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                      <PasswordInput
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="w-full bg-ember hover:bg-ember/90 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating account...
                        </span>
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              <p className="text-center text-xs text-slate-400 mt-5">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
