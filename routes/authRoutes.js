const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // PostgreSQL pool

// Login route for both customers and operators
router.post('/login', async (req, res) => {
  const { phone, password, user_type } = req.body;

  if (!phone || !password || !user_type) {
    return res.status(400).json({ success: false, message: "Phone, password, and user type are required." });
  }

  // Determine table based on user type
  let table;
  if (user_type === 'operator') {
    table = 'truck_operators';
  } else if (user_type === 'customer') {
    table = 'customers';
  } else {
    return res.status(400).json({ success: false, message: "Invalid user type." });
  }

  try {
    const result = await pool.query(`SELECT * FROM ${table} WHERE mobile = $1`, [phone]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user.id, phone: user.mobile }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.first_name || user.username,
        phone: user.mobile,
        user_type
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
