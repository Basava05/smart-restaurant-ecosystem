const mongoose = require('mongoose');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const AnalyticsRollup = require('./models/AnalyticsRollup');

require('dotenv').config();

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Delete all orders
    const orderRes = await Order.deleteMany({});
    console.log('Deleted Orders:', orderRes.deletedCount);

    // Delete all payments
    const paymentRes = await Payment.deleteMany({});
    console.log('Deleted Payments:', paymentRes.deletedCount);

    // Delete all notifications
    const notifRes = await Notification.deleteMany({});
    console.log('Deleted Notifications:', notifRes.deletedCount);

    // Delete analytics
    const analyticsRes = await AnalyticsRollup.deleteMany({});
    console.log('Deleted Analytics:', analyticsRes.deletedCount);

    console.log('Successfully cleared all order-related data!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearData();
