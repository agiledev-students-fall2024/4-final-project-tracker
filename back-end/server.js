#!/usr/bin/env node

import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import './cron-jobs/recurringPaymentsScheduler.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all interfaces

let listener; // Declare listener in the outer scope

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    listener = app.listen(PORT, HOST, () => {
      console.log(`Backend server running at http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => console.error('Database connection error:', error));

// Function to stop the server
const close = () => {
  if (listener) {
    listener.close(() => {
      console.log('Server has been stopped');
    });
  } else {
    console.log('Server is not running');
  }
};

// Export listener and close function at the top level
export { listener, close };
