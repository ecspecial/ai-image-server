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

// Middleware to validate file paths
app.use(async (req, res, next) => {
  const userId = req.params.userId || '';
  const imageId = req.params.imageId || '';
  const imagePath = path.join(USER_IMAGES_PATH, userId, imageId);

  try {
    // Check if the file exists
    await fs.access(imagePath);
    next();
  } catch (error) {
    console.error(`File not found: ${imagePath}`);
    return res.status(404).json({ error: 'File Not Found' });
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
  // fs.access(imagePath, fs.constants.F_OK, (err) => {
  //   if (err) {
  //     console.error('Error accessing image file:', err);
  //     return res.status(404).send('Image Not Found');
  //   }

  //   // Send the image file as response
  //   res.sendFile(imagePath);
  // });
  try {
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      }
    });
  } catch (error) {
    console.error('Error handling image request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New route to handle image downloads
app.get('/download/:userId/:imageId', async (req, res) => {
  const { userId, imageId } = req.params;
  const imagePath = path.join(USER_IMAGES_PATH, userId, imageId);

  try {
    const imageType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' :
      path.extname(imagePath).toLowerCase() === '.jpg' || path.extname(imagePath).toLowerCase() === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(imagePath)}"`);
    res.setHeader('Content-Type', imageType);

    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      }
    });
  } catch (error) {
    console.error('Error handling download request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});