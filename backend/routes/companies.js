const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/companies - Get all companies with their share and debenture summary
router.get('/', async (req, res) => {
  try {
    const [companies] = await db.query(`
      SELECT 
        c.company_id,
        c.company_name,
        c.sector,
        c.description,
        c.company_status,
        c.founded_year,
        c.created_at,
        s.share_id,
        s.share_type,
        s.total_shares,
        s.available_shares,
        s.face_value,
        s.current_price
      FROM companies c
      LEFT JOIN shares s ON c.company_id = s.company_id
      ORDER BY c.company_id ASC
    `);
    res.status(200).json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:id - Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        c.*,
        s.share_id,
        s.share_type,
        s.total_shares,
        s.available_shares,
        s.face_value,
        s.current_price
      FROM companies c
      LEFT JOIN shares s ON c.company_id = s.company_id
      WHERE c.company_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// POST /api/companies - Add a new company
router.post('/', async (req, res) => {
  try {
    const { company_name, sector, description, company_status, founded_year } = req.body;

    if (!company_name || !sector || !founded_year) {
      return res.status(400).json({ error: 'Company name, sector, and founded year are required' });
    }

    const [result] = await db.query(
      `INSERT INTO companies (company_name, sector, description, company_status, founded_year, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [company_name.trim(), sector.trim(), description || '', company_status || 'Active', Number(founded_year)]
    );

    res.status(201).json({
      message: 'Company added successfully',
      company_id: result.insertId,
    });
  } catch (err) {
    console.error('Error creating company:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Company with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to add company' });
  }
});

module.exports = router;
