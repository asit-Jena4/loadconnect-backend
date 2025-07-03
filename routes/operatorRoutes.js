const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploads'); // ✅ Keep only this one
const pool = require('../db'); // PostgreSQL pool
const bcrypt = require('bcryptjs');
const operatorController = require('../controllers/operatorController');

// ✅ Commented this out because you defined the same POST route below
// router.post('/register', upload.single('aadhaarFile'), operatorController.register);

// ✅ Use array for multiple files, including Aadhaar and other docs
router.post('/register', upload.fields([
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]), async (req, res) => {
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

    const allDocs = [];

    if (req.files['aadhaarFile']) {
      allDocs.push(req.files['aadhaarFile'][0].filename);
    }

    if (req.files['documents']) {
      req.files['documents'].forEach(file => allDocs.push(file.filename));
    }

    const documents = allDocs.join(',');

    const safe = (v) => (v === undefined || v === '' ? null : v);

    // ✅ Check if operator already exists
    const checkQuery = 'SELECT 1 FROM truck_operators WHERE mobile = $1 LIMIT 1';
    const result = await pool.query(checkQuery, [safe(phone)]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    // ✅ Check password
    if (!password || !confirmPassword || password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match or missing' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
