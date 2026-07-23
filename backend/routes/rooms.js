import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as roomController from '../controllers/roomController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/dms', roomController.getDMs);
router.post('/dms/:userId', roomController.createDM);
router.post('/:id/read', roomController.markAsRead);
router.get('/', roomController.getRooms);
router.post('/', roomController.createRoom);
router.post('/:id/join', roomController.joinRoom);
router.post('/:id/request-access', roomController.requestAccess);
router.get('/:id/messages', roomController.getMessages);
router.get('/:id/requests', roomController.getRequests);
router.post('/:id/approve/:userId', roomController.approveUser);
router.post('/:id/reject/:userId', roomController.rejectUser);

export default router;
