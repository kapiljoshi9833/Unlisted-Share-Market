const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/transactions - List all settled transactions
router.get('/', async (req, res) => {
  try {
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id,
        t.buyer_id,
        t.buy_id,
        ub.name AS buyer_name,
        t.seller_id,
        t.sell_id,
        us.name AS seller_name,
        t.share_id,
        c.company_name,
        s.share_type,
        t.quantity,
        t.price,
        ROUND(t.quantity * t.price, 2) AS total_value,
        t.transaction_time,
        'COMPLETED' AS status
      FROM transactions t
      JOIN buy b ON (t.buyer_id = b.user_id AND t.buy_id = b.buy_id)
      JOIN sell sl ON (t.seller_id = sl.user_id AND t.sell_id = sl.sell_id)
      JOIN users ub ON t.buyer_id = ub.user_id
      JOIN users us ON t.seller_id = us.user_id
      JOIN shares s ON t.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      ORDER BY t.transaction_time DESC, t.transaction_id DESC
    `);
    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transaction records' });
  }
});

// GET /api/transactions/user/:userId - Transactions for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id,
        t.buyer_id,
        t.buy_id,
        ub.name AS buyer_name,
        t.seller_id,
        t.sell_id,
        us.name AS seller_name,
        t.share_id,
        c.company_name,
        s.share_type,
        t.quantity,
        t.price,
        ROUND(t.quantity * t.price, 2) AS total_value,
        t.transaction_time,
        CASE WHEN t.buyer_id = ? THEN 'BOUGHT' ELSE 'SOLD' END AS user_action
      FROM transactions t
      JOIN users ub ON t.buyer_id = ub.user_id
      JOIN users us ON t.seller_id = us.user_id
      JOIN shares s ON t.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE t.buyer_id = ? OR t.seller_id = ?
      ORDER BY t.transaction_time DESC, t.transaction_id DESC
    `, [userId, userId, userId]);

    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching user transactions:', err);
    res.status(500).json({ error: 'Failed to fetch user transaction history' });
  }
});

// GET /api/transactions/:id - Single transaction details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        t.*,
        c.company_name,
        s.share_type,
        ub.name AS buyer_name,
        us.name AS seller_name,
        ROUND(t.quantity * t.price, 2) AS total_value
      FROM transactions t
      JOIN users ub ON t.buyer_id = ub.user_id
      JOIN users us ON t.seller_id = us.user_id
      JOIN shares s ON t.share_id = s.share_id
      JOIN companies c ON s.company_id = c.company_id
      WHERE t.transaction_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching transaction details:', err);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// POST /api/match (or POST /api/transactions/match) - ORDER MATCHING ENGINE
// Academic Highlight: Implements atomic ACID matching, row-level locking,
// partial fills, price-time priority, and foreign key weak entity linkage.
router.post('/match', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Fetch active SELL orders (asks) - lowest price first (Price-Time priority)
    const [openSells] = await connection.query(`
      SELECT * FROM sell 
      WHERE sell_status IN ('PENDING', 'PARTIAL') AND remaining_quantity > 0
      ORDER BY price ASC, created_at ASC
      FOR UPDATE
    `);

    // 2. Fetch active BUY orders (bids) - highest price first (Price-Time priority)
    const [openBuys] = await connection.query(`
      SELECT * FROM buy 
      WHERE buy_status IN ('PENDING', 'PARTIAL') AND remaining_quantity > 0
      ORDER BY price DESC, created_at ASC
      FOR UPDATE
    `);

    const createdTransactions = [];

    // 3. Match loop
    for (let sell of openSells) {
      if (sell.remaining_quantity <= 0) continue;

      for (let buy of openBuys) {
        if (buy.remaining_quantity <= 0) continue;

        // Matching conditions:
        // a) Same security class
        // b) Buyer bid >= Seller ask
        // c) Different participants (cannot trade with oneself)
        if (
          buy.share_id === sell.share_id &&
          Number(buy.price) >= Number(sell.price) &&
          buy.user_id !== sell.user_id
        ) {
          const matchQuantity = Math.min(buy.remaining_quantity, sell.remaining_quantity);
          const executionPrice = Number(sell.price); // Execution at seller's listed ask

          // Deduct quantities
          buy.remaining_quantity -= matchQuantity;
          sell.remaining_quantity -= matchQuantity;

          // Determine updated statuses
          const newBuyStatus = buy.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIAL';
          const newSellStatus = sell.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIAL';

          // A. Insert into transactions table with weak entity foreign keys (buyer_id, buy_id) and (seller_id, sell_id)
          const [txnResult] = await connection.query(`
            INSERT INTO transactions (buyer_id, buy_id, seller_id, sell_id, share_id, quantity, price, transaction_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `, [buy.user_id, buy.buy_id, sell.user_id, sell.sell_id, buy.share_id, matchQuantity, executionPrice]);

          // B. Update Buy order (weak entity identified by user_id and buy_id)
          await connection.query(`
            UPDATE buy 
            SET remaining_quantity = ?, buy_status = ? 
            WHERE user_id = ? AND buy_id = ?
          `, [buy.remaining_quantity, newBuyStatus, buy.user_id, buy.buy_id]);

          // C. Update Sell order (weak entity identified by user_id and sell_id)
          await connection.query(`
            UPDATE sell 
            SET remaining_quantity = ?, sell_status = ? 
            WHERE user_id = ? AND sell_id = ?
          `, [sell.remaining_quantity, newSellStatus, sell.user_id, sell.sell_id]);

          // D. Update Buyer portfolio holdings in users table
          await connection.query(`
            UPDATE users 
            SET share_id = ?, shares_owned = COALESCE(shares_owned, 0) + ? 
            WHERE user_id = ?
          `, [buy.share_id, matchQuantity, buy.user_id]);

          // E. Update Seller portfolio holdings (safely floor at zero, reset share_id if 0)
          await connection.query(`
            UPDATE users 
            SET shares_owned = GREATEST(0, COALESCE(shares_owned, 0) - ?),
                share_id = CASE WHEN GREATEST(0, COALESCE(shares_owned, 0) - ?) = 0 THEN NULL ELSE share_id END
            WHERE user_id = ?
          `, [matchQuantity, matchQuantity, sell.user_id]);

          createdTransactions.push({
            transaction_id: txnResult.insertId,
            buyer_id: buy.user_id,
            buy_id: buy.buy_id,
            seller_id: sell.user_id,
            sell_id: sell.sell_id,
            share_id: buy.share_id,
            quantity: matchQuantity,
            price: executionPrice,
            total_value: Number((matchQuantity * executionPrice).toFixed(2))
          });

          // If this sell order has been fully filled, advance to next sell order
          if (sell.remaining_quantity === 0) break;
        }
      }
    }

    // Commit atomic transaction
    await connection.commit();

    res.status(200).json({
      message: createdTransactions.length > 0
        ? `Successfully executed and settled ${createdTransactions.length} transaction(s)`
        : 'No crossing orders found at current bid/ask spreads',
      matched_count: createdTransactions.length,
      transactions: createdTransactions
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Order matching failed and was rolled back:', err);
    res.status(500).json({ error: 'Order matching engine transaction failed: ' + (err.message || 'unknown error') });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
