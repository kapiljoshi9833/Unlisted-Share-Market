const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/buy - List all buy orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        b.buy_id,
        b.user_id,
        u.name AS buyer_name,
        b.share_id,
        c.company_name,
        s.share_type,
        b.quantity,
        b.price,
        b.remaining_quantity,
        b.buy_status,
        b.created_at
      FROM Buy b
      JOIN Users u ON b.user_id = u.user_id
      JOIN Shares s ON b.share_id = s.share_id
      JOIN Companies c ON s.company_id = c.company_id
      ORDER BY b.buy_id DESC
    `);
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching buy orders:', err);
    res.status(500).json({ error: 'Failed to fetch buy orders' });
  }
});

// GET /api/buy/user/:userId - List buy orders for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [orders] = await db.query(`
      SELECT 
        b.buy_id,
        b.user_id,
        b.share_id,
        c.company_name,
        s.share_type,
        b.quantity,
        b.price,
        b.remaining_quantity,
        b.buy_status,
        b.created_at
      FROM Buy b
      JOIN Shares s ON b.share_id = s.share_id
      JOIN Companies c ON s.company_id = c.company_id
      WHERE b.user_id = ?
      ORDER BY b.buy_id DESC
    `, [userId]);

    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching user buy orders:', err);
    res.status(500).json({ error: 'Failed to fetch user buy orders' });
  }
});

// POST /api/buy - Place a new buy order
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
      INSERT INTO Buy (user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())
    `, [user_id, share_id, quantity, price, quantity]);

    res.status(201).json({
      message: 'Buy order placed successfully',
      buy_id: result.insertId,
      status: 'PENDING'
    });
  } catch (err) {
    console.error('Error placing buy order:', err);
    res.status(500).json({ error: 'Failed to place buy order' });
  }
});

module.exports = router;