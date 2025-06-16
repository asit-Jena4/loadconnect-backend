require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ MySQL Pool Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});



// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ Health Check
app.get('/health', (req, res) => {
  res.json({
    status: "OK",
    message: "LoadConnect API is running",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ✅ Static API Info
app.get('/api', (req, res) => {
  res.json({
    name: "LoadConnect API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      apiInfo: "GET /api",
      loads: "GET /api/loads",
      singleLoad: "GET /api/loads/:id",
      createLoad: "POST /api/loads",
      login: "POST /api/auth/login",
      registerOperator: "POST /api/operator/register",
      registerCustomer: "POST /api/customer/register",
      postLoad: "POST /api/load/post",
      searchLoad: "GET /api/load/search"
    }
  });
});

// ✅ Load APIs (original)
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
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch loads' });
  }
});

app.get('/api/loads/:id', async (req, res) => {
  try {
    const loadId = parseInt(req.params.id);
    const [rows] = await pool.execute('SELECT * FROM loads WHERE id = ?', [loadId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Load not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get load' });
  }
});

app.post('/api/loads', async (req, res) => {
  try {
    const {
      source_city, source_state,
      destination_city, destination_state,
      distance, weight, scheduled_date,
      material_type, truck_type,
      description, price, posted_by
    } = req.body;

    const query = `
      INSERT INTO loads (
        source_city, source_state, destination_city, destination_state,
        distance, weight, scheduled_date,
        material_type, truck_type, description, price, posted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      source_city, source_state, destination_city, destination_state,
      distance, weight, scheduled_date,
      material_type, truck_type, description, price, posted_by
    ]);

    res.status(201).json({
      success: true,
      message: 'Load created successfully',
      loadId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create load' });
  }
});

// ✅ Import Routes
const authRoutes = require('./routes/authRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const customerRoutes = require('./routes/customerRoute');
const loadRoutes = require('./routes/loadRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
console.log("✅ trackingRoutes loaded");



// ✅ Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/load', loadRoutes); // includes /post, /search, and /load-specific 404s
app.use('/api/tracking', trackingRoutes);


const path = require('path');
app.use('/gps', express.static(path.join(__dirname, 'gps')));


app.use('/pay', express.static(path.join(__dirname, 'public')));






// ✅ Global 404 fallback
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    availableEndpoints: [
      "GET /health",
      "GET /api",
      "GET /api/loads",
      "GET /api/loads/:id",
      "POST /api/loads",
      "POST /api/auth/login",
      "POST /api/operator/register",
      "POST /api/customer/register",
      "POST /api/load/post",
      "GET /api/load/search",
      "POST /api/tracking/update"
    ]
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
