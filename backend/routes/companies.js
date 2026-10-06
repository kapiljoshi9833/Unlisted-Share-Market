const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
  try {
    const [companies] = await db.query(
      'SELECT * FROM Companies ORDER BY company_id ASC'
    );
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
    const [rows] = await db.query(
      'SELECT * FROM Companies WHERE company_id = ?',
      [id]
    );

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
      `INSERT INTO Companies (company_name, sector, description, company_status, founded_year, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [company_name, sector, description || '', company_status || 'Active', founded_year]
    );

    res.status(201).json({
      message: 'Company added successfully',
      company_id: result.insertId,
    });
  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({ error: 'Failed to add company' });
  }
});

module.exports = router;