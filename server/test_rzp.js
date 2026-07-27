require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

async function run() {
  try {
    const options = {
      amount: 322000,
      currency: 'INR',
      receipt: `receipt_order_test123`,
    };
    console.log("Creating with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("Success:", order);
  } catch (err) {
    console.error("Error:", JSON.stringify(err, null, 2));
  }
}
run();
