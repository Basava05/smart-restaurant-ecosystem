import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function WeatherWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async (lat = null, lng = null) => {
      try {
        setLoading(true);
        const res = await api.get(`/api/weather/recommendations?lat=${lat}&lng=${lng}`);
        setData(res.data.data);
      } catch (err) {
        setError('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather() // fall back to defaults if permission denied
      );
    } else {
      fetchWeather();
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-5 py-8 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-3xl w-full" />
      </div>
    );
  }

  if (error || !data || !data.recommendations?.length) return null;

  const { weather, recommendations } = data;

  const weatherIcons = {
    sunny: '☀️',
    rainy: '🌧️',
    cloudy: '☁️',
    cold: '❄️',
    hot: '🔥'
  };

  const weatherIcon = weatherIcons[weather.tag] || '🌤️';
  const weatherMessage = 
    weather.tag === 'rainy' ? "It's raining! Perfect time for something hot and comforting." :
    weather.tag === 'hot' ? "Beat the heat with these refreshing choices!" :
    weather.tag === 'cold' ? "Warm up with these hearty meals." :
    weather.tag === 'cloudy' ? "A beautiful cloudy day calls for a great meal." :
    "Enjoy the sunshine with our top picks!";

  return (
    <section className="max-w-7xl mx-auto px-5 py-8 -mt-16 relative z-20">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-elevated border border-white/50">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4 bg-gradient-to-br from-ember/10 to-amber-500/10 p-4 rounded-2xl">
            <span className="text-5xl drop-shadow-md">{weatherIcon}</span>
            <div>
              <div className="text-2xl font-display font-bold text-ink">
                {weather.temp}°C, {weather.condition}
              </div>
              <div className="text-slate-500 font-medium">{weather.city}</div>
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink mb-1">
              Weather based Recommendations
            </h2>
            <p className="text-slate-600 font-medium">
              {weatherMessage}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {recommendations.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => {
                if (item.restaurantId?._id) {
                  navigate(`/restaurant/${item.restaurantId._id}`);
                }
              }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
            >
              <div className="h-32 w-full rounded-xl overflow-hidden mb-4 bg-slate-100 relative">
                <img
                  src={item.image || `https://source.unsplash.com/400x300/?${item.category},food`}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-ember">
                  ₹{item.price}
                </div>
              </div>
              <h3 className="font-bold text-ink mb-1 line-clamp-1">{item.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-1 mb-2 font-medium">
                {item.restaurantId?.name || 'Local Restaurant'}
              </p>
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  Matches Weather
                </span>
                <span className="text-sm">⭐️ 4.5</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
