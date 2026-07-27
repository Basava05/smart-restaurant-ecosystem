import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Find owner's restaurant ID first
        const { data: resData } = await api.get('/api/restaurants/owner/me');
        const restaurantId = resData.data._id;

        const { data: analytics } = await api.get(`/api/analytics/${restaurantId}`);
        setData(analytics.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-ink mb-6">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-ember/10">
          <h3 className="font-semibold text-rail mb-2">Today's Revenue</h3>
          <div className="text-4xl font-bold font-mono text-ember">
            ₹{data?.today?.todayRevenue || 0}
          </div>
        </Card>
        <Card className="bg-herb/10">
          <h3 className="font-semibold text-rail mb-2">Today's Orders</h3>
          <div className="text-4xl font-bold font-mono text-herb">
            {data?.today?.todayOrders || 0}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-xl font-bold mb-4">Last 7 Days (Rollup)</h3>
        {data?.history && data.history.length > 0 ? (
          <div className="space-y-4">
            {data.history.map(day => (
              <div key={day._id} className="flex justify-between items-center border-b border-rail/10 pb-2">
                <span className="font-mono text-rail">{new Date(day.date).toLocaleDateString()}</span>
                <span>{day.totalOrders} Orders</span>
                <span className="font-mono font-bold text-ink">₹{day.totalRevenue}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-rail">No historical data found.</p>
        )}
      </Card>
    </div>
  );
}
