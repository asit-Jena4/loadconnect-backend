const express = require('express');
const router = express.Router();
const upload = require('../upload');
const pool = require('../db'); // MySQL pool

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
      detailCollection
    } = req.body;

    const documents = req.files.map(file => file.filename).join(',');

    // Optional: check if operator already exists in MySQL
    const [existing] = await pool.execute(
      'SELECT * FROM truck_operators WHERE mobile = ? LIMIT 1',
      [phone]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    const sql = `
      INSERT INTO truck_operators (
        first_name, last_name, email, mobile, dob, number_of_trucks, address,
        country, pincode, district, state, city, pan_number, gst_number,
        aadhaar_number, driving_license_number, detail_collection, documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const safe = (v) => (v === undefined || v === '' ? null : v);

const values = [
  safe(name), safe(lastName), safe(email), safe(phone), safe(dob),
  safe(truckCount), safe(address), safe(country), safe(pincode),
  safe(district), safe(state), safe(city), safe(panNo),
  safe(gstNo), safe(aadharNo), safe(drivingLicense),
  safe(detailCollection), safe(documents)
];


    await pool.execute(sql, values);

    res.status(201).json({ success: true, message: 'Truck operator registered successfully' });

  } catch (err) {
    console.error('🔥 Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;

