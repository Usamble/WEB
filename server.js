// Snowy Meme Coin Backend Server
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';
import multer from 'multer';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Import database and routes
import { initDatabase } from './server/db/index.js';
import { sessionMiddleware } from './server/middleware/session.js';
import { botProtection } from './server/middleware/botProtection.js';
import { apiLimiter, generationLimiter, gameLimiter, actionLimiter } from './server/middleware/rateLimit.js';

// Import routes
import authRoutes from './server/routes/auth.js';
import snowyRoutes from './server/routes/snowy.js';
import gameRoutes from './server/routes/game.js';
import calendarRoutes from './server/routes/calendar.js';
import giveawayRoutes from './server/routes/giveaway.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(botProtection);
app.use(sessionMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with rate limiting
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/snowy', apiLimiter, snowyRoutes);
app.use('/api/game', gameLimiter, gameRoutes);
app.use('/api/calendar', actionLimiter, calendarRoutes);
app.use('/api/giveaway', actionLimiter, giveawayRoutes);

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Proxy endpoint for Replicate predictions
app.post('/api/replicate/predictions', async (req, res) => {
  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Replicate API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get prediction status
app.get('/api/replicate/predictions/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Replicate API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image to Replicate
app.post('/api/replicate/files', upload.single('file'), async (req, res) => {
  try {
    console.log('Replicate file upload request received');
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, req.file.size, 'bytes');

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'image.png',
      contentType: req.file.mimetype || 'image/png',
    });

    console.log('Uploading to Replicate...');
    const response = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate upload failed:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('Replicate upload success:', data);
    res.json(data);
  } catch (error) {
    console.error('Replicate upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy for Hugging Face API
app.post('/api/huggingface/:model*', async (req, res) => {
  try {
    // Extract model name from path - handle both /api/huggingface/model and /api/huggingface/model/path
    const fullPath = req.params.model || req.path.replace('/api/huggingface/', '');
    const model = fullPath.split('/')[0]; // Get just the model name
    console.log('🤗 Hugging Face request for model:', model);
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      body: JSON.stringify(req.body),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.set('Content-Type', contentType);
        res.send(buffer);
      } else {
        const data = await response.json();
        res.json(data);
      }
    } else {
      const errorText = await response.text();
      console.error('Hugging Face API error response:', response.status, errorText);
      res.status(response.status).json({ error: errorText });
    }
  } catch (error) {
    console.error('Hugging Face API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database on startup (non-blocking)
initDatabase().catch((error) => {
  console.warn('⚠️  Database initialization failed (app will continue without database features):', error.message);
  console.warn('💡 To enable database features, install PostgreSQL and update .env with database credentials');
});

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Snowy backend server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'snowy'}`);
  });
}

// Export for Vercel
export default app;
