#!/usr/bin/env node

import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';


// const port = 3001;

// const port = process.env.PORT || 3001;

// const listener = app.listen(port, () => {
//   console.log(`Server running on port: ${port}`);
// });

dotenv.config();
const PORT = process.env.PORT || 3001; // 0 lets the OS assign a free port
const listener = app.listen(PORT, () => {
  console.log(`Server is running on port ${listener.address().port}`);
});

// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log('Connected to MongoDB');
//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch((error) => console.error('Database connection error:', error));



// Function to stop the server
const close = () => {
  listener.close();
};

// Export close function and listener

export { close, listener };

