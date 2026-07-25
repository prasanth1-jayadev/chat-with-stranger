import { STATUS_CODES } from '../constants/statusCodes.js';
import AppError from '../utils/AppError.js';

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file provided', 400));
    }
    
    res.status(STATUS_CODES.OK).json({ imageUrl: req.file.path });
  } catch (error) {
    next(error);
  }
};
