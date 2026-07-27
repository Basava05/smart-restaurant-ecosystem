import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PasswordInput from '../../components/ui/PasswordInput';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      addToast('Account created successfully', 'success');
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && data.errors.length > 0) {
        addToast(data.errors[0].message, 'error');
      } else {
        addToast(data?.error || err.message || 'Registration failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-neutral-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-herb/5 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-ember/5 blur-3xl" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-ink">SmartEats</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-neutral-100 overflow-hidden">
          {/* Header */}
          <div className="bg-ink px-8 py-8 text-center">
            <h1 className="font-display text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/50 text-sm">Join SmartEats to start ordering</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <PasswordInput
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">I am a</label>
                <select
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="owner">Restaurant Owner</option>
                  <option value="chef">Kitchen Chef</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-ember hover:bg-ember/90 text-white font-semibold py-3.5 rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
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
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-ember font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
