const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/tracking/update
router.post('/update', async (req, res) => {
  const { truck_id, latitude, longitude } = req.body;

  if (!truck_id || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const sql = `
      INSERT INTO tracking (truck_id, latitude, longitude)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      updated_at = CURRENT_TIMESTAMP
    `;

    await pool.execute(sql, [truck_id, latitude, longitude]);

    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    console.error('🔥 Tracking error:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// GET /api/tracking/:truck_id
router.get('/:truck_id', async (req, res) => {
  const { truck_id } = req.params;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tracking WHERE truck_id = ?',
      [truck_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No tracking data found' });
    }

    res.json({ success: true, location: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

module.exports = router;