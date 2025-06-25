const express = require('express');
const router = express.Router();

const pool = require('../db'); // PostgreSQL pool
const bcrypt = require('bcryptjs');
const upload = require('../middlewares/uploads');
const customerController = require('../controllers/customerController');

// Aadhaar upload + required Aadhaar/PAN
router.post('/register', upload.single('aadhaarFile'), customerController.register);


router.post('/register', upload.array('documents'), async (req, res) => {
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

    const documents = req.files.map(file => file.filename).join(',');
    const safe = (v) => (v === undefined || v === '' ? null : v);

    // Check if mobile already exists
    const existing = await pool.query(
      'SELECT 1 FROM customers WHERE mobile = $1 LIMIT 1',
      [safe(phone)]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    // ✅ Password match check
    if (!password || !confirmPassword || password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match or missing' });
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
      safe(aadharNo), safe(detailCollection), safe(documents), hashedPassword
    ];

    await pool.query(sql, values);
    res.status(201).json({ success: true, message: 'Customer registered successfully' });

  } catch (err) {
    console.error('🔥 Customer registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;
