import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false, // For direct messages without a specific Room entity, this could be null, but usually we use private Rooms
  },
  content: {
    type: String,
    required: function() { return !this.fileUrl; }, // Either content or fileUrl must be present
  },
  fileUrl: {
    type: String, // Cloudinary URL
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
