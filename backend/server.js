const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

// Import Route Handlers
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const shareRoutes = require('./routes/shares');
const buyRoutes = require('./routes/buy');
const sellRoutes = require('./routes/sell');
const transactionRoutes = require('./routes/transactions');
const esopRoutes = require('./routes/esops');
const debentureRoutes = require('./routes/debentures');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Root Test Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Unlisted Securities Exchange API is running',
    version: '1.0.0',
    database: process.env.DB_NAME || 'unlisted_securities_exchange',
    status: 'ONLINE'
  });
});

// Register API Routes
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/buy', buyRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/esops', esopRoutes);
app.use('/api/debentures', debentureRoutes);

// Direct Aliases for Prompt Specifications
// 1. POST /api/match -> calls the matching engine in transactions.js
app.post('/api/match', (req, res, next) => {
  req.url = '/match';
  transactionRoutes(req, res, next);
});

// 2. POST /api/login -> forwards to /api/users/login
app.post('/api/login', (req, res, next) => {
  req.url = '/login';
  userRoutes(req, res, next);
});

// Test DB Connection and Start Server
async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME}" on port ${process.env.DB_PORT || 3307}`);
    connection.release();

    app.listen(PORT, () => {
      console.log(`[SERVER] Unlisted Securities Exchange API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[DB ERROR] Failed to connect to MySQL database:', error.message);
    console.error('Please verify your credentials in backend/.env');
  }
}

startServer();