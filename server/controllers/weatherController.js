const axios = require('axios');
const MenuItem = require('../models/MenuItem');

exports.getRecommendations = async (req, res) => {
  try {
    let { lat, lng } = req.query;
    
    // Default to Bangalore, India if no coords provided
    if (!lat || !lng || lat === 'null' || lng === 'null') {
      lat = 12.9716;
      lng = 77.5946;
    }

    const API_KEY = process.env.WEATHER_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ success: false, error: 'Weather API key missing' });
    }

    // Call OpenWeatherMap
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
    const weatherResponse = await axios.get(url);
    const weatherData = weatherResponse.data;
    
    // Call Geo API for state info
    let locationName = weatherData.name;
    try {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${API_KEY}`;
      const geoResponse = await axios.get(geoUrl);
      if (geoResponse.data && geoResponse.data.length > 0) {
        const geoData = geoResponse.data[0];
        const state = geoData.state ? `, ${geoData.state}` : '';
        locationName = `${geoData.name}${state}, ${geoData.country}`;
      }
    } catch (geoError) {
      console.error('Geo API error:', geoError.message);
      // Fallback to basic name
      locationName = weatherData.name;
    }

    const condition = weatherData.weather[0].main.toLowerCase(); // e.g., 'clear', 'rain', 'clouds', 'snow'
    const temp = weatherData.main.temp;
    
    // Map to our internal tags: sunny, rainy, cloudy, cold, hot
    let mappedTag = 'sunny';
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
      mappedTag = 'rainy';
    } else if (condition.includes('cloud')) {
      mappedTag = 'cloudy';
    } else if (condition.includes('snow') || temp < 15) {
      mappedTag = 'cold';
    } else if (temp > 30) {
      mappedTag = 'hot';
    } else if (condition.includes('clear')) {
      mappedTag = 'sunny';
    }

    // Find 4 random menu items matching the tag
    let recommendations = await MenuItem.aggregate([
      { $match: { weatherTags: mappedTag, available: true } },
      { $sample: { size: 4 } }
    ]);

    // Fallback if the database doesn't have tagged items yet
    if (recommendations.length === 0) {
      recommendations = await MenuItem.aggregate([
        { $match: { available: true } },
        { $sample: { size: 4 } }
      ]);
    }

    // Populate restaurant details
    const populatedRecs = await MenuItem.populate(recommendations, { path: 'restaurantId', select: 'name address image' });

    res.status(200).json({
      success: true,
      data: {
        weather: {
          condition: weatherData.weather[0].main,
          description: weatherData.weather[0].description,
          temp: Math.round(temp),
          tag: mappedTag,
          city: locationName
        },
        recommendations: populatedRecs
      }
    });

  } catch (error) {
    console.error('Weather error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch weather recommendations' });
  }
};
