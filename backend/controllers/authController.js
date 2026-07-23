import * as authService from '../services/authService.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

const validateAuthInput = (data, isLogin = false) => {
  const errors = {};
  
  const email = data.email?.trim() || '';
  const password = data.password || '';
  const username = data.username?.trim() || '';
  const confirmPassword = data.confirmPassword || '';

  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (!isLogin) {
    if (password.length < 8) errors.password = 'Password must be at least 8 characters long.';
    else if (!/(?=.*[a-z])/.test(password)) errors.password = 'Password must contain at least one lowercase letter.';
    else if (!/(?=.*[A-Z])/.test(password)) errors.password = 'Password must contain at least one uppercase letter.';
    else if (!/(?=.*\d)/.test(password)) errors.password = 'Password must contain at least one number.';
    else if (!/(?=.*[!@#$%^&*])/.test(password)) errors.password = 'Password must contain at least one special character.';
  }

  if (!isLogin) {
    if (!username) errors.username = 'Username is required.';
    else if (username.length < 3 || username.length > 20) errors.username = 'Username must be between 3 and 20 characters.';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Username can only contain letters, numbers, and underscores.';

    if (!confirmPassword) errors.confirmPassword = 'Confirm Password is required.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  }

  return { errors, isValid: Object.keys(errors).length === 0, sanitized: { username, email: email.toLowerCase(), password } };
};

export const register = async (req, res) => {
  try {
    const { errors, isValid, sanitized } = validateAuthInput(req.body, false);
    if (!isValid) return res.status(STATUS_CODES.BAD_REQUEST).json({ errors });

    const result = await authService.registerUser(sanitized);
    res.status(STATUS_CODES.CREATED).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(error.errors ? { errors: error.errors } : { message: error.message });
    }
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const login = async (req, res) => {
  try {
    const { errors, isValid, sanitized } = validateAuthInput(req.body, true);
    if (!isValid) return res.status(STATUS_CODES.BAD_REQUEST).json({ errors });

    const result = await authService.loginUser(sanitized);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { interests } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (interests !== undefined) {
      let parsedInterests = interests;
      if (typeof interests === 'string') {
        try {
          parsedInterests = JSON.parse(interests);
        } catch (e) {
          parsedInterests = interests.split(',').map(i => i.trim()).filter(Boolean);
        }
      }
      updateData.interests = Array.isArray(parsedInterests) ? parsedInterests : [parsedInterests];
    }

    if (req.file && req.file.path) {
      updateData.avatar = req.file.path;
    }

    const result = await authService.updateProfile(userId, updateData);
    res.status(STATUS_CODES.OK).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Profile update error:', error);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: 'Server error updating profile' });
  }
};
