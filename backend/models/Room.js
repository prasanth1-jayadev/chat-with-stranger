import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return !this.isPrivate; }, // Name is required for public rooms
    trim: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  description: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  requiresApproval: {
    type: Boolean,
    default: false,
  },
  pendingApprovals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  password: {
    type: String,
  }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
