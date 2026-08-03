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
router.post('/:id/remove/:userId', roomController.removeUser);
router.get('/:id/members', roomController.getRoomMembers);
router.post('/:id/ban/:userId', roomController.banUser);
router.post('/:id/unban/:userId', roomController.unbanUser);
router.post('/:id/leave', roomController.leaveRoom);
router.delete('/:id', roomController.deleteRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id/messages/:messageId', roomController.deleteMessage);
router.put('/:id/pin', roomController.updatePinnedAnnouncement);

export default router;

