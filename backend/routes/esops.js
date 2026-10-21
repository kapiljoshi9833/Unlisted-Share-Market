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
        u.email AS employee_email,
        e.company_id,
        c.company_name,
        e.number_of_options,
        e.exercise_price,
        ROUND(e.number_of_options * e.exercise_price, 2) AS total_exercise_value,
        s.current_price AS current_share_price,
        ROUND(e.number_of_options * (COALESCE(s.current_price, 0) - e.exercise_price), 2) AS unrealized_gain,
        e.vesting_period,
        e.exercise_status,
        DATE_FORMAT(e.grant_date, '%Y-%m-%d') AS grant_date,
        DATE_FORMAT(e.expiry_date, '%Y-%m-%d') AS expiry_date
      FROM esops e
      JOIN users u ON e.user_id = u.user_id
      JOIN companies c ON e.company_id = c.company_id
      LEFT JOIN shares s ON c.company_id = s.company_id
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
        ROUND(e.number_of_options * e.exercise_price, 2) AS total_exercise_value,
        s.current_price AS current_share_price,
        ROUND(e.number_of_options * (COALESCE(s.current_price, 0) - e.exercise_price), 2) AS unrealized_gain,
        e.vesting_period,
        e.exercise_status,
        DATE_FORMAT(e.grant_date, '%Y-%m-%d') AS grant_date,
        DATE_FORMAT(e.expiry_date, '%Y-%m-%d') AS expiry_date
      FROM esops e
      JOIN companies c ON e.company_id = c.company_id
      LEFT JOIN shares s ON c.company_id = s.company_id
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
      INSERT INTO esops (user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, 
      company_id, 
      Number(number_of_options), 
      Number(exercise_price), 
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
    res.status(500).json({ error: err.message || 'Failed to create ESOP record' });
  }
});

module.exports = router;
