const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.error('🔧 Troubleshooting tips:');
    console.error('1. Check MONGO_URI environment variable');
    console.error('2. Verify IP whitelist in MongoDB Atlas');
    console.error('3. Ensure username/password are correct');
    console.error('4. Check network connectivity');
    
    // Don't exit in production, allow for retry
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Production mode: Will retry connection...');
      return;
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
