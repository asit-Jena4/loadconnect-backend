const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ensure this points to your PostgreSQL pool

// POST /api/booking
router.post('/', async (req, res) => {
  const { quotation_id, customer_id, load_id } = req.body;

  try {
    await pool.query(`
      INSERT INTO bookings (quotation_id, customer_id, load_id)
      VALUES ($1, $2, $3)
    `, [quotation_id, customer_id, load_id]);

    res.json({ success: true, message: 'Booking successful!' });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, error: 'Booking failed' });
  }
});

module.exports = router; // ✅ This line is required
