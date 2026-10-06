const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/sell - List all sell orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        s.sell_id,
        s.user_id,
        u.name AS seller_name,
        s.share_id,
        c.company_name,
        sh.share_type,
        s.quantity,
        s.price,
        s.remaining_quantity,
        s.sell_status,
        s.created_at
      FROM Sell s
      JOIN Users u ON s.user_id = u.user_id
      JOIN Shares sh ON s.share_id = sh.share_id
      JOIN Companies c ON sh.company_id = c.company_id
      ORDER BY s.sell_id DESC
    `);
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching sell orders:', err);
    res.status(500).json({ error: 'Failed to fetch sell orders' });
  }
});

// GET /api/sell/user/:userId - List sell orders for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [orders] = await db.query(`
      SELECT 
        s.sell_id,
        s.user_id,
        s.share_id,
        c.company_name,
        sh.share_type,
        s.quantity,
        s.price,
        s.remaining_quantity,
        s.sell_status,
        s.created_at
      FROM Sell s
      JOIN Shares sh ON s.share_id = sh.share_id
      JOIN Companies c ON sh.company_id = c.company_id
      WHERE s.user_id = ?
      ORDER BY s.sell_id DESC
    `, [userId]);

    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching user sell orders:', err);
    res.status(500).json({ error: 'Failed to fetch user sell orders' });
  }
});

// POST /api/sell - Place a new sell order
router.post('/', async (req, res) => {
  try {
    const { user_id, share_id, quantity, price } = req.body;

    if (!user_id || !share_id || !quantity || !price) {
      return res.status(400).json({ error: 'user_id, share_id, quantity, and price are required' });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than zero' });
    }

    const [result] = await db.query(`
      INSERT INTO Sell (user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())
    `, [user_id, share_id, quantity, price, quantity]);

    res.status(201).json({
      message: 'Sell order placed successfully',
      sell_id: result.insertId,
      status: 'PENDING'
    });
  } catch (err) {
    console.error('Error placing sell order:', err);
    res.status(500).json({ error: 'Failed to place sell order' });
  }
});

module.exports = router;