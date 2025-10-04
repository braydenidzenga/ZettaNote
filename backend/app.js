import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { DB, PORT } from './config.js';

import authRouter from './routes/auth/auth.js';
import pageRouter from './routes/pages/pages.js';

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// routes
app.use('/api/auth', authRouter);
app.use('/api/pages', pageRouter);

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
