import * as userService from '../services/userService.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(STATUS_CODES.OK).json(user);
  } catch (error) {
    next(error);
  }
};

export const getMyFriends = async (req, res, next) => {
  try {
    const data = await userService.getFriendsAndRequests(req.userId);
    res.status(STATUS_CODES.OK).json(data);
  } catch (error) {
    next(error);
  }
};

export const sendRequest = async (req, res, next) => {
  try {
    const result = await userService.sendFriendRequest(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const result = await userService.acceptFriendRequest(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const result = await userService.rejectFriendRequest(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeFriend = async (req, res, next) => {
  try {
    const result = await userService.removeFriend(req.userId, req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};
