// routes/loadRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection

router.post('/post', async (req, res) => {
  try {
    const data = req.body;

    let insertQuery = '';
    let values = [];

    if (data.loadType === 'full') {
      insertQuery = `
        INSERT INTO loads (
          load_type, source_city, destination_city, material_type, weight,
          truck_type, number_of_trucks, scheduled_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      values = [
        'full',
        data.sourceCity,
        data.destinationCity,
        data.material,
        data.weight,
        data.truckType,
        data.numTrucks,        // ✅ matches number_of_trucks
        data.scheduledDate
      ];
    } else if (data.loadType === 'part') {
      insertQuery = `
        INSERT INTO loads (
          load_type, source_city, destination_city, source_pin_code, destination_pin_code,
          pickup_type, material_type, weight, pickup_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      values = [
        'part',
        data.sourceCity2,
        data.destinationCity2,
        data.sourcePinCode || null,
        data.destinationPinCode || null,
        data.pickupType,
        data.material2,
        data.weight2,
        data.pickupDate
      ];
    }

    await pool.query(insertQuery, values);

    res.json({ success: true, message: '✅ Load posted successfully!' });
  } catch (err) {
    console.error('🔥 Load post error:', err);
    res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;
