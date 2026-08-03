import * as roomService from '../services/roomService.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

export const getDMs = async (req, res, next) => {
  try {
    const dms = await roomService.getDMs(req.userId);
    res.status(STATUS_CODES.OK).json(dms);
  } catch (error) {
    next(error);
  }
};

export const createDM = async (req, res, next) => {
  try {
    const dm = await roomService.createOrGetDM(req.userId, req.params.userId);
    res.status(STATUS_CODES.CREATED).json(dm);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await roomService.markMessagesAsRead(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await roomService.getPublicRooms(page, limit);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

 

export const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body, req.userId);
    res.status(STATUS_CODES.CREATED).json(room);
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req, res, next) => {
  try {
    const result = await roomService.joinPrivateRoom(req.params.id, req.userId, req.body.password);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const requestAccess = async (req, res, next) => {
  try {
    const result = await roomService.requestAccess(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const messages = await roomService.getMessages(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(messages);
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const requests = await roomService.getPendingRequests(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(requests);
  } catch (error) {
    next(error);
  }
};

export const approveUser = async (req, res, next) => {
  try {
    const result = await roomService.approveUser(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const rejectUser = async (req, res, next) => {
  try {
    const result = await roomService.rejectUser(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const result = await roomService.removeUserFromRoom(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await roomService.updateRoom(req.params.id, req.userId, req.body);
    res.status(STATUS_CODES.OK).json(updatedRoom);
  } catch (error) {
    next(error);
  }
};

export const getRoomMembers = async (req, res, next) => {
  try {
    const membersData = await roomService.getRoomMembers(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(membersData);
  } catch (error) {
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const result = await roomService.banUserFromRoom(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (req, res, next) => {
  try {
    const result = await roomService.unbanUserFromRoom(req.params.id, req.userId, req.params.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const result = await roomService.deleteRoom(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const result = await roomService.leaveRoom(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const result = await roomService.deleteMessage(req.params.id, req.params.messageId, req.userId);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};




export const updatePinnedAnnouncement = async (req, res, next) => {
  try {
    const result = await roomService.updatePinnedAnnouncement(req.params.id, req.userId, req.body.text);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};
