import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BANGALORE_RESTAURANTS from '../../data/restaurantData';

const CHIP_CUISINES = [
  { name: 'South Indian', icon: '🥘' },
  { name: 'Biryani', icon: '🍚' },
  { name: 'Continental', icon: '🥩' },
  { name: 'Vegetarian', icon: '🥗' },
  { name: 'Non-Veg', icon: '🍗' },
  { name: 'Brewery', icon: '🍺' },
  { name: 'Cafe', icon: '☕' },
  { name: 'Pizza', icon: '🍕' },
];

export default function RestaurantsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get('cuisine') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Sync cuisine from URL params
  useEffect(() => {
    const cuisine = searchParams.get('cuisine');
    if (cuisine) setSelectedCuisine(cuisine);
  }, [searchParams]);

  // Filter restaurants
  const filtered = useMemo(() => {
    return BANGALORE_RESTAURANTS.filter((rest) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        rest.name.toLowerCase().includes(searchLower) ||
        rest.cuisine.some((c) => c.toLowerCase().includes(searchLower)) ||
        rest.address.toLowerCase().includes(searchLower) ||
        (rest.menu && rest.menu.some((item) => 
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
        ));

      const matchesCuisine =
        !selectedCuisine ||
        rest.cuisine.includes(selectedCuisine);

      return matchesSearch && matchesCuisine;
    });
  }, [search, selectedCuisine]);

  const recommended = useMemo(() => {
    // Just grab top 3 by AI match score as recommendation
    return [...BANGALORE_RESTAURANTS].sort((a, b) => b.aiMatchScore - a.aiMatchScore).slice(0, 3);
  }, []);

  const handleCuisineClick = (cuisine) => {
    if (selectedCuisine === cuisine) {
      setSelectedCuisine('');
      setSearchParams({});
    } else {
      setSelectedCuisine(cuisine);
      setSearchParams({ cuisine });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      {/* ─── Page Header ─── */}
      <div className="text-center mb-10">
        <motion.h1
          className="font-display text-4xl md:text-5xl font-extrabold text-ink mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Find Restaurants That <span className="text-gradient">Match Your Mood</span>
        </motion.h1>
        <motion.p
          className="text-slate-500 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          AI-driven recommendations across {BANGALORE_RESTAURANTS.length} premium dining destinations.
        </motion.p>
      </div>

      {/* ─── Search Bar ─── */}
      <motion.div
        className="max-w-3xl mx-auto mb-8 relative z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
            <span>🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search for restaurants, cuisines, or dishes... (AI Search coming soon)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3.5 pl-12 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-ember/20 transition-all text-ink shadow-sm"
          />
        </div>
      </motion.div>

      {/* ─── Cuisine Filter Chips ─── */}
      <motion.div
        className="flex overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center gap-3 mb-10 px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => { setSelectedCuisine(''); setSearchParams({}); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border shadow-sm whitespace-nowrap
            ${!selectedCuisine 
              ? 'bg-ink text-white border-ink shadow-[0_0_15px_rgba(30,35,32,0.3)]' 
              : 'bg-white text-slate-600 border-neutral-200 hover:border-slate-300 hover:bg-slate-50'}`}
        >
          <span>🌟</span> All Options
        </button>
        {CHIP_CUISINES.map(({ name, icon }) => (
          <button
            key={name}
            onClick={() => handleCuisineClick(name)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border shadow-sm whitespace-nowrap
              ${selectedCuisine === name 
                ? 'bg-ember text-white border-ember shadow-[0_0_15px_rgba(226,87,29,0.4)]' 
                : 'bg-white text-slate-600 border-neutral-200 hover:border-ember/30 hover:text-ember hover:bg-orange-50/50'}`}
          >
            <span>{icon}</span> {name}
          </button>
        ))}
      </motion.div>

      {/* ─── AI Recommended Section ─── */}
      {!search && !selectedCuisine && (
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">✨</span>
            <h2 className="font-display text-2xl font-bold text-ink">Recommended For You</h2>
            <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
              Based on Weather & Time
            </span>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
            {recommended.map((rest, i) => (
              <motion.div
                key={`rec-${rest._id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                onClick={() => navigate(`/restaurant/${rest._id}`)}
                className="min-w-[320px] md:min-w-[400px] flex-shrink-0 snap-start bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-neutral-200 shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer group p-3 flex gap-4"
              >
                <div className="w-28 h-28 rounded-xl overflow-hidden relative shrink-0">
                  <img src={rest.image} alt={rest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>
                <div className="flex-1 py-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-display text-lg font-bold text-ink group-hover:text-ember transition-colors line-clamp-1">{rest.name}</h3>
                  </div>
                  <p className="text-slate-500 text-xs mb-2 line-clamp-1">Perfect for {rest.weatherPick}</p>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1"><span className="text-gold">★</span> {rest.rating}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="flex items-center gap-1 text-blue-600"><span>📍</span> {rest.distance} km</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Results Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="font-display text-2xl font-bold text-ink">
          {selectedCuisine ? `${selectedCuisine} Restaurants` : 'All Restaurants'}
          <span className="ml-3 text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full align-middle">
            {filtered.length} found
          </span>
        </h2>
      </div>

      {/* ─── Restaurant Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filtered.map((rest, i) => (
          <motion.div
            key={rest._id}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min((i % 10) * 0.05, 0.3), duration: 0.5 }}
            onClick={() => navigate(`/restaurant/${rest._id}`)}
            className="group relative bg-white rounded-2xl border border-neutral-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={rest.image}
                alt={rest.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-80" />
              
              {/* Top Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <div className="bg-white/95 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
                  <span className="text-gold text-xs">★</span>
                  <span className="text-xs font-bold text-ink">{rest.rating}</span>
                </div>
                {rest.aiMatchScore > 90 && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm transform origin-left group-hover:scale-105 transition-transform">
                    <span className="text-xs">🤖</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide">Top Match</span>
                  </div>
                )}
              </div>

              <div className="absolute top-3 right-3">
                <div className="bg-white/95 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-slate-400 hover:text-coral transition-colors">
                  ♡
                </div>
              </div>

              {/* Bottom Info inside Image */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div className="flex gap-2">
                  <span className="glass-dark rounded-md px-2 py-1 text-xs font-medium text-white shadow-sm border border-white/20">
                    🕐 {rest.avgPrepTime}m
                  </span>
                  <span className="glass-dark rounded-md px-2 py-1 text-xs font-medium text-white shadow-sm border border-white/20">
                    📍 {rest.distance} km
                  </span>
                </div>
                <span className="glass-dark rounded-md px-2 py-1 text-xs font-semibold text-white shadow-sm border border-white/20">
                  {rest.priceRange.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-xl font-bold text-ink group-hover:text-ember transition-colors duration-200 line-clamp-1 pr-2">
                  {rest.name}
                </h3>
                <span className="shrink-0 flex h-2 w-2 mt-2 relative">
                  {rest.liveKitchenStatus === 'Busy' ? (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-coral opacity-75 animate-ping"></span>
                  ) : rest.liveKitchenStatus === 'Normal' || rest.liveKitchenStatus === 'Accepting Orders' ? (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"></span>
                  ) : null}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    rest.liveKitchenStatus === 'Busy' ? 'bg-coral' : 
                    rest.liveKitchenStatus === 'Preparing' ? 'bg-amber' : 'bg-success'
                  }`}></span>
                </span>
              </div>
              
              <p className="text-slate-500 text-sm mb-4 line-clamp-1">
                {rest.description}
              </p>

              {/* Dynamic details revealed on hover on desktop */}
              <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 group-hover:mb-4 transition-all duration-300 overflow-hidden hidden md:block">
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Popular:</span>
                    <span className="text-ink truncate ml-2">{rest.menu[0]?.name || 'House Special'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Kitchen:</span>
                    <span className="text-ink">{rest.liveKitchenStatus}</span>
                  </div>
                </div>
              </div>

              {/* Cuisine tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {rest.cuisine.slice(0, 3).map((c, j) => (
                  <span
                    key={j}
                    className="text-[11px] bg-slate-50 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-100"
                  >
                    {c}
                  </span>
                ))}
                {rest.cuisine.length > 3 && (
                  <span className="text-[11px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md font-medium border border-slate-100">
                    +{rest.cuisine.length - 3}
                  </span>
                )}
              </div>

              {/* CTA */}
              <button className="w-full bg-slate-50 hover:bg-ink text-ink hover:text-white font-semibold py-3 rounded-xl text-sm transition-colors duration-300 flex items-center justify-center gap-2 group-hover:shadow-md border border-slate-200 hover:border-transparent">
                <span>View Menu & Order</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── No Results ─── */}
      {filtered.length === 0 && (
        <motion.div
          className="text-center py-20 max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-48 h-48 mx-auto mb-6 opacity-80">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="#F8FAFC" />
              <path d="M100 40C66.8629 40 40 66.8629 40 100C40 133.137 66.8629 160 100 160C133.137 160 160 133.137 160 100C160 66.8629 133.137 40 100 40ZM100 145C75.1472 145 55 124.853 55 100C55 75.1472 75.1472 55 100 55C124.853 55 145 75.1472 145 100C145 124.853 124.853 145 100 145Z" fill="#E2E8F0"/>
              <path d="M85 85C85 80.5817 88.5817 77 93 77C97.4183 77 101 80.5817 101 85C101 89.4183 97.4183 93 93 93C88.5817 93 85 89.4183 85 85Z" fill="#94A3B8"/>
              <path d="M125 115C125 119.418 121.418 123 117 123C112.582 123 109 119.418 109 115C109 110.582 112.582 107 117 107C121.418 107 125 110.582 125 115Z" fill="#94A3B8"/>
              <path d="M75 120C82 135 118 135 125 120" stroke="#94A3B8" strokeWidth="8" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="font-display text-2xl font-bold text-ink mb-3">No matches found</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Our AI couldn't find exactly what you're looking for. Try adjusting your search terms or clearing current filters.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCuisine(''); setSearchParams({}); }}
            className="bg-ember text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-ember/90 transition-all duration-200 shadow-hero hover:shadow-lg hover:-translate-y-0.5"
          >
            Reset All Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
