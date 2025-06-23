const express = require('express');
const router = express.Router();
const upload = require('../upload');
const pool = require('../db'); // PostgreSQL pool
const bcrypt = require('bcryptjs');

// POST /api/operator/register
router.post('/register', upload.array('documents'), async (req, res) => {
  try {
    const {
      name,
      lastName,
      email,
      phone,
      dob,
      truckCount,
      address,
      country,
      pincode,
      district,
      state,
      city,
      panNo,
      gstNo,
      aadharNo,
      drivingLicense,
      detailCollection,
      password,
      confirmPassword
    } = req.body;

    const documents = req.files.map(file => file.filename).join(',');

    const safe = (v) => (v === undefined || v === '' ? null : v);

    // ✅ Check if operator already exists (PostgreSQL uses $1)
    const checkQuery = 'SELECT 1 FROM truck_operators WHERE mobile = $1 LIMIT 1';
    const result = await pool.query(checkQuery, [safe(phone)]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    // ✅ Check if passwords match
    if (!password || !confirmPassword || password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match or missing' });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new operator
    const insertQuery = `
      INSERT INTO truck_operators (
        first_name, last_name, email, mobile, dob, number_of_trucks, address,
        country, pincode, district, state, city, pan_number, gst_number,
        aadhaar_number, driving_license_number, detail_collection, documents, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `;

    const values = [
      safe(name), safe(lastName), safe(email), safe(phone), safe(dob),
      safe(truckCount), safe(address), safe(country), safe(pincode),
      safe(district), safe(state), safe(city), safe(panNo),
      safe(gstNo), safe(aadharNo), safe(drivingLicense),
      safe(detailCollection), safe(documents), hashedPassword
    ];

    await pool.query(insertQuery, values);

    res.status(201).json({ success: true, message: 'Truck operator registered successfully' });

  } catch (err) {
    console.error('🔥 Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;


