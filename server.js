// server.js (sa root ng project)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import yung Vercel serverless functions as routes
const generateSuggestions = require('./api/generate-suggestions');
const sendRejectEvent = require('./api/send-reject-event');
const sendRejectOrg = require('./api/send-reject-org');
const sendRemovalNotification = require('./api/send-removal-notification');

// Wrapper function - converts Vercel serverless to Express
const wrapServerless = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error' 
        });
      }
    }
  };
};

// Mount ang routes (same endpoints sa Vercel at localhost)
app.post('/api/generate-suggestions', wrapServerless(generateSuggestions));
app.post('/api/send-reject-event', wrapServerless(sendRejectEvent));
app.post('/api/send-reject-org', wrapServerless(sendRejectOrg));
app.post('/api/send-removal-notification', wrapServerless(sendRemovalNotification));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server (only sa localhost, hindi sa Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email service ready`);
    console.log(`🤖 AI service ready`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST /api/generate-suggestions`);
    console.log(`  POST /api/send-reject-event`);
    console.log(`  POST /api/send-reject-org`);
    console.log(`  POST /api/send-removal-notification`);
    console.log(`  GET  /api/health`);
  });
}

module.exports = app;