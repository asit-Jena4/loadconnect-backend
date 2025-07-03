const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/quotation
router.post('/', async (req, res) => {
  const { load_id, quoted_by, quoted_price, message, delivery_time } = req.body;

  try {
    await pool.query(`
      INSERT INTO quotations (load_id, quoted_by, quoted_price, message, delivery_time)
      VALUES ($1, $2, $3, $4, $5)
    `, [load_id, quoted_by, quoted_price, message, delivery_time]);

    res.json({ success: true, message: 'Quotation submitted successfully.' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, message: 'You already quoted this load.' });
    } else {
      console.error('Quote error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
});

module.exports = router;
