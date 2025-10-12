require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import all your email route files
const emailRoutes = require('./routes/email');
const emailRejectOrgRoutes = require('./routes/email_reject_org');
const emailRejectEventRoutes = require('./routes/email_reject_event');
const aiRoutes = require('./routes/ai-routes'); // NEW: AI routes

const app = express();

// Configure CORS to allow requests from React (frontend)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // React dev server port
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for AI endpoints (optional but recommended)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 AI requests per windowMs
  message: 'Too many AI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Use your email route files
app.use(emailRoutes);
app.use('/api', emailRejectOrgRoutes);
app.use('/api', emailRejectEventRoutes);

// NEW: AI routes with rate limiting
app.use('/api/ai', aiLimiter, aiRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Centro Backend API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message || 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`📧 Email routes: Active`);
  console.log(`🤖 AI routes: http://localhost:${PORT}/api/ai/generate-suggestions`);
  
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in environment variables!');
    console.warn('   Add OPENAI_API_KEY to your .env file to enable AI features.');
  } else {
    console.log('✅ OpenAI API key is configured');
  }
});