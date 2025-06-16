const express = require('express');
const router = express.Router();
const upload = require('../upload');
const pool = require('../db'); // shared MySQL pool

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
      detailCollection
    } = req.body;

    const documents = req.files.map(file => file.filename).join(',');
    const safe = (v) => (v === undefined || v === '' ? null : v);

    const [existing] = await pool.execute(
      'SELECT * FROM customers WHERE mobile = ? LIMIT 1',
      [phone]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    const sql = `
      INSERT INTO customers (
        first_name, last_name, mobile, dob, address, country,
        pincode, district, state, city,
        pan_number, gst_number, aadhaar_number,
        detail_collection, documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      safe(name), safe(lastName), safe(phone), safe(dob),
      safe(address), safe(country), safe(pincode), safe(district),
      safe(state), safe(city), safe(panNo), safe(gstNo),
      safe(aadharNo), safe(detailCollection), safe(documents)
    ];

    await pool.execute(sql, values);
    res.status(201).json({ success: true, message: 'Customer registered successfully' });

  } catch (err) {
    console.error('🔥 Customer registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;

