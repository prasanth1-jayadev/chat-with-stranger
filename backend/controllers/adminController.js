import * as adminService from '../services/adminService.js';
import { getSocketStats } from '../socket/socketHandler.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

export const getUsers = async (req, res, next) => {
  try {
    const {page =1,limit =10 , search="",filter="all"} =req.query;
    const data = await adminService.getAllUsers(page,limit,search,filter);
    res.status(STATUS_CODES.OK).json(data);
    
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (req, res, next) => {
  try {
    const { search = '', filter = 'all' } = req.query;
    const rooms = await adminService.getAllRooms(search, filter);
    res.status(STATUS_CODES.OK).json(rooms);
  } catch (error) {
    next(error);
  }
};

export const toggleBanUser = async (req, res, next) => {
  try {
    const updatedUser = await adminService.toggleBanUser(req.params.id);
    res.status(STATUS_CODES.OK).json({
      message: `User ${updatedUser.isBanned ? 'banned' : 'unbanned'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleMuteUser = async (req, res, next) => {
  try {
    const { durationHours = 24 } = req.body;
    const updatedUser = await adminService.toggleMuteUser(req.params.id, durationHours);
    res.status(STATUS_CODES.OK).json({
      message: `User ${updatedUser.isMuted ? 'muted' : 'unmuted'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminRole = async (req, res, next) => {
  try {
    const updatedUser = await adminService.toggleAdminRole(req.params.id, req.userId);
    res.status(STATUS_CODES.OK).json({
      message: `User is now ${updatedUser.isAdmin ? 'an admin' : 'a regular user'}`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleQuarantineRoom = async (req, res, next) => {
  try {
    const updatedRoom = await adminService.toggleQuarantineRoom(req.params.id);
    res.status(STATUS_CODES.OK).json({
      message: `Room ${updatedRoom.isQuarantined ? 'quarantined' : 'restored'} successfully`,
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const result = await adminService.deleteRoom(req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = getSocketStats();
    res.status(STATUS_CODES.OK).json(stats);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics();
    res.status(STATUS_CODES.OK).json(analytics);
  } catch (error) {
    next(error);
  }
};