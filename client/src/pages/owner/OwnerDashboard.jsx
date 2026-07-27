import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { KpiSkeleton } from '../../components/ui/Skeleton';
import socket from '../../services/socket';

const ORDER_STATUS_COLORS = {
  confirmed:  'bg-blue-50 border-blue-200 text-blue-700',
  preparing:  'bg-orange-50 border-orange-200 text-orange-700',
  ready:      'bg-green-50 border-green-200 text-green-700',
  delivered:  'bg-slate-50 border-slate-200 text-slate-500',
  cancelled:  'bg-red-50 border-red-200 text-red-600',
};

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: restData } = await api.get('/api/restaurants/owner/me');
        setRestaurant(restData.data);

        const { data: ordersData } = await api.get(`/api/orders/kitchen/${restData.data._id}`);
        setOrders(ordersData.data || []);
        
        const { data: analyticsData } = await api.get(`/api/analytics/${restData.data._id}`);
        setAnalytics(analyticsData.data || null);
      } catch (err) {
        if (err.response?.status !== 404) {
          addToast('Failed to load dashboard data.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  // Real-time order updates
  useEffect(() => {
    if (!restaurant) return;
    socket.connect();
    socket.emit('join_kitchen_room', restaurant._id);

    socket.on('new_order', (order) => {
      setOrders(prev => prev.some(o => o._id === order._id) ? prev : [...prev, order]);
    });
    socket.on('order_updated', (updated) => {
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
    });

    return () => {
      socket.off('new_order');
      socket.off('order_updated');
      socket.disconnect();
    };
  }, [restaurant]);

  // KPIs
  const activeOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.orderStatus));
  const todayRevenue = analytics?.today?.todayRevenue || 0;
  const readyOrders = orders.filter(o => o.orderStatus === 'ready');

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Welcome back, {user?.name}</h2>
          <p className="text-rail font-body text-sm mt-1">
            {restaurant?.name} — Here's what's happening today.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            <Card>
              <h3 className="font-display text-sm font-semibold text-rail uppercase tracking-wider">Active Orders</h3>
              <p className="font-mono text-3xl font-bold text-ember mt-2">{activeOrders.length}</p>
            </Card>
            <Card>
              <h3 className="font-display text-sm font-semibold text-rail uppercase tracking-wider">Ready to Serve</h3>
              <p className="font-mono text-3xl font-bold text-herb mt-2">{readyOrders.length}</p>
            </Card>
            <Card>
              <h3 className="font-display text-sm font-semibold text-rail uppercase tracking-wider">Revenue Today</h3>
              <p className="font-mono text-3xl font-bold text-ink mt-2">₹{todayRevenue}</p>
            </Card>
            <Card>
              <h3 className="font-display text-sm font-semibold text-rail uppercase tracking-wider">Status</h3>
              <div className="mt-2">
                {restaurant ? <Badge status={restaurant.status} /> : <span className="text-sm text-rail italic">No profile</span>}
              </div>
            </Card>
          </>
        )}
      </section>

      {/* Active Orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold text-ink">Active Orders</h3>
          <Link
            to="/kitchen"
            className="text-sm font-semibold text-ember hover:underline flex items-center gap-1"
          >
            Open KDS →
          </Link>
        </div>

        {loading ? (
          <Card className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-ember/30 border-t-ember rounded-full animate-spin" />
          </Card>
        ) : orders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-rail font-body">No orders yet today.</p>
            <p className="text-sm text-slate-400 mt-1">Orders appear here as customers pay.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <Card key={order._id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLORS[order.orderStatus] || ''}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-sm text-ink truncate">
                    {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-ink">₹{order.totalPrice}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
