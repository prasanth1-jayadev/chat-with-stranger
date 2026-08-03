import bcrypt from 'bcrypt';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = async ({ username, email, password }) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new AppError('Validation Error', 400, { email: 'Email is already in use.' });
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new AppError('Validation Error', 400, { username: 'Username is already taken.' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  await newUser.save();
  return { message: 'User registered successfully' };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }
  
   if (user.isBanned) {
    throw new AppError('Your account has been banned due to a violation of our terms.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

    const token = generateToken(user._id, user.isAdmin);


  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      interests: user.interests,
    }
  };
};

export const updateProfile = async (userId, updateData) => {
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' }).select('-password');
  
  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  return {
    message: 'Profile updated successfully',
    user: {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      isAdmin: updatedUser.isAdmin,
      interests: updatedUser.interests,
    }
  };
};
