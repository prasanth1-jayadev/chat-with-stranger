import * as userService from '../services/userService.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(STATUS_CODES.OK).json(user);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const getMyFriends = async (req, res) => {
  try {
    const data = await userService.getFriendsAndRequests(req.userId);
    res.status(STATUS_CODES.OK).json(data);
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const sendRequest = async (req, res) => {
  try {
    const result = await userService.sendFriendRequest(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const result = await userService.acceptFriendRequest(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const result = await userService.rejectFriendRequest(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const result = await userService.removeFriend(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
