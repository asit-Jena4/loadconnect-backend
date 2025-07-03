const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ POST /api/tracking/update
router.post('/update', async (req, res) => {
  const { truck_id, latitude, longitude } = req.body;

  if (!truck_id || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // ✅ Upsert latest location (PostgreSQL version)
    const upsertQuery = `
      INSERT INTO tracking (truck_id, latitude, longitude, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (truck_id)
      DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = CURRENT_TIMESTAMP
    `;
    await pool.query(upsertQuery, [truck_id, latitude, longitude]);

    // ✅ Insert into tracking_logs (trail history)
    const logQuery = `
      INSERT INTO tracking_logs (truck_id, latitude, longitude)
      VALUES ($1, $2, $3)
    `;
    await pool.query(logQuery, [truck_id, latitude, longitude]);

    res.json({ success: true, message: 'Location updated and trail saved' });
  } catch (err) {
    console.error('🔥 Tracking error:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// ✅ GET /api/tracking/:truck_id
router.get('/:truck_id', async (req, res) => {
  const { truck_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM tracking WHERE truck_id = $1',
      [truck_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No tracking data found' });
    }

    res.json({ success: true, location: result.rows[0] });
  } catch (err) {
    console.error('🔥 Fetch tracking error:', err);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

module.exports = router;

