require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const BANGALORE_RESTAURANTS = require('./seedData');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing old data...');
    await User.deleteMany();
    await Restaurant.deleteMany();
    await MenuItem.deleteMany();

    console.log('Seeding new data...');
    
    // Create one global admin
    await User.create({
      name: 'System Admin',
      email: 'admin@sre.test',
      passwordHash: 'password123',
      role: 'admin',
    });

    // Create one global customer
    await User.create({
      name: 'Test Customer',
      email: 'customer@sre.test',
      passwordHash: 'password123',
      role: 'customer',
    });

    console.log('Created Admin and Customer.');
    console.log(`Seeding ${BANGALORE_RESTAURANTS.length} restaurants...`);

    const credentialsList = [];

    for (let i = 0; i < BANGALORE_RESTAURANTS.length; i++) {
      const restData = BANGALORE_RESTAURANTS[i];
      // Create a unique email prefix like 'owner_mtr', 'chef_mtr'
      const prefix = restData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) + i;

      // 1. Create Owner
      const owner = await User.create({
        name: `${restData.name} Owner`,
        email: `owner_${prefix}@sre.test`,
        passwordHash: 'password123',
        role: 'owner',
      });

      // 2. Create Restaurant
      const restaurant = await Restaurant.create({
        _id: restData._id,
        name: restData.name,
        ownerId: owner._id,
        address: restData.address,
        location: restData.location,
        cuisine: restData.cuisine,
        avgPrepTime: restData.avgPrepTime,
        rating: restData.rating,
        openingTime: restData.openingTime,
        closingTime: restData.closingTime,
        logo: restData.image, // mapping image to logo
        status: 'approved',
      });

      // 3. Create Chef
      const chef = await User.create({
        name: `${restData.name} Chef`,
        email: `chef_${prefix}@sre.test`,
        passwordHash: 'password123',
        role: 'chef',
        restaurantId: restaurant._id,
      });

      // 4. Create Menu Items
      const menuItemsToInsert = restData.menu.map(item => ({
        _id: item._id,
        restaurantId: restaurant._id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        prepTime: item.prepTime,
        image: item.image,
        popularityScore: Math.floor(Math.random() * 20) + 80, // 80-100
      }));

      await MenuItem.insertMany(menuItemsToInsert);

      credentialsList.push({
        restaurant: restData.name,
        owner: `owner_${prefix}@sre.test`,
        chef: `chef_${prefix}@sre.test`
      });
    }

    console.log('\n✅ Seeding complete! All passwords are: password123');
    console.log('----------------------------------------------------');
    console.log(`- Admin Login: admin@sre.test`);
    console.log(`- Customer Login: customer@sre.test`);
    console.log('----------------------------------------------------');
    
    console.log('\n--- Restaurant Credentials ---');
    credentialsList.forEach(cred => {
      console.log(`\nRestaurant: ${cred.restaurant}`);
      console.log(`Owner: ${cred.owner}`);
      console.log(`Chef:  ${cred.chef}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
