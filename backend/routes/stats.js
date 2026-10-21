const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/stats/overview - Exchange high-level aggregate numbers
router.get('/overview', async (req, res) => {
  try {
    const [companiesCount] = await db.query('SELECT COUNT(*) as c FROM companies');
    const [sharesCount] = await db.query('SELECT COUNT(*) as c FROM shares');
    const [usersCount] = await db.query('SELECT COUNT(*) as c FROM users');
    const [txnCount] = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(quantity * price), 0) as turnover FROM transactions');
    const [openBuys] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(remaining_quantity), 0) as qty FROM buy WHERE buy_status IN ('PENDING', 'PARTIAL')");
    const [openSells] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(remaining_quantity), 0) as qty FROM sell WHERE sell_status IN ('PENDING', 'PARTIAL')");

    res.status(200).json({
      companies: companiesCount[0].c,
      securities: sharesCount[0].c,
      users: usersCount[0].c,
      settled_trades: txnCount[0].count,
      total_turnover: Number(txnCount[0].turnover),
      open_buy_orders: openBuys[0].count,
      open_sell_orders: openSells[0].count
    });
  } catch (err) {
    console.error('Error fetching exchange overview:', err);
    res.status(500).json({ error: 'Failed to fetch exchange overview stats' });
  }
});

// GET /api/stats/views/:viewName - Fetch data directly from Phase III SQL Views
router.get('/views/:viewName', async (req, res) => {
  try {
    const allowedViews = [
      'vw_company_securities',
      'vw_open_buy_orders',
      'vw_open_sell_orders',
      'vw_transaction_history',
      'vw_company_trading_summary',
      'vw_esop_information',
      'vw_debenture_information'
    ];

    const { viewName } = req.params;
    if (!allowedViews.includes(viewName)) {
      return res.status(400).json({ error: 'Invalid view requested' });
    }

    const [rows] = await db.query(`SELECT * FROM ${viewName}`);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error querying view:', err);
    res.status(500).json({ error: 'Failed to query database view' });
  }
});

module.exports = router;
