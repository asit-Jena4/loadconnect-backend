const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all quotations (admin or debug use)
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

// Get quotations by customer ID (My Bookings)
router.get('/by-customer/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT q.*, l.source_city, l.destination_city, l.material_type, l.weight, l.scheduled_date
      FROM quotations q
      JOIN loads l ON q.load_id = l.id
      WHERE q.customer_id = $1
      ORDER BY q.created_at DESC
    `, [customerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ Error fetching customer quotations:", err);
    res.status(500).json({ success: false, error: "Failed to fetch customer quotations" });
  }
});

// ✅ NEW: Get quotations by operator ID (for operator dashboard/quotes page)
router.get('/by-operator/:id', async (req, res) => {
  const operatorId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT q.*, l.source_city, l.destination_city, l.material_type, l.weight, l.scheduled_date
      FROM quotations q
      JOIN loads l ON q.load_id = l.id
      WHERE l.posted_by = $1
      ORDER BY q.created_at DESC
    `, [operatorId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ Error fetching operator quotations:", err);
    res.status(500).json({ success: false, error: "Failed to fetch operator quotations" });
  }
});

module.exports = router;
