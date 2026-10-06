const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/esops - List all ESOP grants
router.get('/', async (req, res) => {
  try {
    const [esops] = await db.query(`
      SELECT 
        e.esop_id,
        e.user_id,
        u.name AS employee_name,
        e.company_id,
        c.company_name,
        e.number_of_options,
        e.exercise_price,
        e.vesting_period,
        e.exercise_status,
        e.grant_date,
        e.expiry_date
      FROM ESOPs e
      JOIN Users u ON e.user_id = u.user_id
      JOIN Companies c ON e.company_id = c.company_id
      ORDER BY e.esop_id ASC
    `);
    res.status(200).json(esops);
  } catch (err) {
    console.error('Error fetching ESOPs:', err);
    res.status(500).json({ error: 'Failed to fetch ESOP records' });
  }
});

// GET /api/esops/user/:userId - Fetch ESOPs for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [esops] = await db.query(`
      SELECT 
        e.esop_id,
        e.user_id,
        e.company_id,
        c.company_name,
        e.number_of_options,
        e.exercise_price,
        e.vesting_period,
        e.exercise_status,
        e.grant_date,
        e.expiry_date
      FROM ESOPs e
      JOIN Companies c ON e.company_id = c.company_id
      WHERE e.user_id = ?
      ORDER BY e.esop_id ASC
    `, [userId]);

    res.status(200).json(esops);
  } catch (err) {
    console.error('Error fetching user ESOPs:', err);
    res.status(500).json({ error: 'Failed to fetch user ESOPs' });
  }
});

// POST /api/esops - Grant new ESOP
router.post('/', async (req, res) => {
  try {
    const { 
      user_id, 
      company_id, 
      number_of_options, 
      exercise_price, 
      vesting_period, 
      exercise_status, 
      grant_date, 
      expiry_date 
    } = req.body;

    if (!user_id || !company_id || !number_of_options || !exercise_price || !grant_date || !expiry_date) {
      return res.status(400).json({ error: 'All ESOP fields are required' });
    }

    const [result] = await db.query(`
      INSERT INTO ESOPs (user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, 
      company_id, 
      number_of_options, 
      exercise_price, 
      vesting_period || '36 Months (Graded)', 
      exercise_status || 'Unvested', 
      grant_date, 
      expiry_date
    ]);

    res.status(201).json({
      message: 'ESOP granted successfully',
      esop_id: result.insertId
    });
  } catch (err) {
    console.error('Error creating ESOP:', err);
    res.status(500).json({ error: 'Failed to create ESOP record' });
  }
});

module.exports = router;