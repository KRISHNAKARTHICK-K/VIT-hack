// routes/analytics.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/analytics/overview - Overall metrics & distributions
router.get('/overview', (req, res) => {
  const data = store.getAnalyticsOverview();
  res.json(data);
});

// GET /api/analytics/heatmap - Location-based density and status
router.get('/heatmap', (req, res) => {
  const heatmap = store.getHeatmap();
  res.json(heatmap);
});

// GET /api/analytics/recurring - Alerts for repeated issues in same location
router.get('/recurring', (req, res) => {
  const alerts = store.getRecurringAlerts();
  res.json(alerts);
});

// GET /api/analytics/showcase - Recently resolved issues with proof for student showcase
router.get('/showcase', (req, res) => {
  const showcase = store.getResolvedShowcase();
  res.json(showcase);
});

module.exports = router;
