import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import WeatherWidget from '../../components/WeatherWidget';
import BANGALORE_RESTAURANTS from '../../data/restaurantData';

const FEATURED = BANGALORE_RESTAURANTS.slice(0, 8);

const HOW_IT_WORKS = [
  { icon: '🔍', title: 'Browse Restaurants', desc: 'Explore 15+ handpicked Bangalore restaurants with detailed menus and ratings.' },
  { icon: '🛒', title: 'Add to Cart', desc: 'Pick your favourite dishes, customize quantities, and build your perfect meal.' },
  { icon: '🚀', title: 'Order & Track', desc: 'Place your order, pay securely, and track it in real-time from kitchen to doorstep.' },
];

const POPULAR_CUISINES = [
  { name: 'South Indian', emoji: '🥘' },
  { name: 'Biryani', emoji: '🍚' },
  { name: 'Burgers', emoji: '🍔' },
  { name: 'Pizza', emoji: '🍕' },
  { name: 'North Indian', emoji: '🫓' },
  { name: 'Continental', emoji: '🥩' },
  { name: 'Brewery', emoji: '🍺' },
  { name: 'BBQ', emoji: '🔥' },
  { name: 'Cafe', emoji: '☕' },
  { name: 'Sweets', emoji: '🍬' },
];

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-sm ${i < fullStars ? 'text-gold' : i === fullStars && hasHalf ? 'text-gold' : 'text-neutral-300'}`}>
          {i < fullStars ? '★' : i === fullStars && hasHalf ? '★' : '☆'}
        </span>
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-700">{rating}</span>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-scroll featured restaurants
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(FEATURED.length / 4));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-steel">
      {/* ─── Hero Section ─── */}
      <section className="gradient-hero relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-ember/10 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-herb/10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-5 py-20 md:py-28 lg:py-36 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text Content */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-semibold tracking-wide">AI Powered Dining</span>
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
                Experience<br />
                <span className="text-gradient">Smarter</span> Dining.
              </h1>

              <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-6 font-light leading-relaxed">
                Your intelligent dining companion. Get AI recommendations, live Estimated Time of Arrival(ETA), smart kitchen scheduling, and weather-aware suggestions in one seamless experience.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
                {['🤖 AI Recommendations', '⏱️ Live ETA', '🌦️ Weather Smart', '👨‍🍳 Kitchen Tracking', '💳 Secure Pay'].map((feat, i) => (
                  <span key={i} className="text-xs font-medium text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                    {feat}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/restaurants')}
                  className="bg-ember hover:bg-ember/90 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-hero transition-all duration-200"
                >
                  Explore Restaurants →
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-8 py-4 rounded-xl text-lg backdrop-blur-sm transition-all duration-200"
                >
                  Watch Demo
                </motion.button>
              </div>

              {/* Value Metrics instead of normal Stats */}
              <div className="flex items-center gap-8 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400">15+</span>
                  </div>
                  <div className="text-white/60 text-xs md:text-sm mt-1">Premium Restaurants</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-gold">&lt; 20m</span>
                  </div>
                  <div className="text-white/60 text-xs md:text-sm mt-1">Avg Wait Time</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-blue-400">Live</span>
                  </div>
                  <div className="text-white/60 text-xs md:text-sm mt-1">Kitchen Tracking</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Living Hero Collage */}
            <motion.div
              className="flex-1 hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative w-full max-w-lg mx-auto">
                {/* Main large image */}
                <div className="rounded-2xl overflow-hidden shadow-elevated border border-white/10 aspect-[4/3] relative">
                  <img
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=450&fit=crop&q=80"
                    alt="Restaurant interior"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                </div>

                {/* Floating card 1: ETA & Distance */}
                <motion.div
                  className="absolute -top-6 -left-6 glass-dark rounded-xl shadow-elevated px-3 py-2 border border-white/10"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">📍</span>
                      <span className="text-white/80 text-[11px] font-medium">3.2 km away</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <span className="text-emerald-400 text-xs">⏱️</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs">11 min ETA</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card 2: AI Suggestion */}
                <motion.div
                  className="absolute -bottom-4 -right-4 glass-dark rounded-xl shadow-elevated p-3 border border-white/10 z-10"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                      <img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=100&fit=crop&q=80" alt="Soup" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">AI Suggests</span>
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                      </div>
                      <div className="font-semibold text-sm text-white">Tomato Soup</div>
                      <div className="text-xs text-white/50">House Special • ₹150</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card 3: Weather */}
                <motion.div
                  className="absolute top-1/2 -right-8 -translate-y-1/2 glass-dark rounded-xl shadow-elevated px-4 py-2.5 border border-white/10"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl drop-shadow-md">🌧️</span>
                    <div>
                      <div className="text-white font-bold text-sm">Rainy, 22°C</div>
                      <div className="text-white/50 text-[10px]">Perfect for soup</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card 4: Kitchen Status */}
                <motion.div
                  className="absolute bottom-6 -left-8 glass-dark rounded-xl shadow-elevated px-4 py-2 border border-white/10"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-white font-medium text-xs">Kitchen: Ready</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#F5F5F7" />
          </svg>
        </div>
      </section>

      {/* ─── Weather Recommendations ─── */}
      <WeatherWidget />

      {/* ─── Featured Restaurants ─── */}
      <section className="max-w-7xl mx-auto px-5 py-16 md:py-20">
        <div className="text-center mb-12">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold text-ink mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Featured Restaurants
          </motion.h2>
          <div className="section-divider mb-4" />
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Hand-picked favorites that Bangalore swears by
          </p>
        </div>

        <div
          ref={scrollRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {FEATURED.map((rest, i) => (
            <motion.div
              key={rest._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              onClick={() => navigate(`/restaurant/${rest._id}`)}
              className="card-premium cursor-pointer group overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={rest.image}
                  alt={rest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 w-fit">
                    <span className="text-gold text-xs">★</span>
                    <span className="text-xs font-bold text-ink">{rest.rating}</span>
                  </div>
                </div>
              </div>
              {/* Content */}
              <div className="p-4">
                <h3 className="font-display text-lg font-bold text-ink mb-1 truncate group-hover:text-ember transition-colors">
                  {rest.name}
                </h3>
                <p className="text-slate-500 text-sm mb-3 line-clamp-1">{rest.address}</p>
                <div className="flex flex-wrap gap-1.5">
                  {rest.cuisine.slice(0, 2).map((c, j) => (
                    <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                  <span className="text-xs bg-herb/10 text-herb px-2 py-0.5 rounded-full font-medium">
                    {rest.avgPrepTime} min
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/restaurants')}
            className="bg-ink hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all duration-200 shadow-card"
          >
            View All 15 Restaurants →
          </motion.button>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <motion.h2
              className="font-display text-3xl md:text-4xl font-bold text-ink mb-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              How It Works
            </motion.h2>
            <div className="section-divider mb-4" />
            <p className="text-slate-500 text-lg">Three simple steps to your next meal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center group"
              >
                <div className="relative inline-flex">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ember/10 to-gold/10 flex items-center justify-center text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 mx-auto border border-ember/10">
                    {step.icon}
                  </div>
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ember text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-ink mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Popular Cuisines ─── */}
      <section className="max-w-7xl mx-auto px-5 py-16 md:py-20">
        <div className="text-center mb-12">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold text-ink mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Popular Cuisines
          </motion.h2>
          <div className="section-divider mb-4" />
          <p className="text-slate-500 text-lg">What are you craving today?</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {POPULAR_CUISINES.map((cuisine, i) => (
            <motion.button
              key={cuisine.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/restaurants?cuisine=${encodeURIComponent(cuisine.name)}`)}
              className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-5 py-3 text-base font-medium text-slate-700 shadow-card hover:shadow-card-hover hover:border-ember/30 hover:text-ember transition-all duration-200"
            >
              <span className="text-xl">{cuisine.emoji}</span>
              <span>{cuisine.name}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="bg-ink py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-ember/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-herb/5 blur-3xl" />

        <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Order?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Browse menus, discover new favourites, and enjoy the best food Bangalore has to offer — all in one place.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/restaurants')}
              className="gradient-warm text-white font-semibold px-10 py-4 rounded-xl text-lg shadow-hero transition-all duration-200"
            >
              Start Ordering Now 🍽️
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
