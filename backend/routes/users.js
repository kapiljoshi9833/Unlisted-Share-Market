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

// GET /api/users/profile-card/:id - Comprehensive participant dossier (holdings, open orders, trade history)
router.get('/profile-card/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch user core record
    const [userRows] = await db.query(`
      SELECT 
        user_id,
        name,
        email,
        role,
        kyc_status,
        created_at
      FROM users
      WHERE user_id = ?
    `, [id]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // 2. Fetch custody holdings
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

    // 3. Fetch active buy orders
    const [buyOrders] = await db.query(`
      SELECT 
        b.buy_id,
        b.share_id,
        c.company_name,
        s.share_type,
        b.quantity,
        b.remaining_quantity,
        b.price,
        ROUND(b.remaining_quantity * b.price, 2) AS commitment_value,
        b.buy_status,
        b.created_at
      FROM buy b
      JOIN shares s ON b.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE b.user_id = ? AND b.buy_status IN ('PENDING', 'PARTIAL')
      ORDER BY b.created_at DESC
    `, [id]);

    // 4. Fetch active sell orders
    const [sellOrders] = await db.query(`
      SELECT 
        sl.sell_id,
        sl.share_id,
        c.company_name,
        s.share_type,
        sl.quantity,
        sl.remaining_quantity,
        sl.price,
        ROUND(sl.remaining_quantity * sl.price, 2) AS offering_value,
        sl.sell_status,
        sl.created_at
      FROM sell sl
      JOIN shares s ON sl.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE sl.user_id = ? AND sl.sell_status IN ('PENDING', 'PARTIAL')
      ORDER BY sl.created_at DESC
    `, [id]);

    // 5. Fetch settled transaction ledger for this participant
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id,
        c.company_name,
        s.share_type,
        t.quantity,
        t.price,
        ROUND(t.quantity * t.price, 2) AS trade_value,
        t.transaction_time,
        CASE 
          WHEN t.buyer_id = ? THEN 'BUYER' 
          ELSE 'SELLER' 
        END AS participant_role,
        CASE 
          WHEN t.buyer_id = ? THEN us.name 
          ELSE ub.name 
        END AS counterparty_name
      FROM transactions t
      JOIN shares s ON t.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      JOIN users ub ON t.buyer_id = ub.user_id
      JOIN users us ON t.seller_id = us.user_id
      WHERE t.buyer_id = ? OR t.seller_id = ?
      ORDER BY t.transaction_time DESC, t.transaction_id DESC
    `, [id, id, id, id]);

    // Compute portfolio summary metrics
    const portfolioValue = holdings.reduce((sum, h) => sum + Number(h.total_value || 0), 0);
    const totalTradedVolume = transactions.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
    const totalTurnover = transactions.reduce((sum, t) => sum + Number(t.trade_value || 0), 0);

    res.status(200).json({
      user,
      holdings,
      open_buy_orders: buyOrders,
      open_sell_orders: sellOrders,
      transactions,
      summary: {
        total_portfolio_value: portfolioValue,
        open_bids_count: buyOrders.length,
        open_asks_count: sellOrders.length,
        settled_trades_count: transactions.length,
        total_traded_volume: totalTradedVolume,
        total_turnover: totalTurnover
      }
    });
  } catch (err) {
    console.error('Error fetching participant dossier card:', err);
    res.status(500).json({ error: 'Failed to fetch participant dossier' });
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
