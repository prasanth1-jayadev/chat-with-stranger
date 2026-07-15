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
  }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
