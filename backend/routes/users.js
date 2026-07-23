import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/me/friends', userController.getMyFriends);
router.get('/:id', userController.getUser);
router.post('/:id/request', userController.sendRequest);
router.post('/:id/accept', userController.acceptRequest);
router.post('/:id/reject', userController.rejectRequest);
router.post('/:id/remove', userController.removeFriend);

export default router;
