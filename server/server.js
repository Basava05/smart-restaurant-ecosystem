require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const botRoutes = require('./routes/bot');
const notificationRoutes = require('./routes/notificationRoutes'); // Phase 10
const analyticsRoutes = require('./routes/analytics'); // Phase 11

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Socket.IO Setup (Phase 7)
// ---------------------------------------------------------------------------
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to req so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Helmet: sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// CORS: restrict to CLIENT_URL only — never use '*' in production
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// We need to exclude the webhook route from the global express.json() parser
// because Razorpay webhook signature verification requires the raw body buffer.
app.use('/api/payments/webhook', paymentRoutes);

// Parse JSON bodies (limit to 10MB for image payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL injection protection: strips any keys starting with '$' or containing '.'
// from req.body, req.query, and req.params — blocks payloads like {"email": {"$gt": ""}}
app.use(mongoSanitize());

// Request logging
app.use(morgan('dev'));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes); // Phase 2
app.use('/api/admin', adminRoutes);
app.use('/api/bot', botRoutes); // Phase 2
app.use('/api/restaurants', restaurantRoutes); // Phase 3
app.use('/api/menu', menuRoutes); // Phase 3
app.use('/api/orders', orderRoutes); // Phase 4
app.use('/api/payments', paymentRoutes); // Phase 5
app.use('/api/notifications', notificationRoutes); // Phase 10
app.use('/api/analytics', analyticsRoutes); // Phase 11
app.use('/api/admin', require('./routes/admin')); // Phase 12
app.use('/api/weather', require('./routes/weather')); // Phase 8 - Weather Recommendations

// ---------------------------------------------------------------------------
// Error Handling Middleware
// ---------------------------------------------------------------------------
app.use(errorHandler);


const Order = require('./models/Order');

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Customer joins room for their specific order
  socket.on('join_order_room', (orderId) => {
    socket.join(`order_${orderId}`);
  });

  // Kitchen joins room for their restaurant
  socket.on('join_kitchen_room', (restaurantId) => {
    socket.join(`kitchen_${restaurantId}`);
  });

  // Customer live location push
  socket.on('update_location', async (data) => {
    try {
      const { orderId, lat, lng } = data;
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { customerLocation: { lat, lng } } },
        { new: true }
      );
      // Drift detection can happen in the cron sweep or immediately here
    } catch (err) {
      console.error('Failed to update location via socket', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start Cron Jobs
const { startEtaSweep } = require('./cron/etaSweep');
const { startNightlyRollup } = require('./cron/nightlyRollup');
startEtaSweep(io);
startNightlyRollup();

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
const start = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

start();

// Export for Socket.io setup in Phase 7 and for testing
module.exports = { app, server };
