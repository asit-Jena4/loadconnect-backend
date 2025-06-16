const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ POST /api/load/post
router.post('/post', async (req, res) => {
  try {
    const {
      load_type,
      source_city,
      destination_city,
      material_type,
      weight,
      truck_type,
      number_of_trucks,
      scheduled_date,
      posted_by
    } = req.body;

    const sql = `
      INSERT INTO loads (
        load_type, source_city, destination_city, material_type,
        weight, truck_type, number_of_trucks, scheduled_date, posted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      load_type, source_city, destination_city, material_type,
      weight, truck_type, number_of_trucks, scheduled_date, posted_by || null
    ];

    await pool.execute(sql, values);
    res.status(201).json({ success: true, message: 'Load posted successfully' });

  } catch (err) {
    console.error('🔥 Load post error:', err);
    res.status(500).json({ error: 'Failed to post load' });
  }
});

// ✅ GET /api/load/search
router.get('/search', async (req, res) => {
  try {
    const {
      source_city,
      destination_city,
      truck_type,
      material_type,
      load_type
    } = req.query;

    let sql = 'SELECT * FROM loads WHERE 1=1';
    const params = [];

    if (source_city) {
      sql += ' AND source_city LIKE ?';
      params.push(`%${source_city}%`);
    }

    if (destination_city) {
      sql += ' AND destination_city LIKE ?';
      params.push(`%${destination_city}%`);
    }

    if (truck_type) {
      sql += ' AND truck_type = ?';
      params.push(truck_type);
    }

    if (material_type) {
      sql += ' AND material_type = ?';
      params.push(material_type);
    }

    if (load_type) {
      sql += ' AND load_type = ?';
      params.push(load_type);
    }

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, count: rows.length, data: rows });

  } catch (err) {
    console.error('🔥 Load search error:', err);
    res.status(500).json({ error: 'Failed to search loads' });
  }
});

// ✅ 404 fallback for /api/load/*
router.all('*', (req, res) => {
  res.status(404).json({
    error: 'Load route not found',
    availableEndpoints: [
      'POST /api/load/post',
      'GET /api/load/search'
    ]
  });
});

module.exports = router;
