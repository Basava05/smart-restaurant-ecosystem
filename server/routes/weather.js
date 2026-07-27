const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/weatherController');

// GET /api/weather/recommendations
router.get('/recommendations', getRecommendations);

module.exports = router;
