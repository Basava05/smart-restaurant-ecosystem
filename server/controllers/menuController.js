const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const weatherService = require('../services/weatherService');

exports.getMenuItems = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    
    // Fetch Restaurant and Items
    const [restaurant, items] = await Promise.all([
      Restaurant.findById(restaurantId),
      MenuItem.find({ restaurantId })
    ]);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Phase 8: Fetch Weather and compute recommendations
    let currentWeather = null;
    if (restaurant.location && restaurant.location.lat) {
      currentWeather = await weatherService.getCurrentWeather(restaurant.location.lat, restaurant.location.lng);
    }

    const processedItems = items.map(item => {
      let score = item.popularityScore || 0;
      let isGoodPick = false;

      // Boost score if item's weatherTags match the current weather
      if (currentWeather && item.weatherTags && item.weatherTags.length > 0) {
        if (item.weatherTags.includes(currentWeather.condition)) {
          score += 50; // significant boost for matching weather
          isGoodPick = true;
        }
      }

      return {
        ...item.toObject(),
        weatherScore: score,
        isGoodPick,
      };
    });

    // Sort by weatherScore (descending), then category
    processedItems.sort((a, b) => {
      if (b.weatherScore !== a.weatherScore) {
        return b.weatherScore - a.weatherScore;
      }
      return a.category.localeCompare(b.category);
    });

    res.json({ 
      success: true, 
      data: processedItems,
      meta: { weather: currentWeather }
    });
  } catch (err) {
    next(err);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    // Owner check
    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this menu.' });
    }

    const { name, description, category, price, prepTime, available, weatherTags } = req.body;
    
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
    }

    // Handle weatherTags parsing since multipart/form-data sends strings
    let parsedWeatherTags = [];
    if (weatherTags) {
      try {
        parsedWeatherTags = JSON.parse(weatherTags);
      } catch (e) {
        if (typeof weatherTags === 'string') {
          parsedWeatherTags = weatherTags.split(',').map(tag => tag.trim());
        }
      }
    }

    const item = await MenuItem.create({
      restaurantId,
      name,
      description,
      category,
      price: Number(price),
      prepTime: Number(prepTime),
      available: available === 'true' || available === true,
      weatherTags: parsedWeatherTags,
      image: imageUrl,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await MenuItem.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    const restaurant = await Restaurant.findById(item.restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this menu item.' });
    }

    const { name, description, category, price, prepTime, available, weatherTags } = req.body;

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (category) item.category = category;
    if (price !== undefined) item.price = Number(price);
    if (prepTime !== undefined) item.prepTime = Number(prepTime);
    if (available !== undefined) item.available = available === 'true' || available === true;
    
    if (weatherTags) {
      try {
        item.weatherTags = JSON.parse(weatherTags);
      } catch (e) {
        if (typeof weatherTags === 'string') {
          item.weatherTags = weatherTags.split(',').map(tag => tag.trim());
        }
      }
    }

    if (req.file) {
      item.image = req.file.path;
    }

    await item.save();

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await MenuItem.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    const restaurant = await Restaurant.findById(item.restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this menu item.' });
    }

    await MenuItem.deleteOne({ _id: itemId });

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
