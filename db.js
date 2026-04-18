// ============================================================
//  TASKR — Task Manager  |  db.js
//  MongoDB connection using Mongoose
// ============================================================

const mongoose = require('mongoose');

// MongoDB connection URI — set in .env or replace with your connection string
// Format: mongodb://username:password@host:port/database
//   Local:  mongodb://localhost:27017/taskr
//   Atlas:  mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskr
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskr';

// Mongoose connection options
const OPTIONS = {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
};

// ── CONNECT ───────────────────────────────────────────────────
async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI, OPTIONS);
    console.log(`  ✅ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`  ❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // Exit process on failure
  }
}

// ── DISCONNECT (for testing / graceful shutdown) ──────────────
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('  🔌 MongoDB disconnected');
  } catch (err) {
    console.error(`  ❌ MongoDB disconnect error: ${err.message}`);
  }
}

// ── CONNECTION EVENT LISTENERS ────────────────────────────────
mongoose.connection.on('connected',    () => console.log('  📦 Mongoose connected'));
mongoose.connection.on('disconnected', () => console.log('  📦 Mongoose disconnected'));
mongoose.connection.on('error',  err  => console.error('  📦 Mongoose error:', err.message));

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };
