import express from 'express';
import { authMiddleware, isAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', authMiddleware, isAdmin, adminController.getUsers);
router.get('/rooms', authMiddleware, isAdmin, adminController.getRooms);
router.get('/stats', authMiddleware, isAdmin, adminController.getStats);
router.patch('/users/:id/ban', authMiddleware, isAdmin, adminController.toggleBanUser);
router.delete('/rooms/:id', authMiddleware, isAdmin, adminController.deleteRoom);

export default router;
