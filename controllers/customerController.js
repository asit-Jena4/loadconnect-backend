// ✅ controllers/customerController.js

const pool = require('../db');
const bcrypt = require('bcryptjs');
const {
  isValidAadhaar,
  isValidPAN,
  isValidGST
} = require('../utils/validate');

const register = async (req, res) => {
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

  const aadhaarFile = req.file?.filename;
  const safe = (v) => (v === undefined || v === '' ? null : v);

  if (!aadharNo || !isValidAadhaar(aadharNo)) {
    return res.status(400).json({ success: false, message: 'Valid Aadhaar number is required' });
  }

  if (!aadhaarFile) {
    return res.status(400).json({ success: false, message: 'Aadhaar document is required (PDF/JPG)' });
  }

  if (!panNo || !isValidPAN(panNo)) {
    return res.status(400).json({ success: false, message: 'Valid PAN number is required' });
  }

  if (gstNo && !isValidGST(gstNo)) {
    return res.status(400).json({ success: false, message: 'Invalid GST number' });
  }

  if (!password || !confirmPassword || password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match or are missing' });
  }

  try {
    // Check mobile number duplicate
    const existing = await pool.query(
      'SELECT 1 FROM customers WHERE mobile = $1 LIMIT 1',
      [safe(phone)]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

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

    return res.status(201).json({ success: true, message: 'Customer registered successfully' });

  } catch (err) {
    console.error('🔥 Customer registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

module.exports = { register };
