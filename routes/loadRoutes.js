const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection

// POST /api/load/post
router.post('/post', async (req, res) => {
  try {
    const d = req.body;
    let query = '';
    let values = [];

    if (d.load_type === 'full') {
      query = `
        INSERT INTO loads (
          load_type, source_city, destination_city, material_type, weight,
          truck_type, number_of_trucks, scheduled_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      values = [
        d.load_type,
        d.source_city,
        d.destination_city,
        d.material_type,
        d.weight,
        d.truck_type,
        d.number_of_trucks,
        d.scheduled_date
      ];
    } else if (d.load_type === 'part') {
      query = `
        INSERT INTO loads (
          load_type, source_city, destination_city, source_pin_code, destination_pin_code,
          pickup_type, material_type, weight, pickup_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      values = [
        d.load_type,
        d.source_city,
        d.destination_city,
        d.source_pin_code,
        d.destination_pin_code,
        d.pickup_type,
        d.material_type,
        d.weight,
        d.pickup_date
      ];
    }

    await pool.query(query, values);
    res.json({ success: true, message: "Load inserted" });

  } catch (err) {
    console.error("🔥 Load insert error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ GET /api/load/recent
router.get('/recent', async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM loads
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("🔥 Error fetching recent loads:", err);
    res.status(500).json({ success: false, error: "Could not fetch recent loads" });
  }
});

module.exports = router;
