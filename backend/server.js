const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

// Import Route Handlers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const shareRoutes = require('./routes/shares');
const buyRoutes = require('./routes/buy');
const sellRoutes = require('./routes/sell');
const transactionRoutes = require('./routes/transactions');
const esopRoutes = require('./routes/esops');
const debentureRoutes = require('./routes/debentures');
const statRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Health & Diagnostics Endpoint
app.get('/', async (req, res) => {
  try {
    const [dbCheck] = await db.query('SELECT 1 as connected');
    res.status(200).json({
      project: 'VALENCE-X — Private Securities Terminal',
      academic_title: 'Unlisted Securities Exchange',
      version: '2.0.0',
      database: process.env.DB_NAME || 'unlisted_securities_exchange',
      status: 'ONLINE',
      db_status: dbCheck.length > 0 ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      project: 'VALENCE-X',
      status: 'DEGRADED',
      db_error: err.message
    });
  }
});

// Register Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/buy', buyRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/esops', esopRoutes);
app.use('/api/debentures', debentureRoutes);
app.use('/api/stats', statRoutes);

// Direct Aliases for Frontends & Assignment Compatibility
// 1. POST /api/match -> calls the transaction matching engine
app.post('/api/match', (req, res, next) => {
  req.url = '/match';
  transactionRoutes(req, res, next);
});

// 2. POST /api/login -> maps to auth/login
app.post('/api/login', (req, res, next) => {
  req.url = '/login';
  authRoutes(req, res, next);
});

// 3. POST /api/signup -> maps to auth/signup
app.post('/api/signup', (req, res, next) => {
  req.url = '/signup';
  authRoutes(req, res, next);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server & Test Database Connection
async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME || 'unlisted_securities_exchange'}" on port ${process.env.DB_PORT || 3307}`);
    connection.release();

    app.listen(PORT, () => {
      console.log(`[SERVER] VALENCE-X API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[DB ERROR] Failed to connect to MySQL database:', error.message);
    console.error('Please verify your credentials in backend/.env');
  }
}

startServer();

module.exports = app;
