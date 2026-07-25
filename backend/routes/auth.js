import express from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator'; 
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/cloudinary.js';
import * as authController from '../controllers/authController.js';
import { validateRequest } from '../middleware/validate.js'; 


const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests from this IP, please try again later.' }
});


const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').trim().isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest // Run the checker
];




const loginValidation = [
  body('email').trim().isEmail().withMessage('Must be a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest // Run the checker
];

router.post('/register',registerValidation, authLimiter, authController.register);
router.post('/login', authLimiter,loginValidation, authController.login);
router.put('/profile', authMiddleware, upload.single('avatar'), authController.updateProfile);

export default router;
