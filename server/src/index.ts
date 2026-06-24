import dotenv from 'dotenv';
// Load environment variables immediately before any other local imports
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import recordRoutes from './routes/records';
import vitalsRoutes from './routes/vitals';
import timelineRoutes from './routes/timeline';
import emergencyRoutes from './routes/emergency';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/emergency', emergencyRoutes);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'MediVault server is healthy' });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details || null
    }
  });
});

// Start Server
app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`🚀 MediVault Server running on http://0.0.0.0:${PORT}`);
});
