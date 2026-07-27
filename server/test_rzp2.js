const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: "rzp_test_T2UGuHHu5rmj1k".trim(),
  key_secret: "8272Nb5mulMIRbs5lnhjRvZZ".trim(),
});

async function run() {
  try {
    const options = {
      amount: 322000,
      currency: 'INR',
    };
    console.log("Creating with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("Success:", order);
  } catch (err) {
    console.error("Error:", JSON.stringify(err, null, 2));
  }
}
run();
