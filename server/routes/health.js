const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * GET /api/health
 * Returns server status and MongoDB connection state.
 * The readyState values: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
router.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbConnected = dbState === 1;

  // Also do an actual ping to verify the connection is live, not just "connected" in memory
  let dbPingOk = false;
  if (dbConnected) {
    try {
      await mongoose.connection.db.admin().ping();
      dbPingOk = true;
    } catch (err) {
      dbPingOk = false;
    }
  }

  const status = dbConnected && dbPingOk ? 200 : 503;
  res.status(status).json({
    success: status === 200,
    server: 'running',
    dbConnected,
    dbPingOk,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
