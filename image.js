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
  if (req.path.startsWith('/images') || req.path.startsWith('/download')) {
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
      console.warn(`File not found: ${imagePath}`);
      return res.status(404).json({ error: 'Image Not Found', path: req.originalUrl });
    }

    // Send the image file as response
    res.sendFile(imagePath, (sendErr) => {
      if (sendErr) {
        console.error(`Error sending file: ${imagePath}`, sendErr);
        return res.status(500).json({ error: 'Failed to send the image file.' });
      }
    });
  });
});

// New route to handle image downloads
app.get('/download/:userId/:imageId', (req, res) => {
  const { userId, imageId } = req.params;

  const imagePath = path.join(USER_IMAGES_PATH, userId, imageId);

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.warn(`File not found for download: ${imagePath}`);
      return res.status(404).json({ error: 'Image Not Found', path: req.originalUrl });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(imagePath)}"`);
    const imageType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' :
      path.extname(imagePath).toLowerCase() === '.jpg' || path.extname(imagePath).toLowerCase() === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
    res.setHeader('Content-Type', imageType);
    res.sendFile(imagePath, (sendErr) => {
      if (sendErr) {
        console.error(`Error sending file for download: ${imagePath}`, sendErr);
        return res.status(500).json({ error: 'Failed to send the image file for download.' });
      }
    });
  });
});

// Catch-all handler for non-existing routes
app.use((req, res) => {
  console.warn(`Invalid route accessed: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});