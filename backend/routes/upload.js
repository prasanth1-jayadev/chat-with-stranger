import express from 'express';
import { upload } from '../middleware/cloudinary.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Upload a single image to Cloudinary and return the URL
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    // The cloudinary storage engine automatically attaches the path (URL)
    res.json({ imageUrl: req.file.path });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

export default router;
