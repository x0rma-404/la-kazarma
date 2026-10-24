const session = require('express-session');

// Simple in-memory store for development
// In production you'd use connect-redis or similar
const MemoryStore = session.MemoryStore || require('memorystore')(session);

const store = new MemoryStore({
  checkPeriod: 86400000,
});

module.exports = store;
