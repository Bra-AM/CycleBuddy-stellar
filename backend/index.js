const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors'); // <--- ADD THIS
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const router = express.Router();

const setupSecurityRoutes = require('./features/security');
const setupCycleRoutes = require('./features/cycle');
const setupProductivityRoutes = require('./features/productivity');

// --- CORS middleware ---
// Allow React frontend to talk to backend
/* app.use(cors({
  origin: 'http://localhost:3000', // Allow frontend origin
  credentials: true,              // Allow cookies, auth headers, etc (if used)
})); */
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Register the security routes
app.use('/api', setupSecurityRoutes(pool));
app.use('/api', setupCycleRoutes(pool));
app.use('/api', setupProductivityRoutes(pool));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});