import * as adminService from '../services/adminService.js';
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
    const rooms = await adminService.getAllRooms();
    res.status(STATUS_CODES.OK).json(rooms);
  } catch (error) {
    next(error);
  }
};



export const toggleBanUser = async (req,res,next)=>{
  try{
    const updatedUser = await adminService.toggleBanUser(req.params.id);
    res.status(STATUS_CODES.OK).json({
      message:`User ${updatedUser.isBanned ? 'banned' : 'unbanned'} successfully`,
      user:updatedUser
    });
  } catch (error) {
    next(error);
  }
}


export const deleteRoom = async (req, res, next) => {
  try {
    const result = await adminService.deleteRoom(req.params.id);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    next(error);
  }
};

import { getSocketStats } from '../socket/socketHandler.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = getSocketStats();
    res.status(STATUS_CODES.OK).json(stats);
  } catch (error) {
    next(error);
  }
};