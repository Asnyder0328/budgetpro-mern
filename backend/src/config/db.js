const mongoose = require('mongoose');

let memServer = null;

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      return { mode: 'mongo' };
    } catch (e) {
      console.warn(`⚠️  MONGO_URI failed (${e.message}) — falling back to in-memory MongoDB`);
    }
  }
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memServer = await MongoMemoryServer.create();
  await mongoose.connect(memServer.getUri());
  console.log('✅ In-memory MongoDB connected (dev fallback)');
  return { mode: 'memory', uri: memServer.getUri() };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memServer) await memServer.stop();
}

module.exports = { connectDB, disconnectDB };
