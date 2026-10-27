const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/sell - List all active and past sell orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        s.sell_id,
        s.user_id,
        u.name AS seller_name,
        u.kyc_status,
        s.share_id,
        c.company_name,
        sh.share_type,
        s.quantity,
        s.price,
        s.remaining_quantity,
        ROUND(s.remaining_quantity * s.price, 2) AS remaining_value,
        s.sell_status,
        s.created_at
      FROM sell s
      JOIN users u ON s.user_id = u.user_id
      JOIN shares sh ON s.share_id = sh.share_id
      JOIN companies c ON sh.company_id = c.company_id
      ORDER BY s.created_at DESC
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
      FROM sell s
      JOIN shares sh ON s.share_id = sh.share_id
      JOIN companies c ON sh.company_id = c.company_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching user sell orders:', err);
    res.status(500).json({ error: 'Failed to fetch user sell orders' });
  }
});

// POST /api/sell - Place a new sell order
// Complies with weak entity identifying relationship: (user_id, sell_id)
router.post('/', async (req, res) => {
  try {
    const { user_id, share_id, quantity, price } = req.body;

    if (!user_id || !share_id || !quantity || !price) {
      return res.status(400).json({ error: 'user_id, share_id, quantity, and price are required' });
    }

    const numQty = Number(quantity);
    const numPrice = Number(price);
    const numShareId = Number(share_id);
    const numUserId = Number(user_id);

    if (numQty <= 0 || numPrice <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be greater than zero' });
    }

    // 1. Strict Ownership Check: Seller MUST own shares of this specific security
    const [userRows] = await db.query(
      'SELECT user_id, name, kyc_status, share_id, COALESCE(shares_owned, 0) as shares_owned FROM users WHERE user_id = ?',
      [numUserId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const seller = userRows[0];
    if (seller.kyc_status !== 'VERIFIED') {
      return res.status(403).json({ error: 'KYC Verification Required: You must be a verified investor to sell securities.' });
    }

    if (!seller.share_id || Number(seller.share_id) !== numShareId || Number(seller.shares_owned) <= 0) {
      const [shareInfo] = await db.query(
        'SELECT s.share_type, c.company_name FROM shares s JOIN companies c ON s.company_id = c.company_id WHERE s.share_id = ?',
        [numShareId]
      );
      const securityName = shareInfo.length > 0 ? `${shareInfo[0].company_name} (${shareInfo[0].share_type})` : `Security #${numShareId}`;
      return res.status(400).json({
        error: `Order Rejected: You do not hold any shares of ${securityName} in your custody portfolio. You must acquire shares via a Buy order before you can sell.`
      });
    }

    // 2. Check if active pending sell orders already commit these shares
    const [pendingRows] = await db.query(`
      SELECT COALESCE(SUM(remaining_quantity), 0) AS locked_shares 
      FROM sell 
      WHERE user_id = ? AND share_id = ? AND sell_status IN ('PENDING', 'PARTIAL')
    `, [numUserId, numShareId]);

    const lockedShares = Number(pendingRows[0].locked_shares || 0);
    const availableToSell = Math.max(0, Number(seller.shares_owned) - lockedShares);

    if (numQty > availableToSell) {
      return res.status(400).json({
        error: `Order Rejected: Insufficient available balance. You own ${seller.shares_owned} units (${lockedShares} already committed in active sell orders). Available to sell: ${availableToSell} units.`
      });
    }

    // 3. Insert order (triggers trg_validate_sell_before_insert as secondary database safeguard)
    const [result] = await db.query(`
      INSERT INTO sell (user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())
    `, [numUserId, numShareId, numQty, numPrice, numQty]);

    res.status(201).json({
      message: 'Sell order placed successfully on terminal',
      user_id,
      sell_id: result.insertId,
      status: 'PENDING',
      quantity: numQty,
      price: numPrice
    });
  } catch (err) {
    console.error('Error placing sell order:', err);
    // Handle MySQL Trigger / Check constraint errors cleanly
    const msg = err.sqlMessage || err.message || 'Failed to place sell order';
    res.status(400).json({ error: msg });
  }
});

// POST /api/sell/cancel - Cancel an open sell order
router.post('/cancel', async (req, res) => {
  try {
    const { user_id, sell_id } = req.body;

    if (!user_id || !sell_id) {
      return res.status(400).json({ error: 'user_id and sell_id are required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM sell WHERE user_id = ? AND sell_id = ?',
      [user_id, sell_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sell order not found' });
    }

    const order = rows[0];
    if (order.sell_status === 'COMPLETED' || order.sell_status === 'CANCELLED') {
      return res.status(400).json({ error: `Cannot cancel order with status ${order.sell_status}` });
    }

    await db.query(
      "UPDATE sell SET sell_status = 'CANCELLED', remaining_quantity = 0 WHERE user_id = ? AND sell_id = ?",
      [user_id, sell_id]
    );

    res.status(200).json({ message: 'Sell order cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling sell order:', err);
    res.status(500).json({ error: 'Failed to cancel sell order' });
  }
});

module.exports = router;
