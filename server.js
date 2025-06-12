require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 4000;


// MySQL pool connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: "OK",
    message: "LoadConnect API is running",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Get all loads from MySQL with optional filters
app.get('/api/loads', async (req, res) => {
  try {
    const { status, source_city, destination_city } = req.query;

    let query = 'SELECT * FROM loads WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (source_city) {
      query += ' AND source_city LIKE ?';
      params.push(`%${source_city}%`);
    }

    if (destination_city) {
      query += ' AND destination_city LIKE ?';
      params.push(`%${destination_city}%`);
    }

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching loads from MySQL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loads from database'
    });
  }
});

// Get single load by ID
app.get('/api/loads/:id', async (req, res) => {
  try {
    const loadId = parseInt(req.params.id);
    const [rows] = await pool.execute('SELECT * FROM loads WHERE id = ?', [loadId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Load not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error getting load by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get load from database'
    });
  }
});

// Create a new load
app.post('/api/loads', async (req, res) => {
  try {
    const {
      source_city,
      source_state,
      destination_city,
      destination_state,
      distance,
      weight,
      scheduled_date,
      material_type,
      truck_type,
      description,
      price,
      posted_by
    } = req.body;

    const query = `
      INSERT INTO loads (
        source_city, source_state,
        destination_city, destination_state,
        distance, weight, scheduled_date,
        material_type, truck_type,
        description, price, posted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      source_city, source_state,
      destination_city, destination_state,
      distance, weight, scheduled_date,
      material_type, truck_type,
      description, price, posted_by
    ]);

    res.status(201).json({
      success: true,
      message: 'Load created successfully',
      loadId: result.insertId
    });
  } catch (error) {
    console.error('Error inserting load:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create load'
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: "LoadConnect API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      loads: "GET /api/loads",
      singleLoad: "GET /api/loads/:id",
      createLoad: "POST /api/loads"
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    availableEndpoints: [
      "GET /health",
      "GET /api",
      "GET /api/loads",
      "GET /api/loads/:id",
      "POST /api/loads"
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exp
