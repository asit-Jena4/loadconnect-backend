require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ PostgreSQL Pool Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Important for Neon
  }
});

// ✅ Middlewares
const allowedOrigins = [
  'http://127.0.0.1:5500',                       // local test (HTML)
  'http://127.0.0.1:3000',                       // local React
  'https://loadconnectiitcapston.netlify.app',  // your deployed frontend
  'https://heroic-speculoos-eb8f45.netlify.app' // your alternate Netlify domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));

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
      searchLoad: "GET /api/load/search",
      quotation: "GET|POST /api/quotation",
      booking: "GET|POST /api/booking"
    }
  });
});

// ✅ Load APIs
app.get('/api/loads', async (req, res) => {
  try {
    const { status, source_city, destination_city } = req.query;
    let query = 'SELECT * FROM loads WHERE 1=1';
    const params = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (source_city) {
      query += ` AND source_city ILIKE $${params.length + 1}`;
      params.push(`%${source_city}%`);
    }
    if (destination_city) {
      query += ` AND destination_city ILIKE $${params.length + 1}`;
      params.push(`%${destination_city}%`);
    }

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch loads' });
  }
});

app.get('/api/loads/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Load not found' });
    }
    res.json({ success: true, data: result.rows[0] });
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const result = await pool.query(query, [
      source_city, source_state, destination_city, destination_state,
      distance, weight, scheduled_date,
      material_type, truck_type, description, price, posted_by
    ]);

    res.status(201).json({
      success: true,
      message: 'Load created successfully',
      loadId: result.rows[0].id
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
const quotationRoutes = require('./routes/quotationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

console.log("✅ All routes loaded");

// ✅ Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/load', loadRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/booking', bookingRoutes);

app.use('/gps', express.static(path.join(__dirname, 'gps')));
app.use('/pay', express.static(path.join(__dirname, 'public')));

// ✅ Catch-All Route
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    suggestion: "Check /api for available endpoints"
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
