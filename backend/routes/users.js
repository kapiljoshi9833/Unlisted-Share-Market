const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.kyc_status,
        u.share_id,
        u.shares_owned,
        u.created_at,
        c.company_name
      FROM Users u
      LEFT JOIN Shares s ON u.share_id = s.share_id
      LEFT JOIN Companies c ON s.company_id = c.company_id
      ORDER BY u.user_id ASC
    `);
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user profile and holdings
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.kyc_status,
        u.share_id,
        u.shares_owned,
        u.created_at,
        s.share_type,
        s.current_price,
        c.company_name
      FROM Users u
      LEFT JOIN Shares s ON u.share_id = s.share_id
      LEFT JOIN Companies c ON s.company_id = c.company_id
      WHERE u.user_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// POST /api/users - Register new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already registered
    const [existing] = await db.query(
      'SELECT user_id FROM Users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const [result] = await db.query(`
      INSERT INTO Users (name, email, password, role, kyc_status, share_id, shares_owned, created_at)
      VALUES (?, ?, ?, ?, 'VERIFIED', NULL, 0, NOW())
    `, [name, email, password, role || 'Investor']);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: result.insertId,
        name,
        email,
        role: role || 'Investor',
        kyc_status: 'VERIFIED'
      }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/users/login - Simple demo authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.kyc_status,
        u.share_id,
        u.shares_owned,
        u.password
      FROM Users u
      WHERE u.email = ?
    `, [email]);

    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = { ...rows[0] };
    delete user.password; // Do not return password in response

    res.status(200).json({
      message: 'Login successful',
      user
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;