import * as roomService from '../services/roomService.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

export const getDMs = async (req, res) => {
  try {
    const dms = await roomService.getDMs(req.userId);
    res.status(STATUS_CODES.OK).json(dms);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error fetching DMs' });
  }
};

export const createDM = async (req, res) => {
  try {
    const dm = await roomService.createOrGetDM(req.userId, req.params.userId);
    res.status(STATUS_CODES.CREATED).json(dm);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error creating DM' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const result = await roomService.markMessagesAsRead(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error marking messages as read' });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await roomService.getPublicRooms();
    res.status(STATUS_CODES.OK).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const createRoom = async (req, res) => {
  try {
    const room = await roomService.createRoom(req.body, req.userId);
    res.status(STATUS_CODES.CREATED).json(room);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const result = await roomService.joinPrivateRoom(req.params.id, req.userId, req.body.password);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error joining room' });
  }
};

export const requestAccess = async (req, res) => {
  try {
    const result = await roomService.requestAccess(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error joining room' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await roomService.getMessages(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(messages);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = await roomService.getPendingRequests(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(requests);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const approveUser = async (req, res) => {
  try {
    const result = await roomService.approveUser(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const result = await roomService.rejectUser(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
