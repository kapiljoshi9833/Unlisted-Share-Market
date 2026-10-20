
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const [users] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (users.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users (name, email, password, role, kyc_status, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [name, email, hashedPassword, 'user', 'pending']
        );

        res.status(201).json({
            message: 'Signup successful'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Signup failed'
        });
    }
});

module.exports = router;
