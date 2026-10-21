const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// POST /api/auth/signup - Register new exchange participant
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered in MySQL users table
    const [existing] = await db.query(
      'SELECT user_id, name FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: `This email (${trimmedEmail}) is already registered on VALENCE-X. Please switch to Sign In.` 
      });
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role || 'Investor';

    // Insert user row into MySQL users table
    const [result] = await db.query(`
      INSERT INTO users (name, email, password, role, kyc_status, share_id, shares_owned, created_at)
      VALUES (?, ?, ?, ?, 'VERIFIED', NULL, 0, NOW())
    `, [name.trim(), trimmedEmail, hashedPassword, assignedRole]);

    const newUser = {
      user_id: result.insertId,
      name: name.trim(),
      email: trimmedEmail,
      role: assignedRole,
      kyc_status: 'VERIFIED',
      share_id: null,
      shares_owned: 0,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Account successfully registered and stored in database.',
      user: newUser
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Registration failed due to server error: ' + err.message });
  }
});

// POST /api/auth/login - Authenticate registered participant
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query MySQL users table
    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.password,
        u.role,
        u.kyc_status,
        u.share_id,
        u.shares_owned,
        u.created_at,
        s.share_type,
        s.current_price,
        c.company_name
      FROM users u
      LEFT JOIN shares s ON u.share_id = s.share_id
      LEFT JOIN companies c ON s.company_id = c.company_id
      WHERE u.email = ?
    `, [trimmedEmail]);

    // 1. If email is NOT found in the database
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: `No account found with email "${trimmedEmail}". Please check your email or click Sign Up to create an account.` 
      });
    }

    const userRecord = rows[0];

    // 2. Verify password with bcryptjs
    const passwordMatch = await bcrypt.compare(password, userRecord.password);
    if (!passwordMatch) {
      // Fallback check for unhashed legacy demo passwords
      if (userRecord.password !== password) {
        return res.status(401).json({ 
          error: 'Incorrect password. Please verify your password and try again.' 
        });
      }
    }

    // Clean user object (do not expose password hash in response)
    const user = { ...userRecord };
    delete user.password;

    res.status(200).json({
      message: 'Authentication successful. Session established.',
      user
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Authentication failed due to server error: ' + err.message });
  }
});

// GET /api/auth/me/:userId - Refresh user session and holdings
router.get('/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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
      FROM users u
      LEFT JOIN shares s ON u.share_id = s.share_id
      LEFT JOIN companies c ON s.company_id = c.company_id
      WHERE u.user_id = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to refresh user profile' });
  }
});

module.exports = router;
