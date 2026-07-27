const axios = require('axios');
const WeatherCache = require('../models/WeatherCache');

/**
 * Normalizes coordinates to ~11km grid to increase cache hit rate.
 * e.g., 17.3850 -> 17.4, 78.4867 -> 78.5
 */
const getCacheKey = (lat, lng) => {
  return `${lat.toFixed(1)},${lng.toFixed(1)}`;
};

/**
 * Maps OpenWeatherMap conditions to our internal tags
 */
const mapConditionToTag = (weatherId) => {
  if (weatherId >= 200 && weatherId < 600) return 'Rain';
  if (weatherId >= 600 && weatherId < 700) return 'Cold';
  if (weatherId === 800) return 'Clear';
  if (weatherId > 800) return 'Clouds';
  return 'Clear';
};

exports.getCurrentWeather = async (lat, lng) => {
  const cacheKey = getCacheKey(lat, lng);
  
  // 1. Check TTL Cache
  const cached = await WeatherCache.findOne({ locationKey: cacheKey });
  if (cached) {
    return cached;
  }

  // 2. Fetch from OpenWeatherMap
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.warn('No WEATHER_API_KEY found, using mock weather data.');
      return await WeatherCache.create({
        locationKey: cacheKey,
        temperature: 28,
        condition: 'Clear',
        rain: false,
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data;

    const weatherId = data.weather[0].id;
    const conditionTag = mapConditionToTag(weatherId);
    
    // Add 'Hot' or 'Cold' tags based on temp
    let finalCondition = conditionTag;
    if (data.main.temp > 32) finalCondition = 'Hot';
    if (data.main.temp < 15) finalCondition = 'Cold';

    const newWeather = await WeatherCache.create({
      locationKey: cacheKey,
      temperature: data.main.temp,
      condition: finalCondition,
      humidity: data.main.humidity,
      rain: weatherId >= 200 && weatherId < 600,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    });

    return newWeather;
  } catch (err) {
    console.error('Weather API failed:', err.message);
    // Fallback on failure
    return { condition: 'Clear', temperature: 25 }; 
  }
};
