import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reportedRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  reportedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  strangerSession: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['user', 'message', 'room', 'stranger'],
    default: 'user',
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  messageSnippet: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
  },
  actionTaken: {
    type: String,
    enum: ['none', 'dismissed', 'user_banned', 'message_deleted', 'warned'],
    default: 'none',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Report', reportSchema);
