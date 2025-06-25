const {
  isValidAadhaar,
  isValidPAN,
  isValidGST
} = require('../utils/validate');
const pool = require('../db'); // ✅ only if your db.js is in root folder


const register = async (req, res) => {
  const {
    first_name, last_name,
    aadhaar_number, pan_number, gst_number
  } = req.body;

  const aadhaarFile = req.file?.path;

  // ✅ Mandatory Checks
  if (!aadhaar_number || !isValidAadhaar(aadhaar_number)) {
    return res.status(400).json({ message: 'Valid Aadhaar number is required' });
  }

  if (!aadhaarFile) {
    return res.status(400).json({ message: 'Aadhaar document is required (PDF/JPG)' });
  }

  if (!pan_number || !isValidPAN(pan_number)) {
    return res.status(400).json({ message: 'Valid PAN number is required' });
  }

  if (gst_number && !isValidGST(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number' });
  }

  try {
    await pool.query(`
      INSERT INTO customers 
      (first_name, last_name, aadhaar_number, pan_number, gst_number, aadhaar_file)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [first_name, last_name, aadhaar_number, pan_number, gst_number || null, aadhaarFile]);

    return res.status(201).json({ message: 'Customer registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error' });
  }
};

module.exports = { register };
