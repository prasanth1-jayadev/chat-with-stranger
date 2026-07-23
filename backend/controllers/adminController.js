import * as adminService from '../services/adminService.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

export const getUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(STATUS_CODES.OK).json(users);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error fetching users' });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await adminService.getAllRooms();
    res.status(STATUS_CODES.OK).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error fetching rooms' });
  }
};
