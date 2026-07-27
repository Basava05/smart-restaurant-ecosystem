import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState({ users: 0, restaurants: 0, orders: 0 });
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { loginWithToken, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, usersRes, restRes, ordersRes] = await Promise.all([
          api.get('/api/admin/metrics'),
          api.get('/api/admin/users'),
          api.get('/api/admin/restaurants'),
          api.get('/api/admin/orders')
        ]);
        setMetrics(metricsRes.data.data);
        setUsers(usersRes.data.data);
        setRestaurants(restRes.data.data);
        setOrders(ordersRes.data.data);
      } catch (err) {
        addToast('Failed to load admin data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  const handleImpersonate = async (userId) => {
    try {
      const { data } = await api.post(`/api/admin/impersonate/${userId}`);
      loginWithToken(data.token, data.user);
      addToast(`Impersonating ${data.user.name}`, 'success');
      navigate('/');
    } catch (err) {
      addToast('Impersonation failed', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white hidden md:flex flex-col h-screen sticky top-0 left-0 border-r border-slate-800">
        <div className="p-6">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <span className="text-ember">SRE</span> Admin
          </h2>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users & Impersonation', icon: '👥' },
            { id: 'restaurants', label: 'Restaurants', icon: '🏪' },
            { id: 'orders', label: 'Global Orders', icon: '🧾' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === tab.id 
                ? 'bg-slate-800 text-white shadow-inner' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">Smart Restaurant Ecosystem v1.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-slate-500 mt-1">Manage your platform operations</p>
          </div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">👥</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Users</div>
                    <div className="text-3xl font-bold font-mono text-ink mt-1">{metrics.users}</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">🏪</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Restaurants</div>
                    <div className="text-3xl font-bold font-mono text-ink mt-1">{metrics.restaurants}</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">🧾</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Orders</div>
                    <div className="text-3xl font-bold font-mono text-ink mt-1">{metrics.orders}</div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-display text-lg font-bold">User Directory & Impersonation</h3>
                  <p className="text-slate-500 text-sm">Select a user to login as them for debugging purposes.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-3 font-semibold text-slate-600">User</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Email</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Role</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-ink">{u.name}</td>
                          <td className="px-6 py-4 text-slate-500">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              u.role === 'admin' ? 'bg-red-50 text-red-600' :
                              u.role === 'owner' ? 'bg-amber-50 text-amber-600' :
                              u.role === 'chef' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => handleImpersonate(u._id)}>
                              Login As
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RESTAURANTS TAB */}
            {activeTab === 'restaurants' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-display text-lg font-bold">Registered Restaurants</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-3 font-semibold text-slate-600">Restaurant Name</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Owner</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {restaurants.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-ink">{r.name}</td>
                          <td className="px-6 py-4 text-slate-500">{r.ownerId?.name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-right">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-display text-lg font-bold">Global Orders Monitor</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-3 font-semibold text-slate-600">Order ID</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Restaurant</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Customer</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map(o => (
                        <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{o._id.slice(-6)}</td>
                          <td className="px-6 py-4 font-medium text-ink">{o.restaurantId?.name || '-'}</td>
                          <td className="px-6 py-4 text-slate-500">{o.customerId?.name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize ${
                              o.orderStatus === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                              o.orderStatus === 'preparing' ? 'bg-blue-50 text-blue-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {o.orderStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-ink">
                            ₹{o.totalPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
