// server.js - CampusTrack Express Backend with Socket.IO Real-Time Engine
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { router: authRouter } = require('./routes/auth');
const issuesRouter = require('./routes/issues');
const analyticsRouter = require('./routes/analytics');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initSocket(server);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/analytics', analyticsRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusTrack API with Socket.IO Real-Time Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`CampusTrack Backend + Real-Time Engine running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Uploads served at: http://localhost:${PORT}/uploads`);
  console.log(`=========================================`);
});

