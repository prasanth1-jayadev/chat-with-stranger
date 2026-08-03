import express from 'express';
import { authMiddleware, isAdmin } from '../middleware/auth.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

// User route to create report
router.post('/', authMiddleware, reportController.createReport);

// Super-Admin routes for reports queue
router.get('/', authMiddleware, isAdmin, reportController.getReports);
router.patch('/:id/resolve', authMiddleware, isAdmin, reportController.resolveReport);

export default router;
