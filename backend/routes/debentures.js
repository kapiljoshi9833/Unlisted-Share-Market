const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/debentures - List all debentures
router.get('/', async (req, res) => {
  try {
    const [debentures] = await db.query(`
      SELECT 
        d.debenture_id,
        d.company_id,
        c.company_name,
        d.debenture_name,
        d.face_value,
        d.interest_rate,
        d.issue_quantity,
        d.maturity_date,
        d.issue_date,
        d.status
      FROM Debentures d
      JOIN Companies c ON d.company_id = c.company_id
      ORDER BY d.debenture_id ASC
    `);
    res.status(200).json(debentures);
  } catch (err) {
    console.error('Error fetching debentures:', err);
    res.status(500).json({ error: 'Failed to fetch debentures' });
  }
});

// GET /api/debentures/:id - Get debenture by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        d.*,
        c.company_name,
        c.sector
      FROM Debentures d
      JOIN Companies c ON d.company_id = c.company_id
      WHERE d.debenture_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Debenture not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching debenture:', err);
    res.status(500).json({ error: 'Failed to fetch debenture details' });
  }
});

// POST /api/debentures - Issue new debenture
router.post('/', async (req, res) => {
  try {
    const { 
      company_id, 
      debenture_name, 
      face_value, 
      interest_rate, 
      issue_quantity, 
      maturity_date, 
      issue_date, 
      status 
    } = req.body;

    if (!company_id || !debenture_name || !face_value || !interest_rate || !issue_quantity || !maturity_date || !issue_date) {
      return res.status(400).json({ error: 'All debenture fields are required' });
    }

    const [result] = await db.query(`
      INSERT INTO Debentures (company_id, debenture_name, face_value, interest_rate, issue_quantity, maturity_date, issue_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company_id, 
      debenture_name, 
      face_value, 
      interest_rate, 
      issue_quantity, 
      maturity_date, 
      issue_date, 
      status || 'Active'
    ]);

    res.status(201).json({
      message: 'Debenture created successfully',
      debenture_id: result.insertId
    });
  } catch (err) {
    console.error('Error creating debenture:', err);
    res.status(500).json({ error: 'Failed to create debenture record' });
  }
});

module.exports = router;