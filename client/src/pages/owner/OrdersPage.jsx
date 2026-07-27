import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchOrdersAndTables = useCallback(async (restId) => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        api.get(`/api/orders/restaurant/${restId}`),
        api.get(`/api/restaurants/${restId}/available-tables`)
      ]);
      setOrders(ordersRes.data.data || []);
      setAvailableTables(tablesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: restData } = await api.get('/api/restaurants/owner/me');
        const rId = restData.data._id;
        setRestaurantId(rId);
        await fetchOrdersAndTables(rId);
      } catch (err) {
        console.error('Failed to init OrdersPage', err);
        addToast('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchOrdersAndTables, addToast]);

  // Optional: keep sync via sockets
  useEffect(() => {
    if (!restaurantId) return;
    socket.connect();
    socket.emit('join_kitchen_room', restaurantId);

    const handleUpdate = () => fetchOrdersAndTables(restaurantId);
    
    socket.on('new_order', handleUpdate);
    socket.on('order_updated', handleUpdate);

    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_updated', handleUpdate);
    };
  }, [restaurantId, fetchOrdersAndTables]);

  const handleAssignTable = async (orderId, tableNumber) => {
    try {
      await api.patch(`/api/orders/${orderId}/table`, { tableNumber: Number(tableNumber) });
      addToast(`Table ${tableNumber} assigned successfully!`, 'success');
      if (restaurantId) fetchOrdersAndTables(restaurantId);
    } catch (err) {
      addToast('Failed to assign table', 'error');
    }
  };

  const handleClearTable = async (orderId) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { orderStatus: 'completed' });
      addToast('Table cleared successfully!', 'success');
      if (restaurantId) fetchOrdersAndTables(restaurantId);
    } catch (err) {
      addToast('Failed to clear table', 'error');
    }
  };

  if (loading) return <div className="p-4 text-rail">Loading orders...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink mb-2">Order History & Tables</h2>
          <p className="text-rail font-body">Manage recent orders and assign tables to customers.</p>
        </div>
        <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
          Available Tables: {availableTables.length}
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <p className="text-rail">No recent orders found.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const needsTable = !order.table?.number && ['preparing', 'ready'].includes(order.orderStatus);
            const canClear = !!order.table?.number;
            
            return (
              <Card key={order._id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-ink text-lg">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <Badge 
                      variant={
                        order.orderStatus === 'completed' ? 'success' : 
                        order.orderStatus === 'cancelled' ? 'error' : 
                        'primary'
                      }
                    >
                      {order.orderStatus}
                    </Badge>
                    {order.table?.number && (
                      <Badge variant="warning">
                        Table {order.table.number}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-rail mb-2">
                    {order.items?.map(item => `${item.qty}x ${item.name}`).join(', ')}
                  </div>
                  
                  <div className="text-xs font-mono text-rail/70">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Table Assignment UI */}
                  {needsTable && (
                    <div className="flex items-center gap-2">
                      <select 
                        className="text-sm border-slate-200 rounded-lg"
                        onChange={(e) => {
                          if (e.target.value) handleAssignTable(order._id, e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Assign Table...</option>
                        {availableTables.map(t => (
                          <option key={t} value={t}>Table {t}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {canClear && (
                    <Button variant="outline" size="sm" onClick={() => handleClearTable(order._id)}>
                      Clear Table
                    </Button>
                  )}

                  <div className="text-right ml-4">
                    <div className="font-mono font-bold text-xl text-ink">
                      ₹{order.totalPrice}
                    </div>
                    <div className="text-sm text-rail uppercase tracking-wider mt-1">
                      Total
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
