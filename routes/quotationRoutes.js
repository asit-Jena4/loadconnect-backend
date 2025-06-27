const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all quotations (you can filter by operator_id later)
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotations ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Fetch quotations error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch quotations' });
  }
});

// Update quotation status (accept/reject)
router.patch('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    await pool.query('UPDATE quotations SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Quotation status updated' });
  } catch (err) {
    console.error('Update quotation error:', err);
    res.status(500).json({ success: false, error: 'Failed to update quotation' });
  }
});

module.exports = router;

