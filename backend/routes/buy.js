const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/buy - List all active and past buy orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        b.buy_id,
        b.user_id,
        u.name AS buyer_name,
        u.kyc_status,
        b.share_id,
        c.company_name,
        s.share_type,
        b.quantity,
        b.price,
        b.remaining_quantity,
        ROUND(b.remaining_quantity * b.price, 2) AS remaining_value,
        b.buy_status,
        b.created_at
      FROM buy b
      JOIN users u ON b.user_id = u.user_id
      JOIN shares s ON b.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      ORDER BY b.created_at DESC
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
      FROM buy b
      JOIN shares s ON b.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);

    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching user buy orders:', err);
    res.status(500).json({ error: 'Failed to fetch user buy orders' });
  }
});

// POST /api/buy - Place a new buy order
// Complies with weak entity identifying relationship: (user_id, buy_id)
router.post('/', async (req, res) => {
  try {
    const { user_id, share_id, quantity, price } = req.body;

    if (!user_id || !share_id || !quantity || !price) {
      return res.status(400).json({ error: 'user_id, share_id, quantity, and price are required' });
    }

    const numQty = Number(quantity);
    const numPrice = Number(price);

    if (numQty <= 0 || numPrice <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than zero' });
    }

    // Insert order (MySQL trigger trg_validate_buy_before_insert verifies KYC and company status)
    const [result] = await db.query(`
      INSERT INTO buy (user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())
    `, [user_id, share_id, numQty, numPrice, numQty]);

    res.status(201).json({
      message: 'Buy order placed successfully on terminal',
      user_id,
      buy_id: result.insertId,
      status: 'PENDING',
      quantity: numQty,
      price: numPrice
    });
  } catch (err) {
    console.error('Error placing buy order:', err);
    // Handle MySQL Trigger / Check constraint errors cleanly
    const msg = err.sqlMessage || err.message || 'Failed to place buy order';
    res.status(400).json({ error: msg });
  }
});

// POST /api/buy/cancel - Cancel an open buy order
router.post('/cancel', async (req, res) => {
  try {
    const { user_id, buy_id } = req.body;

    if (!user_id || !buy_id) {
      return res.status(400).json({ error: 'user_id and buy_id are required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM buy WHERE user_id = ? AND buy_id = ?',
      [user_id, buy_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Buy order not found' });
    }

    const order = rows[0];
    if (order.buy_status === 'COMPLETED' || order.buy_status === 'CANCELLED') {
      return res.status(400).json({ error: `Cannot cancel order with status ${order.buy_status}` });
    }

    await db.query(
      "UPDATE buy SET buy_status = 'CANCELLED', remaining_quantity = 0 WHERE user_id = ? AND buy_id = ?",
      [user_id, buy_id]
    );

    res.status(200).json({ message: 'Buy order cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling buy order:', err);
    res.status(500).json({ error: 'Failed to cancel buy order' });
  }
});

module.exports = router;
