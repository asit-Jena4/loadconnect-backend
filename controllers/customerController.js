// ✅ FINAL customerRoutes.js (Cleaned and Working)

const express = require('express');
const router = express.Router();

const pool = require('../db'); // PostgreSQL pool
const bcrypt = require('bcryptjs');
const upload = require('../middlewares/uploads');
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// ✅ Register Customer with Aadhaar Upload
router.post('/register', upload.single('aadhaarFile'), async (req, res) => {
  try {
    const {
      name,
      lastName,
      phone,
      dob,
      address,
      country,
      pincode,
      district,
      state,
      city,
      panNo,
      gstNo,
      aadharNo,
      detailCollection,
      password,
      confirmPassword
    } = req.body;

    const aadhaarFile = req.file ? req.file.filename : null;
    const safe = (v) => (v === undefined || v === '' ? null : v);

    // ✅ Validation
    if (!aadharNo || !/^\d{12}$/.test(aadharNo)) {
      return res.status(400).json({ success: false, message: 'Valid Aadhaar number is required' });
    }

    if (!password || !confirmPassword || password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match or missing' });
    }

    // ✅ Check if mobile already exists
    const existing = await pool.query(
      'SELECT 1 FROM customers WHERE mobile = $1 LIMIT 1',
      [safe(phone)]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO customers (
        first_name, last_name, mobile, dob, address, country,
        pincode, district, state, city,
        pan_number, gst_number, aadhaar_number,
        detail_collection, documents, password
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
    `;

    const values = [
      safe(name), safe(lastName), safe(phone), safe(dob),
      safe(address), safe(country), safe(pincode), safe(district),
      safe(state), safe(city), safe(panNo), safe(gstNo),
      safe(aadharNo), safe(detailCollection), safe(aadhaarFile), hashedPassword
    ];

    await pool.query(sql, values);

    res.status(201).json({ success: true, message: 'Customer registered successfully' });

  } catch (err) {
    console.error('🔥 Customer registration error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// ✅ Send OTP to Customer Phone
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    await client.messages.create({
      body: `Your LoadConnect OTP is: ${otp}`,
      to: `+91${phone}`,
      from: twilioPhone
    });

    // You should ideally save this OTP in DB or Redis with expiry for validation
    res.status(200).json({ success: true, message: 'OTP sent successfully', otp }); // ⚠️ Only send OTP in dev/testing
  } catch (error) {
    console.error('🔥 OTP send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

module.exports = router;

