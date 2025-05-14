import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import portfolioRoutes from './routes/portfolio.js';
import stocksRoutes from './routes/stocks.js';
import newsRoutes from './routes/news.js';
import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import conversationRoutes from './routes/conversations.js';

// Import settings
import { settings } from './config/settings.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Set up Socket.IO for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Static files for charts and other assets
app.use('/static', express.static(path.join(__dirname, 'static')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Join a room based on user ID for personalized updates
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/user', userRoutes);

// New routes for multi-agent system
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/dev/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mode: 'development',
    gemini_api_key_configured: Boolean(settings.DEFAULT_GOOGLE_API_KEY),
    alpha_vantage_key_configured: Boolean(settings.DEFAULT_ALPHA_VANTAGE_KEY),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong',
  });
});

// Create static directory if it doesn't exist
import fs from 'fs';
const staticDir = path.join(__dirname, 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  console.log('Created static directory for assets');
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Multi-agent system is ready to respond to queries`);
});