import express from 'express';
import { upload } from '../middleware/cloudinary.js';
import { authMiddleware } from '../middleware/auth.js';
import * as uploadController from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', authMiddleware, upload.single('image'), uploadController.uploadImage);

export default router;
