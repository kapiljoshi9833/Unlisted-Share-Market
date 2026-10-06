const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/shares - List all shares with company details
router.get('/', async (req, res) => {
  try {
    const [shares] = await db.query(`
      SELECT 
        s.share_id,
        s.company_id,
        c.company_name,
        c.sector,
        s.share_type,
        s.total_shares,
        s.available_shares,
        s.face_value,
        s.current_price
      FROM Shares s
      JOIN Companies c ON s.company_id = c.company_id
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
        c.description
      FROM Shares s
      JOIN Companies c ON s.company_id = c.company_id
      WHERE s.share_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Share not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching share:', err);
    res.status(500).json({ error: 'Failed to fetch share details' });
  }
});

// GET /api/shares/company/:id - Get shares issued by a specific company
router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM Shares WHERE company_id = ?',
      [id]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching company shares:', err);
    res.status(500).json({ error: 'Failed to fetch company shares' });
  }
});

// POST /api/shares - Create a new share listing
router.post('/', async (req, res) => {
  try {
    const { company_id, share_type, total_shares, available_shares, face_value, current_price } = req.body;

    if (!company_id || !total_shares || !available_shares || !face_value || !current_price) {
      return res.status(400).json({ error: 'All share fields are required' });
    }

    const [result] = await db.query(`
      INSERT INTO Shares (company_id, share_type, total_shares, available_shares, face_value, current_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [company_id, share_type || 'Equity Share', total_shares, available_shares, face_value, current_price]);

    res.status(201).json({
      message: 'Share listing created successfully',
      share_id: result.insertId,
    });
  } catch (err) {
    console.error('Error creating share:', err);
    res.status(500).json({ error: 'Failed to create share listing' });
  }
});

module.exports = router;