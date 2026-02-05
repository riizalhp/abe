/**
 * Backend Server dengan Webhook Support
 * 
 * Run this on production server.
 * Gunakan dengan: npm run start:server
 * 
 * Requirements:
 * - Node.js 18+
 * - PORT environment variable (default 3001)
 * - MOOTA_SECRET_TOKEN environment variable
 * - DATABASE_URL untuk Supabase
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import webhook handlers
import { webhookHandler, testWebhookHandler } from '../services/webhook_moota_handler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Moota webhook endpoint
app.post('/api/webhook/moota', webhookHandler);

// Test webhook endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/webhook/moota/test', testWebhookHandler);
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
  console.log(`[Server] Webhook URL: /api/webhook/moota`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
