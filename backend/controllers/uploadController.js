import { STATUS_CODES } from '../constants/statusCodes.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: 'No file provided' });
    }
    
    res.status(STATUS_CODES.OK).json({ imageUrl: req.file.path });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error during upload' });
  }
};
