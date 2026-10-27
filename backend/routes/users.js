const express = require('express');
const router = express.Router();
const db = require('../db');
const authRouter = require('./auth');

// Mount login and signup directly under /api/users for backward compatibility
router.post('/login', (req, res, next) => {
  req.url = '/login';
  authRouter(req, res, next);
});

router.post('/signup', (req, res, next) => {
  req.url = '/signup';
  authRouter(req, res, next);
});

// GET /api/users - List all exchange users
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.kyc_status,
        u.share_id,
        u.shares_owned,
        u.created_at,
        s.share_type,
        s.current_price,
        c.company_name
      FROM users u
      LEFT JOIN shares s ON u.share_id = s.share_id
      LEFT JOIN companies c ON s.company_id = c.company_id
      ORDER BY u.user_id ASC
    `);
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch user directory' });
  }
});

// GET /api/users/:id - Get specific user profile and holdings
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.kyc_status,
        u.share_id,
        u.shares_owned,
        u.created_at,
        s.share_type,
        s.current_price,
        c.company_name,
        ROUND(u.shares_owned * COALESCE(s.current_price, 0), 2) AS estimated_portfolio_value
      FROM users u
      LEFT JOIN shares s ON u.share_id = s.share_id
      LEFT JOIN companies c ON s.company_id = c.company_id
      WHERE u.user_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach structured holdings array for portfolio views
    const [holdings] = await db.query(`
      SELECT 
        s.share_id,
        s.share_type,
        s.current_price,
        c.company_id,
        c.company_name,
        c.sector,
        u.shares_owned,
        ROUND(u.shares_owned * s.current_price, 2) AS total_value
      FROM users u
      JOIN shares s ON u.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE u.user_id = ? AND u.shares_owned > 0
    `, [id]);

    const userProfile = {
      ...rows[0],
      holdings: holdings
    };

    res.status(200).json(userProfile);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/users/portfolio/:id - Detailed custody portfolio
router.get('/portfolio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [holdings] = await db.query(`
      SELECT 
        s.share_id,
        s.share_type,
        s.current_price,
        c.company_id,
        c.company_name,
        c.sector,
        u.shares_owned,
        ROUND(u.shares_owned * s.current_price, 2) AS total_value
      FROM users u
      JOIN shares s ON u.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE u.user_id = ? AND u.shares_owned > 0
    `, [id]);

    res.status(200).json(holdings);
  } catch (err) {
    console.error('Error fetching user portfolio:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// POST /api/users - Fallback user registration endpoint
router.post('/', (req, res, next) => {
  req.url = '/signup';
  authRouter(req, res, next);
});

module.exports = router;
