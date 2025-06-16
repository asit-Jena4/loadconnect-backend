const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Make sure db.js exports MySQL pool

// Login route
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: "Phone and password are required." });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const user = rows[0];

    // 🔐 Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // 🔑 Generate JWT token
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        user_type: user.user_type
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
