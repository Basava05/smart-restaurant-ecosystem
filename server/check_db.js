const mongoose = require('mongoose');
const uri = 'mongodb+srv://basavabasava5585_db_user:RYxdxayMuEu_49!@cluster0.uovjy2x.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0';

async function checkDB() {
  await mongoose.connect(uri);
  console.log('Connected to DB');
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  const User = mongoose.connection.db.collection('users');
  const users = await User.find({}).toArray();
  console.log('Users count:', users.length);
  if (users.length > 0) {
    console.log('Sample user:', users[0].email);
  }
  
  process.exit(0);
}
checkDB().catch(console.error);
