import express from 'express';
import { authMiddleware, isAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', authMiddleware, isAdmin, adminController.getUsers);
router.get('/rooms', authMiddleware, isAdmin, adminController.getRooms);
router.get('/stats', authMiddleware, isAdmin, adminController.getStats);
router.get('/analytics', authMiddleware, isAdmin, adminController.getAnalytics);
router.patch('/users/:id/ban', authMiddleware, isAdmin, adminController.toggleBanUser);
router.patch('/users/:id/mute', authMiddleware, isAdmin, adminController.toggleMuteUser);
router.patch('/users/:id/role', authMiddleware, isAdmin, adminController.toggleAdminRole);
router.patch('/rooms/:id/quarantine', authMiddleware, isAdmin, adminController.toggleQuarantineRoom);
router.delete('/rooms/:id', authMiddleware, isAdmin, adminController.deleteRoom);

export default router;
