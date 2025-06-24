const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// ✅ Twilio Setup
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ 1. OTP Request Route with SMS
router.post('/request-otp', async (req, res) => {
  const { phone, user_type } = req.body;

  if (!phone || !user_type) {
    return res.status(400).json({ message: "Phone and user type are required." });
  }

  const table = user_type === 'operator' ? 'truck_operators' : user_type === 'customer' ? 'customers' : null;
  if (!table) return res.status(400).json({ message: "Invalid user type" });

  try {
    const result = await pool.query(`SELECT * FROM ${table} WHERE mobile = $1`, [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Phone number not registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(`UPDATE ${table} SET otp_code = $1, otp_expiry = $2 WHERE mobile = $3`, [
      otp, expiry, phone
    ]);

    // ✅ Send OTP via SMS
    await client.messages.create({
      body: `Your LoadConnect OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });

    res.json({ message: "OTP sent to your registered phone number." });
  } catch (error) {
    console.error("Request OTP error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ 2. Verify OTP and Reset Password
router.post('/verify-otp', async (req, res) => {
  const { phone, otp, newPassword, confirmPassword, user_type } = req.body;

  if (!phone || !otp || !newPassword || !confirmPassword || !user_type) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  const table = user_type === 'operator' ? 'truck_operators' : user_type === 'customer' ? 'customers' : null;
  if (!table) return res.status(400).json({ message: "Invalid user type" });

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE mobile = $1 AND otp_code = $2 AND otp_expiry > NOW()`,
      [phone, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE ${table} SET password = $1, otp_code = NULL, otp_expiry = NULL WHERE mobile = $2`,
      [hashedPassword, phone]
    );

    res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("OTP Verify error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ 3. Login Route
router.post('/login', async (req, res) => {
  const { phone, password, user_type } = req.body;

  if (!phone || !password || !user_type) {
    return res.status(400).json({ success: false, message: "Phone, password, and user type are required." });
  }

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

