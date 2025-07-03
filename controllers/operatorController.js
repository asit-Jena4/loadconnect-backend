const {
  isValidAadhaar,
  isValidPAN,
  isValidDrivingLicense,
  isValidGST
} = require('../utils/validate');
const pool = require('../db'); // ✅ only if your db.js is in root folder


const register = async (req, res) => {
  const {
    first_name, last_name, aadhaar_number,
    pan_number, driving_license_number, gst_number
  } = req.body;

  const aadhaarFile = req.file?.path;

  // ✅ MANDATORY Field Validation

  if (!aadhaar_number || !isValidAadhaar(aadhaar_number)) {
    return res.status(400).json({ message: 'Valid Aadhaar number is required' });
  }

  if (!aadhaarFile) {
    return res.status(400).json({ message: 'Aadhaar file is required (PDF/JPG/PNG)' });
  }

  if (!pan_number || !isValidPAN(pan_number)) {
    return res.status(400).json({ message: 'Valid PAN number is required' });
  }

  if (!driving_license_number || !isValidDrivingLicense(driving_license_number)) {
    return res.status(400).json({ message: 'Valid Driving License number is required' });
  }

  // ✅ GST is optional, but if provided must be valid
  if (gst_number && !isValidGST(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number' });
  }

  // ✅ Save to database
  try {
    await pool.query(`
      INSERT INTO truck_operators 
      (first_name, last_name, aadhaar_number, pan_number, driving_license_number, gst_number, aadhaar_file)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [first_name, last_name, aadhaar_number, pan_number, driving_license_number, gst_number || null, aadhaarFile]);

    return res.status(201).json({ message: "Registration successful." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
};

module.exports = { register };