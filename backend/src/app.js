// Load environment variables from the .env file in the parent directory
require('dotenv').config({ path: '../.env' });
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// A simple health check route to verify the server is up
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// We will add the Twilio webhook endpoint here later
// app.post('/api/call', ...);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('To test, open a browser to http://localhost:3001/api/health');
});