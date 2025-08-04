import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Test auth endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Registration attempt:', req.body);
  res.json({
    message: 'Test registration endpoint working',
    data: req.body
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({
    message: 'Test login endpoint working',
    data: req.body
  });
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log(`📱 Try visiting: http://localhost:${PORT}/health`);
  console.log(`🔧 This is a test server without MongoDB`);
});