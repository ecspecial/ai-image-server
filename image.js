import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 4000;

// Define the base directory where the images are stored
const USER_IMAGES_PATH = process.env.USER_IMAGES_PATH || "";
console.log(USER_IMAGES_PATH);

// Middleware to enable CORS for all routes
app.use(cors());

// Middleware to restrict routes other than images
app.use((req, res, next) => {
  if (req.path.startsWith('/images')) {
    // Allow requests to /images route
    next();
  } else {
    // Reject requests to other routes with 403 Forbidden
    res.status(403).send('Forbidden');
  }
});

// Define the route to serve static files
app.use('/images', express.static(USER_IMAGES_PATH));

// Define the route to handle image requests
app.get('/:userId/:imageId', (req, res) => {
  const { userId, imageId } = req.params;

  // Construct the path to the requested image
  const imagePath = path.join(USER_IMAGES_PATH, userId, imageId);

  // Check if the image file exists
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Error accessing image file:', err);
      return res.status(404).send('Image Not Found');
    }

    // Send the image file as response
    res.sendFile(imagePath);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});