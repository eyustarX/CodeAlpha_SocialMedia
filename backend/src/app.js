const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CodeAlpha Social Media API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

// API Base Route
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CodeAlpha Social Media API v1',
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);


// 404 & Centralized Error Handlers (must be registered LAST)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
