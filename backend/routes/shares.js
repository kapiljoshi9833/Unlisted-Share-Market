const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/shares - List all securities with company details
router.get('/', async (req, res) => {
  try {
    const [shares] = await db.query(`
      SELECT 
        s.share_id,
        s.company_id,
        c.company_name,
        c.sector,
        c.description,
        c.company_status,
        s.share_type,
        s.total_shares,
        s.available_shares,
        s.face_value,
        s.current_price,
        ROUND(s.total_shares * s.current_price, 2) AS estimated_market_cap,
        s.created_at
      FROM shares s
      JOIN companies c ON s.company_id = c.company_id
      ORDER BY s.share_id ASC
    `);
    res.status(200).json(shares);
  } catch (err) {
    console.error('Error fetching shares:', err);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// GET /api/shares/:id - Get share by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        s.*,
        c.company_name,
        c.sector,
        c.description,
        c.company_status
      FROM shares s
      JOIN companies c ON s.company_id = c.company_id
      WHERE s.share_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Share listing not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching share:', err);
    res.status(500).json({ error: 'Failed to fetch share details' });
  }
});

// POST /api/shares - Create a new share listing
router.post('/', async (req, res) => {
  try {
    const { company_id, share_type, total_shares, available_shares, face_value, current_price } = req.body;

    if (!company_id || !total_shares || !face_value || !current_price) {
      return res.status(400).json({ error: 'company_id, total_shares, face_value, and current_price are required' });
    }

    const available = available_shares !== undefined ? available_shares : total_shares;

    const [result] = await db.query(`
      INSERT INTO shares (company_id, share_type, total_shares, available_shares, face_value, current_price, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      company_id, 
      share_type || 'Equity', 
      Number(total_shares), 
      Number(available), 
      Number(face_value), 
      Number(current_price)
    ]);

    res.status(201).json({
      message: 'Share listing created successfully',
      share_id: result.insertId,
    });
  } catch (err) {
    console.error('Error creating share:', err);
    res.status(500).json({ error: err.message || 'Failed to create share listing' });
  }
});

module.exports = router;
