const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/transactions - List all settled transactions
router.get('/', async (req, res) => {
  try {
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id,
        t.buy_id,
        t.sell_id,
        t.share_id,
        c.company_name,
        s.share_type,
        u_buy.name AS buyer_name,
        u_sell.name AS seller_name,
        t.quantity,
        t.price,
        (t.quantity * t.price) AS total_value,
        t.transaction_time,
        'COMPLETED' AS status
      FROM Transactions t
      JOIN Buy b ON t.buy_id = b.buy_id
      JOIN Sell sl ON t.sell_id = sl.sell_id
      JOIN Users u_buy ON b.user_id = u_buy.user_id
      JOIN Users u_sell ON sl.user_id = u_sell.user_id
      JOIN Shares s ON t.share_id = s.share_id
      JOIN Companies c ON s.company_id = c.company_id
      ORDER BY t.transaction_id DESC
    `);
    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/user/:userId - Transactions for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id,
        t.buy_id,
        t.sell_id,
        t.share_id,
        c.company_name,
        s.share_type,
        u_buy.name AS buyer_name,
        u_sell.name AS seller_name,
        t.quantity,
        t.price,
        (t.quantity * t.price) AS total_value,
        t.transaction_time
      FROM Transactions t
      JOIN Buy b ON t.buy_id = b.buy_id
      JOIN Sell sl ON t.sell_id = sl.sell_id
      JOIN Users u_buy ON b.user_id = u_buy.user_id
      JOIN Users u_sell ON sl.user_id = u_sell.user_id
      JOIN Shares s ON t.share_id = s.share_id
      JOIN Companies c ON s.company_id = c.company_id
      WHERE b.user_id = ? OR sl.user_id = ?
      ORDER BY t.transaction_id DESC
    `, [userId, userId]);

    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching user transactions:', err);
    res.status(500).json({ error: 'Failed to fetch user transactions' });
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
        u_buy.name AS buyer_name,
        u_sell.name AS seller_name
      FROM Transactions t
      JOIN Buy b ON t.buy_id = b.buy_id
      JOIN Sell sl ON t.sell_id = sl.sell_id
      JOIN Users u_buy ON b.user_id = u_buy.user_id
      JOIN Users u_sell ON sl.user_id = u_sell.user_id
      JOIN Shares s ON t.share_id = s.share_id
      JOIN Companies c ON s.company_id = c.company_id
      WHERE t.transaction_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// POST /api/match (or POST /api/transactions/match) - ORDER MATCHING ENGINE
router.post('/match', async (req, res) => {
  let connection;
  try {
    // Acquire dedicated connection from pool for atomic MySQL Transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Fetch open SELL orders (asks) - best price first
    const [openSells] = await connection.query(`
      SELECT * FROM Sell 
      WHERE sell_status IN ('PENDING', 'PARTIAL') AND remaining_quantity > 0
      ORDER BY price ASC, created_at ASC
    `);

    // 2. Fetch open BUY orders (bids) - highest bid first
    const [openBuys] = await connection.query(`
      SELECT * FROM Buy 
      WHERE buy_status IN ('PENDING', 'PARTIAL') AND remaining_quantity > 0
      ORDER BY price DESC, created_at ASC
    `);

    const createdTransactions = [];

    // 3. Match loop
    for (let sell of openSells) {
      if (sell.remaining_quantity <= 0) continue;

      for (let buy of openBuys) {
        if (buy.remaining_quantity <= 0) continue;

        // Condition: Same security and buyer bid >= seller ask
        if (buy.share_id === sell.share_id && Number(buy.price) >= Number(sell.price)) {
          const matchQuantity = Math.min(buy.remaining_quantity, sell.remaining_quantity);
          const executionPrice = sell.price; // Fill at seller's listed ask

          // Deduct quantities
          buy.remaining_quantity -= matchQuantity;
          sell.remaining_quantity -= matchQuantity;

          // Status updates
          const newBuyStatus = buy.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIAL';
          const newSellStatus = sell.remaining_quantity === 0 ? 'COMPLETED' : 'PARTIAL';

          // A. Insert into Transactions table
          const [txnResult] = await connection.query(`
            INSERT INTO Transactions (buy_id, sell_id, share_id, quantity, price, transaction_time)
            VALUES (?, ?, ?, ?, ?, NOW())
          `, [buy.buy_id, sell.sell_id, buy.share_id, matchQuantity, executionPrice]);

          // B. Update Buy order
          await connection.query(`
            UPDATE Buy 
            SET remaining_quantity = ?, buy_status = ? 
            WHERE buy_id = ?
          `, [buy.remaining_quantity, newBuyStatus, buy.buy_id]);

          // C. Update Sell order
          await connection.query(`
            UPDATE Sell 
            SET remaining_quantity = ?, sell_status = ? 
            WHERE sell_id = ?
          `, [sell.remaining_quantity, newSellStatus, sell.sell_id]);

          // D. Update Buyer user holdings
          await connection.query(`
            UPDATE Users 
            SET share_id = ?, shares_owned = shares_owned + ? 
            WHERE user_id = ?
          `, [buy.share_id, matchQuantity, buy.user_id]);

          // E. Update Seller user holdings (ensure it does not go below zero)
          await connection.query(`
            UPDATE Users 
            SET shares_owned = GREATEST(0, shares_owned - ?) 
            WHERE user_id = ?
          `, [matchQuantity, sell.user_id]);

          createdTransactions.push({
            transaction_id: txnResult.insertId,
            buy_id: buy.buy_id,
            sell_id: sell.sell_id,
            share_id: buy.share_id,
            quantity: matchQuantity,
            price: executionPrice
          });

          if (sell.remaining_quantity === 0) break;
        }
      }
    }

    // Commit atomic transaction
    await connection.commit();

    res.status(200).json({
      message: createdTransactions.length > 0 
        ? `Successfully matched and executed ${createdTransactions.length} transaction(s)`
        : 'No compatible orders found for matching at current bid/ask prices',
      matched_count: createdTransactions.length,
      transactions: createdTransactions
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Matching engine transaction rolled back:', err);
    res.status(500).json({ error: 'Order matching transaction failed and was rolled back' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;