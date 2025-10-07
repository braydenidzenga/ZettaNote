import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { DB, PORT } from './config.js';

import authRouter from './routes/auth/auth.routes.js';
import pageRouter from './routes/pages/pages.routes.js';
import adminRouter from './routes/admin/admin.routes.js';

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration - properly handle credentials with specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:80', 'http://localhost'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// routes
app.use('/api/auth', authRouter);
app.use('/api/pages', pageRouter);
app.use('/api/admin', adminRouter);

// Root route for quick backend check
app.get('/', (req, res) => {
  let dbStatus = 'Unknown ❓';

  // Optional: check database connection if using Mongoose
  if (mongoose.connection.readyState === 1) {
    dbStatus = 'Connected ✅';
  } else if (mongoose.connection.readyState === 0) {
    dbStatus = 'Disconnected ❌';
  } else if (mongoose.connection.readyState === 2) {
    dbStatus = 'Connecting ⏳';
  } else if (mongoose.connection.readyState === 3) {
    dbStatus = 'Disconnecting ⚠';
  }

  res.status(200).json({
    success: true,
    message: 'ZettaNote backend is running! 🚀',
    db_status: dbStatus,
    endpoints: {
      signup: 'api/auth/signup',
      login: 'api/auth/login',
      changePassword_auth: 'api/auth.changePassword',
      getuser: 'api/auth/getuser',
      pages: '/api/pages',
      admin: '/api/admin',
    },
    instructions: 'Use Postman or curl to test the above endpoints.',
  });
});

// Catch-all 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found! Check your endpoint URL.',
  });
});

const connectToDb = async () => {
  try {
    await mongoose.connect(DB);
    console.log('connected to db');

    app.listen(PORT, () => {
      console.log(`API listening on port: ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to connect to DB!', e);
  }
};

connectToDb();
